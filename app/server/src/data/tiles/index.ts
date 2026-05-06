// generate tiles with the following data:
// - isobars
// - station plots
// - popups for station plots
// - public alerts
// - lightning strikes

import type { Feature, FeatureCollection, GeoJsonProperties, LineString, MultiPoint, Point } from "geojson";

import geojsonvt from "geojson-vt";
import { fromGeojsonVt as vtToPbf } from "vt-pbf";
import Supercluster from "supercluster";
import { promises as fs } from "node:fs";
import path from "node:path";

import { MINUTE } from "../../lib/constants.js";
import type { PayloadType } from "./types.js";
import { getStationCache } from "./redis.js";

const MIN_ZOOM = 2;
const MAX_ZOOM = 8;
const VECTOR_TILE_EXTENT = 4096;
const CLUSTER_TIMESTEP_BUCKET = 10 * MINUTE;
const LATEST_SLICE_GRACE_PERIOD = 2 * MINUTE;

const TILESET_STAGING_DIR = "tmp";
const TILESET_METADATA_FILE = "metadata.json";
const TILE_WRITE_CONCURRENCY = 32;
type GeoJSONVT = ReturnType<typeof geojsonvt>;
type TileLayers = Parameters<typeof vtToPbf>[0];

type TilesetMetadata = {
  generatedAt: number;
  generatedAtIso: string;
  layers: string[];
  emittedTiles: number;
  minZoom: number;
  maxZoom: number;
};

type ClusterPointProperties<TData extends GeoJsonProperties = GeoJsonProperties> = Exclude<TData, null> &
  Partial<{
    validTime: number;
    startTime: number;
    expiryTime: number;
    groupIds: string;
    groupSeverity: number;
    groupLatestTimeString: string;
  }>;

function flattenToPoints<TData extends GeoJsonProperties>(
  featureCollection: FeatureCollection<Point | MultiPoint, TData>,
): FeatureCollection<Point, ClusterPointProperties<TData>> {
  const features = featureCollection.features.flatMap((feature) => {
    const validTimeRaw = Number(feature.properties?.validTime);
    const validTime = Number.isFinite(validTimeRaw) ? validTimeRaw : undefined;
    const geometry = feature.geometry;

    if (!geometry) {
      return [];
    }

    const coordinates = geometry.type === "Point" ? [geometry.coordinates] : geometry.coordinates;

    return coordinates
      .filter(([lon, lat]) => Number.isFinite(lon) && Number.isFinite(lat))
      .map((coordinate) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: coordinate,
        },
        properties: {
          ...(feature.properties ?? {}),
          validTime,
        } as ClusterPointProperties<TData>,
      }));
  });

  return {
    type: "FeatureCollection",
    features,
  };
}

function buildClusteredFc<TData extends GeoJsonProperties>(
  points: FeatureCollection<Point, ClusterPointProperties<TData>>,
  layerName: PayloadType,
  layerConfig: { maxZoom: number; clusterRadius: number } | undefined,
) {
  if (!layerConfig) {
    throw new Error(`Missing cluster configuration for layer '${layerName}'.`);
  }

  type ClusterProperties = ClusterPointProperties<TData>;

  const tiles = new Supercluster<ClusterProperties, ClusterProperties>({
    radius: layerConfig.clusterRadius,
    extent: VECTOR_TILE_EXTENT,
    maxZoom: layerConfig.maxZoom,
    minPoints: 2,
    map: (props) => ({
      ...props,
      // ...(layerName === "pirep"
      //   ? { groupIds: props.id, groupSeverity: props.severityRank, groupLatestTimeString: props.timeString }
      //   : {}),
    }),
    reduce: (acc, props) => {
      const accValidTime = acc.validTime ?? Number.NEGATIVE_INFINITY;
      const propsValidTime = props.validTime ?? Number.NEGATIVE_INFINITY;
      const hasNewerValidTime = propsValidTime > accValidTime;

      // Keep latest-member properties on the cluster so decoded fields remain available.
      if (hasNewerValidTime) {
        // const existingGroupIds = acc.groupIds;
        // const existingGroupSeverity = acc.groupSeverity;
        // const existingGroupLatestTimeString = acc.groupLatestTimeString;

        Object.assign(acc, props);

        // if (layerName === "pirep") {
        //   acc.groupIds = existingGroupIds;
        //   acc.groupSeverity = existingGroupSeverity;
        //   acc.groupLatestTimeString = existingGroupLatestTimeString;
        // }
      }

      if (props.startTime !== undefined) {
        acc.startTime = acc.startTime === undefined ? props.startTime : Math.min(acc.startTime, props.startTime);
      }

      if (props.expiryTime !== undefined) {
        acc.expiryTime = acc.expiryTime === undefined ? props.expiryTime : Math.max(acc.expiryTime, props.expiryTime);
      }

      if (props.validTime !== undefined && (acc.validTime === undefined || props.validTime > acc.validTime)) {
        acc.validTime = propsValidTime;
      }

      //   if (layerName === "pirep") {
      //     if (props.id !== undefined) {
      //       acc.groupIds = acc.groupIds ? `${acc.groupIds}|${props.id}` : String(props.id);
      //     }

      //     acc.groupSeverity = Math.max(acc.groupSeverity ?? 0, props.severityRank ?? 0);

      //     if (hasNewerValidTime && props.timeString !== undefined) {
      //       acc.groupLatestTimeString = String(props.timeString);
      //     }

      //     if (!acc.groupLatestTimeString && props.timeString !== undefined) {
      //       acc.groupLatestTimeString = String(props.timeString);
      //     }
      //   }
      // },
    },
  });

  tiles.load(points?.features);
  return { tiles, featureCollection: points };
}

