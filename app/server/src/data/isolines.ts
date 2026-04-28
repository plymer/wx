import { and, gt, eq, Relations, between } from "drizzle-orm";
import { generateDbConnection } from "../lib/utils.js";
import { metars, stations } from "../db/tables/data.drizzle.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { HOUR, MINUTE } from "../lib/constants.js";
import { tupleArrayToGeoJSON, type Tuple2DWithValue } from "@plymer/fast-barnes-ts";
import type { FeatureCollection, LineString, MultiPolygon, Point } from "geojson";
import geojsonvt from "geojson-vt";
import { fromGeojsonVt } from "vt-pbf";
import { promises as fs } from "node:fs";
import path from "node:path";

const bbox = [-180, 15, 50, 85]; // [west, south, east, north]

const MIN_ZOOM = 2;
const MAX_ZOOM = 8;
const TILESET_SLOT_COUNT = 19;
const TILESET_NEWEST_SLOT = TILESET_SLOT_COUNT - 1;
const TILESET_MAX_AGE = 3 * HOUR;
const TILESET_STAGING_DIR = "tmp";
const TILESET_METADATA_FILE = "metadata.json";

type GeoJSONVTIndex = ReturnType<typeof geojsonvt>;
type GeoJSONVTTile = ReturnType<GeoJSONVTIndex["getTile"]>;

type TilesetMetadata = {
  generatedAt: number;
  generatedAtIso: string;
  layers: string[];
  emittedTiles: number;
  minZoom: number;
  maxZoom: number;
};

async function writeTileBuffer(tileFilePath: string, tileBuffer: Uint8Array) {
  await fs.mkdir(path.dirname(tileFilePath), { recursive: true });

  const tempPath = `${tileFilePath}.tmp`;
  await fs.writeFile(tempPath, tileBuffer);
  await fs.rename(tempPath, tileFilePath);
}

function getSlotPath(tilesDir: string, index: number) {
  return path.join(tilesDir, index.toString());
}

async function readSlotMetadata(slotPath: string) {
  const metadataPath = path.join(slotPath, TILESET_METADATA_FILE);

  try {
    const raw = await fs.readFile(metadataPath, "utf-8");
    return JSON.parse(raw) as TilesetMetadata;
  } catch {
    return null;
  }
}

async function shiftTileSlots(tilesDir: string) {
  for (let index = 1; index < TILESET_SLOT_COUNT; index++) {
    const source = getSlotPath(tilesDir, index);
    const destination = getSlotPath(tilesDir, index - 1);

    await fs.rm(destination, { recursive: true, force: true });

    try {
      await fs.rename(source, destination);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      if (err.code !== "ENOENT") {
        throw error;
      }
    }
  }
}

async function finalizeTilesetRotation(tilesDir: string, runTimestamp: number) {
  const oldestSlotPath = getSlotPath(tilesDir, 0);
  const oldestMetadata = await readSlotMetadata(oldestSlotPath);

  if (oldestMetadata) {
    const ageMs = runTimestamp - oldestMetadata.generatedAt;
    if (ageMs < TILESET_MAX_AGE) {
      console.warn(
        `[ISOLINES] Rotating slot 0 with age ${Math.round(ageMs / MINUTE)}m (< ${Math.round(TILESET_MAX_AGE / MINUTE)}m window).`,
      );
    }
  }

  await fs.rm(oldestSlotPath, { recursive: true, force: true });
  await shiftTileSlots(tilesDir);

  const newestSlotPath = getSlotPath(tilesDir, TILESET_NEWEST_SLOT);
  const stagingPath = path.join(tilesDir, TILESET_STAGING_DIR);

  await fs.rm(newestSlotPath, { recursive: true, force: true });
  await fs.rename(stagingPath, newestSlotPath);
}