function getFeatureTimeWindow(feature: Feature<Point, ClusterPointProperties>) {
  const props = feature.properties;

  if (
    !props ||
    props.startTime === undefined ||
    props.expiryTime === undefined ||
    props.expiryTime <= props.startTime
  ) {
    return null;
  }

  return {
    startTime: props.startTime,
    expiryTime: props.expiryTime,
    validTime: props.validTime ?? props.startTime,
  };
}

function buildSliceClusterIndexes<TData extends GeoJsonProperties>(
  points: FeatureCollection<Point, ClusterPointProperties<TData>>,
  layerName: PayloadType,
  layerConfig: { maxZoom: number; clusterRadius: number } | undefined,
) {
  const bounds = points.features.reduce<{ minStart: number; maxExpiry: number } | null>((acc, feature) => {
    const timeWindow = getFeatureTimeWindow(feature);

    if (!timeWindow) return acc;

    if (!acc) return { minStart: timeWindow.startTime, maxExpiry: timeWindow.expiryTime };

    return {
      minStart: Math.min(acc.minStart, timeWindow.startTime),
      maxExpiry: Math.max(acc.maxExpiry, timeWindow.expiryTime),
    };
  }, null);

  if (!bounds) {
    return new Map<number, Supercluster<ClusterPointProperties<TData>, ClusterPointProperties<TData>>>();
  }

  const currentMinute = Math.floor(Date.now() / MINUTE) * MINUTE;
  let firstSliceStart = currentMinute;

  while (firstSliceStart > bounds.minStart) {
    firstSliceStart -= CLUSTER_TIMESTEP_BUCKET;
  }
  const sliceIndexes = new Map<number, Supercluster<ClusterPointProperties<TData>, ClusterPointProperties<TData>>>();

  for (let sliceStart = firstSliceStart; sliceStart < bounds.maxExpiry; sliceStart += CLUSTER_TIMESTEP_BUCKET) {
    const sliceExpiry = sliceStart + CLUSTER_TIMESTEP_BUCKET;
    const isMostRecentSlice = sliceStart + CLUSTER_TIMESTEP_BUCKET >= bounds.maxExpiry;
    const sliceVisibilityExpiry = isMostRecentSlice ? sliceExpiry + LATEST_SLICE_GRACE_PERIOD : sliceExpiry;

    const activeFeatures = points.features
      .filter((feature) => {
        const timeWindow = getFeatureTimeWindow(feature);
        const sliceWindowStart = isMostRecentSlice ? sliceStart - LATEST_SLICE_GRACE_PERIOD : sliceStart;
        return (
          !!timeWindow &&
          timeWindow.startTime <= sliceStart &&
          timeWindow.expiryTime > sliceWindowStart &&
          timeWindow.validTime <= sliceExpiry
        );
      })
      .map((feature) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          startTime: sliceStart,
          expiryTime: sliceVisibilityExpiry,
        },
      })) as Feature<Point, ClusterPointProperties<TData>>[];

    if (!activeFeatures.length) {
      continue;
    }

    const clustered = buildClusteredFc(
      {
        type: "FeatureCollection",
        features: activeFeatures,
      },
      layerName,
      layerConfig,
    );

    sliceIndexes.set(sliceStart, clustered.tiles);
  }

  return sliceIndexes;
}

async function writeTileBuffer(tileFilePath: string, tileBuffer: Uint8Array) {
  await fs.mkdir(path.dirname(tileFilePath), { recursive: true });

  const tempPath = `${tileFilePath}.tmp`;
  await fs.writeFile(tempPath, tileBuffer);
  await fs.rename(tempPath, tileFilePath);
}

async function finalizeTileLocation(outDir: string, rootDir: string) {
  // get the current contents of rootDir so we can clear out everything EXCEPT outDir
  const entries = await fs.readdir(rootDir);

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry);

    if (fullPath === outDir) continue;

    await fs.rm(fullPath, { recursive: true, force: true });
  }

  // move all of the outDir files
  const outEntries = await fs.readdir(outDir);

  for (const entry of outEntries) {
    await fs.rename(path.join(outDir, entry), path.join(rootDir, entry));
  }

  await fs.rm(outDir, { recursive: true, force: true });
}

function getTileDirs(tileSetName?: string) {
  const baseDir = process.env.TILES_DIR ? process.env.TILES_DIR : process.cwd();

  const rootDir =
    tileSetName !== undefined ? path.resolve(baseDir, "tiles", tileSetName) : path.resolve(baseDir, "tiles");

  const outDir = path.join(rootDir, TILESET_STAGING_DIR);

  return { rootDir, outDir };
}