export async function createIsolines<TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>>(
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>,
) {
  if (!db) {
    throw new Error("[ISOLINES] Database connection failed.");
  }

  const now = new Date().getTime();
  const tilesRootDir = process.env.TILES_DIR
    ? path.resolve(process.env.TILES_DIR)
    : path.resolve(process.cwd(), "tiles", "isolines");
  const outputDir = path.join(tilesRootDir, TILESET_STAGING_DIR);

  await fs.mkdir(tilesRootDir, { recursive: true });
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const queryResult = await db
    .select({
      siteId: metars.siteId,
      validTime: metars.validTime,
      mslp: metars.mslp,
      tt: metars.tt,
      td: metars.td,
      lat: stations.lat,
      lon: stations.lon,
    })
    .from(metars)
    .leftJoin(stations, eq(stations.siteId, metars.siteId))
    .where(
      and(
        gt(metars.validTime, new Date(now - 4 * HOUR)),
        between(stations.lon, bbox[0], bbox[2]),
        between(stations.lat, bbox[1], bbox[3]),
      ),
    );

  const collatedData: Record<
    string,
    {
      lat: number;
      lon: number;
      values: { mslp: number | null; tt: number | null; td: number | null; validTime: Date }[];
    }
  > = {};

  const BLACKLISTED_SITES = ["PACX", "PFTO"];

  queryResult.forEach((metar) => {
    const { mslp, tt, td, validTime, lat, lon, siteId } = metar;

    if (!lat || !lon || BLACKLISTED_SITES.includes(siteId)) {
      return;
    }

    if (collatedData[metar.siteId]) {
      collatedData[metar.siteId].values.push({ mslp, tt, td, validTime });
    } else {
      collatedData[metar.siteId] = { lat, lon, values: [{ mslp, tt, td, validTime }] };
    }
  });

  const baseResolution = 2048;

  const DATA_TYPES = ["mslp", "tt", "td"] as const;
  const featureCollectionsByType: Partial<
    Record<
      (typeof DATA_TYPES)[number],
      FeatureCollection<Point | LineString | MultiPolygon, { value: number } | { kind: "max" | "min"; value: number }>
    >
  > = {};

  const CONFIG: Record<
    (typeof DATA_TYPES)[number],
    { spacing: number; resolution: number | readonly [number, number]; sigma: ReadonlyArray<number>; smooth: boolean }
  > = {
    mslp: {
      spacing: 4,
      resolution: [baseResolution, baseResolution / 1.45],
      sigma: [1.1, 2.2],
      smooth: true,
    },
    tt: {
      spacing: 5,
      resolution: [baseResolution * 2, (baseResolution * 2) / 1.45],
      sigma: [0.5, 1.0],
      smooth: true,
    },
    td: { spacing: 5, resolution: [baseResolution * 2, (baseResolution * 2) / 1.45], sigma: [0.4, 0.6], smooth: true },
  };

  for (const type of DATA_TYPES) {
    // for the time being, we are going to skip generating isolines for tt/td because the performance isn't super great on the client and I might want to adjust how we handle it there
    if (type === "tt" || type === "td") {
      console.info(`[ISOLINES] Skipping isoline generation for '${type}'.`);
      continue;
    }

    const fcArray: FeatureCollection<
      Point | LineString | MultiPolygon,
      { value: number } | { kind: "max" | "min"; value: number }
    >[] = [];
    console.log(
      `[ISOLINES] Processing isolines for type '${type}' with ${Object.keys(collatedData).length} data points.`,
    );

    const tupleData = Object.values(collatedData).reduce<Tuple2DWithValue[]>((acc, data) => {
      const { lat, lon, values } = data;
      const computedTime = now - 10 * MINUTE;

      const dataForTime = values
        .sort((a, b) => {
          const aDiff = computedTime - new Date(a.validTime).getTime();
          const bDiff = computedTime - new Date(b.validTime).getTime();
          return aDiff - bDiff;
        })
        .find(
          (m) =>
            new Date(m.validTime).getTime() <= computedTime &&
            new Date(m.validTime).getTime() >= computedTime - 4 * HOUR,
        );

      if (dataForTime) {
        if (!dataForTime[type]) return acc;

        acc.push([lon, lat, dataForTime[type]]);
      }

      return acc;
    }, []);

    // convert the tuple data to GeoJSON features with the mslp value as a property

    const features = tupleArrayToGeoJSON(tupleData, "isolines", {
      contourOptions: { spacing: CONFIG[type].spacing, smooth: CONFIG[type].smooth },
      resolution: CONFIG[type].resolution,
      sigma: CONFIG[type].sigma,
      barnesOptions: { maxDist: 3.717, numIter: 18 },
      coordinateMode: "spherical",
      sphericalOptions: { standardParallels: [42.5, 65.5] },
      extrema: type === "mslp" ? { minProminence: 0.00001, minSeparation: 36 } : false,
    })
      .features.filter((f) => {
        if ("kind" in f.properties) {
          if (f.properties.kind !== "max" && f.properties.kind !== "min") {
            return false;
          } else {
            return true;
          }
        } else if ("value" in f.properties && !("kind" in f.properties)) {
          return true;
        }
      })
      .map((f) => {
        if ("kind" in f.properties) {
          return {
            ...f,
            properties: {
              ...f.properties,
              value: f.properties.kind === "max" ? Math.ceil(f.properties.value) : Math.floor(f.properties.value),
            },
          };
        } else return f;
      });

    fcArray.push({ type: "FeatureCollection", features });

    if (fcArray[0]?.features.length) {
      featureCollectionsByType[type] = fcArray[0];
    }

    console.log(`[ISOLINES] Completed isoline processing for type '${type}'.`);
  }

  const layerIndexes = Object.entries(featureCollectionsByType).reduce<Record<string, GeoJSONVTIndex>>(
    (acc, [layerName, featureCollection]) => {
      if (!featureCollection || !featureCollection.features.length) {
        return acc;
      }

      acc[layerName] = geojsonvt(
        featureCollection as FeatureCollection<Point | LineString | MultiPolygon, Record<string, unknown>>,
        {
          maxZoom: MAX_ZOOM,
          indexMaxZoom: MAX_ZOOM,
          indexMaxPoints: 0,
          tolerance: 3,
          extent: 4096,
          buffer: 64,
          lineMetrics: false,
          promoteId: null,
          generateId: false,
        },
      );

      return acc;
    },
    {},
  );

  const layerNames = Object.keys(layerIndexes);

  if (!layerNames.length) {
    await fs.rm(outputDir, { recursive: true, force: true });
    console.warn("[ISOLINES] No feature collections were generated; skipping tile output.");
    return;
  }

  let emittedTiles = 0;

  for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
    const tileDimension = 1 << z;
    let zoomTileCount = 0;

    for (let x = 0; x < tileDimension; x++) {
      for (let y = 0; y < tileDimension; y++) {
        const tileLayers = layerNames.reduce<Record<string, Exclude<GeoJSONVTTile, null>>>((acc, layerName) => {
          const tile = layerIndexes[layerName].getTile(z, x, y) as GeoJSONVTTile | null;

          if (!tile || !tile.features?.length) {
            return acc;
          }

          acc[layerName] = tile;
          return acc;
        }, {});

        if (!Object.keys(tileLayers).length) {
          continue;
        }

        const tilePath = path.join(outputDir, z.toString(), x.toString(), `${y}.pbf`);
        const tileBuffer = fromGeojsonVt(tileLayers as unknown as Parameters<typeof fromGeojsonVt>[0], {
          version: 2,
          extent: 4096,
        });
        await writeTileBuffer(tilePath, tileBuffer);

        emittedTiles += 1;
        zoomTileCount += 1;
      }
    }

    console.log(`[ISOLINES] z${z}: wrote ${zoomTileCount} tiles to '${path.join(outputDir, z.toString())}'.`);
  }

  const metadata: TilesetMetadata = {
    generatedAt: now,
    generatedAtIso: new Date(now).toISOString(),
    layers: layerNames,
    emittedTiles,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  };

  await fs.writeFile(path.join(outputDir, TILESET_METADATA_FILE), JSON.stringify(metadata));
  await finalizeTilesetRotation(tilesRootDir, now);

  console.log(
    `[ISOLINES] Wrote ${emittedTiles} vector tiles to slot ${TILESET_NEWEST_SLOT} under '${getSlotPath(tilesRootDir, TILESET_NEWEST_SLOT)}'.`,
  );

  console.log(`[ISOLINES] Processing completed and results were cached.`);
}