export async function generateTiles(
  data: Partial<Record<PayloadType, FeatureCollection<Point | MultiPoint | LineString>>>,
  options: { tileSetName?: string },
) {
  type ZoomLevel = "min" | "med" | "max";

  console.info("\x1b[37m%s\x1b[0m", `ℹ️ Starting tile generation for layers: ${Object.keys(data).join(", ")}`);

  const now = new Date().getTime();

  const startTime = performance.now();

  const { rootDir, outDir } = getTileDirs(options.tileSetName);

  await fs.mkdir(rootDir, { recursive: true });
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const clusterConfig: Partial<
    Record<
      PayloadType,
      {
        maxZoom: number;
        clusterRadius: number;
        data: FeatureCollection<Point | MultiPoint> | undefined;
      }
    >
  > = {
    lightning: {
      maxZoom: 6,
      clusterRadius: 24,
      data: data.lightning as FeatureCollection<Point | MultiPoint> | undefined,
    },

    // pirep: {
    //   maxZoom: MAX_ZOOM,
    //   clusterRadius: 256,
    //   data: data.pirep as FeatureCollection<Point | MultiPoint> | undefined,
    // },
  };

  const stationList = (await getStationCache())?.data;

  const stationSetByZoom: Record<ZoomLevel, Set<string>> = {
    min: new Set(stationList?.min ?? []),
    med: new Set(stationList?.med ?? []),
    max: new Set(stationList?.max ?? []),
  };
  const hasStationFilterData =
    stationSetByZoom.min.size > 0 || stationSetByZoom.med.size > 0 || stationSetByZoom.max.size > 0;

  if (!hasStationFilterData) {
    console.warn(
      "[PAYLOADS] Station list cache is empty; land/popup tiles will be generated without station filtering.",
    );
  }

  const clusteredLayers = new Set(Object.keys(clusterConfig) as PayloadType[]);

  // generate geojson-vt tiles only for non-clustered layers
  const vectorTiles = Object.entries(data).reduce<Partial<Record<PayloadType, GeoJSONVT>>>(
    (acc, [layerName, featureCollection]) => {
      if (!featureCollection || !featureCollection.features.length) {
        return acc;
      }

      const layer = layerName as PayloadType;

      if (clusteredLayers.has(layer)) {
        return acc;
      }

      acc[layer] = geojsonvt(featureCollection, {
        maxZoom: MAX_ZOOM,
        indexMaxZoom: MAX_ZOOM,
        indexMaxPoints: 0,
        tolerance: 3,
        extent: VECTOR_TILE_EXTENT,
        buffer: 64,
        lineMetrics: false,
        promoteId: null,
        generateId: false,
      });

      return acc;
    },
    {} as Partial<Record<PayloadType, GeoJSONVT>>,
  );

  // generate the clustered output for the layers that need it
  const clusteredTilesBySlice = Object.entries(clusterConfig).reduce<
    Partial<Record<PayloadType, Map<number, Supercluster<ClusterPointProperties>>>>
  >(
    (acc, [layerName, clusterConfigEntry]) => {
      const featureCollection = clusterConfigEntry.data;
      if (!featureCollection || !featureCollection.features.length) {
        return acc;
      }

      const layer = layerName as PayloadType;

      console.log(
        "\x1b[34m%s\x1b[0m",
        `Clustering layer '${layer}' with ${featureCollection.features.length} features...`,
      );

      acc[layer] = buildSliceClusterIndexes(flattenToPoints(featureCollection), layer, clusterConfig[layer]);

      return acc;
    },
    {} as Partial<Record<PayloadType, Map<number, Supercluster<ClusterPointProperties>>>>,
  );
  const clusteredLayerSet = new Set(Object.keys(clusteredTilesBySlice) as PayloadType[]);

  const layerNames = [
    ...new Set([...Object.keys(vectorTiles), ...Object.keys(clusteredTilesBySlice)]),
  ] as PayloadType[];

  let emittedTiles = 0;
  let zoomTileCount = 0;

  // loop over our zoom levels, building out x-y tile grid
  // for each grid segment we need to verify if we're a) evaluating a clustered dataset and b) within a clustered threshold
  // if we are not clustered or beyond the clustering threshold, we pull from our 'general' vector tiles
  // otherwise we'll use the supercluster-generated tiles for that layer/zoom level
  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const tileDimension = 1 << z;
    const pendingWrites: Promise<void>[] = [];

    for (let x = 0; x < tileDimension; x++) {
      const xDir = path.join(outDir, z.toString(), x.toString());
      await fs.mkdir(xDir, { recursive: true });

      for (let y = 0; y < tileDimension; y++) {
        const tileLayers = layerNames.reduce<
          Record<string, geojsonvt.Tile | Supercluster.Tile<ClusterPointProperties, ClusterPointProperties>>
        >((acc, layer) => {
          const tile = (() => {
            if (!clusteredLayerSet.has(layer)) {
              return vectorTiles[layer]?.getTile(z, x, y);
            }

            const sliceIndexes = clusteredTilesBySlice[layer];

            if (!sliceIndexes || sliceIndexes.size === 0) {
              return null;
            }

            const mergedFeatures: Supercluster.Tile<ClusterPointProperties, ClusterPointProperties>["features"] = [];

            for (const clusteredIndex of sliceIndexes.values()) {
              const sliceTile = clusteredIndex.getTile(z, x, y);

              if (sliceTile?.features?.length) {
                mergedFeatures.push(...sliceTile.features);
              }
            }

            if (!mergedFeatures.length) {
              return null;
            }

            return {
              features: mergedFeatures,
              numPoints: mergedFeatures.length,
            } as unknown as Supercluster.Tile<ClusterPointProperties, ClusterPointProperties>;
          })();

          if (!tile || !tile.features?.length) return acc;

          if (layer === "plot" || layer === "popup") {
            if (!hasStationFilterData) {
              acc[layer] = tile;
              return acc;
            }

            const zoomLevel: ZoomLevel =
              z < (layer === "popup" ? 3 : 5.5) ? "min" : z < (layer === "popup" ? 4 : 6.5) ? "med" : "max";
            const allowedLandSites = stationSetByZoom[zoomLevel];

            const filteredFeatures = (tile.features as geojsonvt.Feature[]).filter((feature) => {
              const siteId = feature.tags?.siteId;
              return typeof siteId === "string" && allowedLandSites.has(siteId);
            });

            if (!filteredFeatures.length) return acc;

            acc[layer] = { ...(tile as geojsonvt.Tile), features: filteredFeatures };
            return acc;
          }

          acc[layer] = tile;
          return acc;
        }, {}) as unknown as TileLayers;

        if (!Object.keys(tileLayers).length) {
          continue;
        }

        const tilePath = path.join(xDir, `${y}.pbf`);
        const tileBuffer = vtToPbf(tileLayers, { version: 2, extent: VECTOR_TILE_EXTENT });
        pendingWrites.push(writeTileBuffer(tilePath, tileBuffer));

        if (pendingWrites.length >= TILE_WRITE_CONCURRENCY) {
          await Promise.all(pendingWrites.splice(0, pendingWrites.length));
        }

        emittedTiles += 1;
        zoomTileCount += 1;
      }
    }

    if (pendingWrites.length) {
      await Promise.all(pendingWrites);
    }
  }

  const metadata: TilesetMetadata = {
    generatedAt: now,
    generatedAtIso: new Date(now).toISOString(),
    layers: layerNames,
    emittedTiles: emittedTiles + zoomTileCount,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  };

  await fs.writeFile(path.join(outDir, TILESET_METADATA_FILE), JSON.stringify(metadata));

  await finalizeTileLocation(outDir, rootDir);
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(
    "\x1b[32m%s\x1b[0m",
    `🏁 Wrote ${emittedTiles} vector tiles (z${MIN_ZOOM}-z${MAX_ZOOM}) to '${rootDir}' in ${duration} seconds.`,
  );
}
