#!/usr/bin/node
import { asc, desc, gt, eq, Relations, gte } from "drizzle-orm";
import { generateTimeseriesGeoJson, limitResultsByKeys } from "./tiles/geoJson.js";
import type { PayloadType } from "./tiles/types.js";
import type { Feature, FeatureCollection, LineString, MultiPoint, Point, Position } from "geojson";
import { getCache, getStationCache, updateCache } from "./tiles/redis.js";
import { updateStationList } from "./tiles/stationList.js";

import { type Tuple2DWithValue, tupleArrayToGeoJSON } from "@plymer/fast-barnes-ts";
import { lightningData, metars, stations, tafs } from "../db/tables/data.drizzle.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import type { generateDbConnection } from "../lib/utils.js";
import { HOUR, MINUTE } from "../lib/constants.js";
import { PAYLOAD_TYPE } from "../config/tiles/index.js";
import type { StationPlotPopupData } from "../lib/types.js";
import { generateTiles } from "./tiles/index.js";

type IsolineInputDataPoint = {
  lat: number;
  lon: number;
  siteId: string;
  validTime: Date;
  mslp: number | null;
  tt: number | null;
  td: number | null;
};

const getIsolineInputFromPopupFeatures = (
  popupFeatures: Feature<Point, StationPlotPopupData>[],
): IsolineInputDataPoint[] => {
  const data = popupFeatures.reduce<IsolineInputDataPoint[]>((acc, feature) => {
    const [lon, lat] = feature.geometry.coordinates;

    const siteId = feature.properties?.siteId;

    if (!siteId) {
      return acc;
    }

    feature.properties.metars.forEach((metar) => {
      acc.push({
        lat,
        lon,
        siteId,
        validTime: new Date(metar.validTime),
        mslp: metar.mslp ?? null,
        tt: metar.tt ?? null,
        td: metar.td ?? null,
      });
    });

    return acc;
  }, []);

  return data;
};

const hasStationListData = (stationList: { min: string[]; med: string[]; max: string[] }) =>
  stationList.min.length > 0 || stationList.med.length > 0 || stationList.max.length > 0;

const ensureStationListCache = async () => {
  const stationCache = await getStationCache();

  if (hasStationListData(stationCache.data)) {
    return;
  }

  console.warn("[PAYLOADS] Station list cache is empty. Running station list refresh before tile generation.");
  await updateStationList();
};

export async function fetchSurfaceData<
  TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>,
>({
  db,
  order,
  hours,
  lastUpdatedTime = 0,
  limit,
}: {
  order: "asc" | "desc";
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>;
  hours?: number;
  lastUpdatedTime?: number;
  limit?: number;
}) {
  if (!db) {
    throw new Error("Database connection is required to fetch surface data");
  }
  // Build conditions for data order

  const start = lastUpdatedTime === 0 ? new Date(Date.now() - (hours ?? 4) * HOUR) : new Date(lastUpdatedTime);

  try {
    const queryResult = await db
      .select({
        siteId: metars.siteId,
        validTime: metars.validTime,
        mslp: metars.mslp,
        tt: metars.tt,
        td: metars.td,
        lat: stations.lat,
        lon: stations.lon,
        siteName: stations.name,
        siteCountry: stations.country,
        siteState: stations.state,
        windDir: metars.windDir,
        windSpd: metars.windSpd,
        windGst: metars.windGst,
        vis: metars.vis,
        wxString: metars.wxString,
        category: metars.category,
        rawText: metars.rawText,
      })
      .from(metars)
      .leftJoin(stations, eq(stations.siteId, metars.siteId))
      .where(gte(metars.validTime, start))
      .orderBy(order === "asc" ? asc(metars.validTime) : desc(metars.validTime));

    // Limit the result set per site
    const result = limit ? limitResultsByKeys(queryResult, limit, "siteId") : queryResult;

    return result;
  } catch (error) {
    console.error(`Error fetching surface data: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

// when we implement the isolines generation, we will need to do it every 10 minutes and then store it in the redis cache with a validTime similar to how we extract the correct metar data to display on wxmap

export async function generateIsolines({
  startTime,
  field,
  fieldInterval,
  data,
  interpolationSearchRadius,
}: {
  startTime: number;
  field: "mslp" | "tt" | "td";
  fieldInterval: number;
  data: IsolineInputDataPoint[];
  interpolationSearchRadius: number | ReadonlyArray<number>;
}) {
  startTime = Math.floor(startTime / (10 * MINUTE)) * 10 * MINUTE; // round down to nearest 10 minutes

  const BLACKLISTED_SITES = ["PACX", "PFTO"];

  const skippedStations = new Set<string>();

  try {
    const collatedData: Record<string, { lat: number; lon: number; values: { val: number; validTime: Date }[] }> = {};
    const outputFeatures: Feature[] = [];
    data.forEach((ob) => {
      const { lat, lon, siteId, validTime } = ob;
      const val = ob[field];
      if (!lat || !lon || !val || BLACKLISTED_SITES.includes(siteId)) {
        skippedStations.add(siteId);
        return;
      }
      if (collatedData[siteId]) {
        collatedData[siteId].values.push({ val, validTime });
      } else {
        collatedData[siteId] = {
          lat,
          lon,
          values: [{ val, validTime }],
        };
      }
    });

    const dataToInterpolate: Tuple2DWithValue[] = Object.values(collatedData).reduce<Tuple2DWithValue[]>(
      (acc, data) => {
        const { lat, lon, values } = data;
        if (!lat || !lon || !values.length) return acc;
        const dataForTime = values
          .sort((a, b) => {
            const aDiff = startTime - new Date(a.validTime).getTime();
            const bDiff = startTime - new Date(b.validTime).getTime();
            return aDiff - bDiff;
          })
          .find(
            (m) =>
              new Date(m.validTime).getTime() <= startTime && new Date(m.validTime).getTime() >= startTime - 4 * HOUR,
          );
        if (dataForTime) {
          if (!dataForTime.val) return acc;
          acc.push([lon, lat, dataForTime.val]);
        }
        return acc;
      },
      [],
    );

    const baseResolution = 2048;

    const fc = tupleArrayToGeoJSON(dataToInterpolate, "isolines", {
      contourOptions: { spacing: fieldInterval, smooth: true },
      resolution: [baseResolution, baseResolution / 1.45],
      sigma: interpolationSearchRadius,
      barnesOptions: { maxDist: 3.717, numIter: 18 },
      coordinateMode: "spherical",
      sphericalOptions: { standardParallels: [42.5, 65.5] },
      extrema: field === "mslp" ? { minProminence: 0.00001, minSeparation: 36 } : false,
    })
      .features.filter((feature) => {
        if ("kind" in feature.properties) {
          if (feature.properties.kind !== "max" && feature.properties.kind !== "min") {
            return false;
          } else {
            return true;
          }
        } else {
          return true;
        }
      })
      .map((feature) => {
        const baseProperties = {
          ...(feature.properties ?? {}),
          startTime,
          expiryTime: startTime + 10 * MINUTE,
        };

        if (feature.properties && "kind" in feature.properties) {
          return {
            ...feature,
            properties: {
              ...baseProperties,
              value:
                feature.properties.kind === "max"
                  ? Math.ceil(feature.properties.value)
                  : Math.floor(feature.properties.value),
            },
          };
        }

        return {
          ...feature,
          properties: baseProperties,
        };
      });
    outputFeatures.push(...fc);

    return outputFeatures;
  } catch (error) {
    console.error((error as Error).message);
    return [];
  }
}

export async function generateVectorTiles<
  TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>,
>(db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>) {
  if (!db) {
    throw new Error("Database connection is required to generate payloads");
  }

  // going to retain the ability to merge multiple datasets into one tile
  const featureCollectionsByType: Partial<Record<PayloadType, FeatureCollection<Point | MultiPoint | LineString>>> = {};

  const { lastUpdatedTime: surfaceDataUpdatedId } = await getCache("popup");

  let surfaceData: Awaited<ReturnType<typeof fetchSurfaceData>> = [];

  try {
    const startTime = performance.now();
    console.log("\x1b[0m%s\x1b[0m", "ℹ️ Info: Fetching data from the database...");
    surfaceData = await fetchSurfaceData({
      db,
      order: "asc",
      lastUpdatedTime: surfaceDataUpdatedId,
      hours: 4,
    });
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (surfaceData.length === 0) {
      console.info("ℹ️ No new data fetched from the database, skipping payload generation");
    }
    console.log(
      "\x1b[32m%s\x1b[0m",
      `✅ Success: Fetched ${surfaceData.length} records from the database in ${duration} seconds`,
    );
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "❌ Error: Failed while creating payload files:\n\n", (error as Error).stack);
    process.exit(1);
  }

  try {
    const generatePayload = async (payloadType: PayloadType) => {
      const startTime = performance.now();

      console.log("\x1b[0m%s\x1b[0m", `ℹ️ Info: Starting ${payloadType.toUpperCase()} payload generation...`);

      switch (payloadType as PayloadType) {
        case "plot": {
          const maxTime = surfaceData.reduce(
            (max, obs) => (new Date(obs.validTime).getTime() > max ? new Date(obs.validTime).getTime() : max),
            surfaceDataUpdatedId,
          );

          const data: FeatureCollection = {
            type: "FeatureCollection",
            features: generateTimeseriesGeoJson(surfaceData),
          };

          const updatedCache = await updateCache(data, maxTime, payloadType, new Date(Date.now() - 6 * HOUR));
          featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point>;

          break;
        }
        case "popup": {
          const tafLookback = new Date(Date.now() - 12 * HOUR);

          const maxTime = surfaceData.reduce(
            (max, obs) => (new Date(obs.validTime).getTime() > max ? new Date(obs.validTime).getTime() : max),
            surfaceDataUpdatedId,
          );

          const metarList: Record<
            string,
            { validTime: number; rawText: string; mslp?: number; tt?: number; td?: number }[]
          > = {};
          surfaceData.forEach((m) => {
            if (!m.rawText) return;

            const dataPackage = {
              validTime: m.validTime.getTime(),
              rawText: m.rawText,
              mslp: m.mslp ?? undefined,
              tt: m.tt ?? undefined,
              td: m.td ?? undefined,
            };

            if (metarList[m.siteId]) {
              metarList[m.siteId].push(dataPackage);
            } else {
              metarList[m.siteId] = [dataPackage];
            }
          });

          const tafsQuery = await db
            .select()
            .from(tafs)
            .where(gt(tafs.validTime, tafLookback))
            .orderBy(asc(tafs.validTime))
            .then((results) => limitResultsByKeys(results, 1, "siteId"));

          const popupData = surfaceData.reduce<Feature<Point, StationPlotPopupData>[]>((acc, m) => {
            if (!m.lat || !m.lon) return acc;

            const siteId = m.siteId;

            const { lat, lon, siteName, siteCountry, siteState } = m;

            const currentTaf = tafsQuery.find((t) => t.siteId === siteId);

            const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

            if (existingFeature) {
              return acc;
            } else {
              const newFeature: Feature<Point, StationPlotPopupData> = {
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [lon, lat],
                },
                properties: {
                  siteId,
                  siteName,
                  siteCountry,
                  siteState,
                  metars: metarList[siteId] || [],
                  taf: currentTaf ? currentTaf.rawText : null,
                  dataType: "site",
                },
              };
              acc.push(newFeature);
              return acc;
            }
          }, []);

          const data: FeatureCollection<Point> = {
            type: "FeatureCollection",
            features: popupData,
          };

          const updatedCache = await updateCache(data, maxTime, payloadType, new Date(Date.now() - 6 * HOUR));
          featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point>;

          break;
        }
        // case "pirep": {
        //   try {
        //     const pirepData = await aviationDb.query.pireps.findMany({
        //       where: gt(avSchema.pireps.issueTime, new Date(Date.now() - 4.5 * HOUR)),
        //     });

        //     const { lastUpdatedTime } = await getCache(payloadType);

        //     const maxId = pirepData.reduce((max, pirep) => (pirep.id > max ? pirep.id : max), lastUpdatedTime);

        //     const data: FeatureCollection = {
        //       type: "FeatureCollection",
        //       features: generatePirepGeoJson(pirepData),
        //     };

        //     const updatedCache = await updateCache(data, maxId, payloadType, new Date(Date.now() - 4.5 * HOUR));
        //     featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point>;
        //   } catch (error) {
        //     console.error(
        //       "\x1b[31m%s\x1b[0m",
        //       `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
        //       (error as Error).stack,
        //     );
        //   }

        //   break;
        // }
        case "lightning": {
          // we're going to do a full dump of the data since
          // a) the query is relatively fast (1 record per 6 minutes of time)
          // b) the 2 most-recent timesteps can get updated after the fact due to how the data feed works
          // we can rework this later to do some back-tracking but I'm taking this shortcut now
          // (you're welcome, future me)

          try {
            const strikeData = await db
              .select()
              .from(lightningData)
              .where(gt(lightningData.dateFrom, new Date(Date.now() - 4 * HOUR)));

            const data: FeatureCollection = {
              type: "FeatureCollection",
              features: strikeData.map((evt) => {
                if (evt.dateFrom === null) throw new Error("Null value for 'dateFrom' in lightning data");

                const COORD_DELIMITER = " ";
                const validTime = evt.dateFrom.getTime();
                const startTime = Math.floor(validTime / (10 * MINUTE)) * 10 * MINUTE;
                const expiryTime = startTime + 20 * MINUTE;

                const coords = evt.strikes
                  ?.split(COORD_DELIMITER)
                  .map((coord) => {
                    const [lon, lat] = coord.split(",");
                    return [Number(lon), Number(lat)] as Position;
                  })
                  .filter(([lon, lat]) => {
                    // Filter out NaN and out-of-range coordinates.
                    return !isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
                  });

                const feature: Feature = {
                  type: "Feature",
                  properties: {
                    validTime,
                    startTime,
                    expiryTime,
                  },
                  geometry: {
                    type: "MultiPoint",
                    coordinates: coords ?? [],
                  },
                };

                return feature;
              }),
            };

            const updatedCache = await updateCache(data, Date.now(), payloadType, new Date(Date.now() - 4 * HOUR));
            featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<MultiPoint>;
          } catch (error) {
            console.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        case "isobar": {
          try {
            const { data: popupCacheData, lastUpdatedTime: popupCachelastUpdatedTime } = await getCache("popup");
            const popupFeatures = popupCacheData.features as Feature<Point, StationPlotPopupData>[];
            const isolineInputData = getIsolineInputFromPopupFeatures(popupFeatures);

            const features = await generateIsolines({
              startTime: Date.now(),
              field: "mslp",
              fieldInterval: 4,
              data: isolineInputData,
              interpolationSearchRadius: [1.1, 2.2],
            });

            const data: FeatureCollection = {
              type: "FeatureCollection",
              features,
            };

            const updatedCache = await updateCache(
              data,
              popupCachelastUpdatedTime,
              payloadType,
              new Date(Date.now() - (3 * HOUR + 10 * MINUTE)),
            );

            featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point | LineString>;
          } catch (error) {
            console.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        case "isotherm": {
          try {
            const { data: popupCacheData, lastUpdatedTime: popupCachelastUpdatedTime } = await getCache("popup");
            const popupFeatures = popupCacheData.features as Feature<Point, StationPlotPopupData>[];
            const isolineInputData = getIsolineInputFromPopupFeatures(popupFeatures);

            const features = await generateIsolines({
              startTime: Date.now(),
              field: "tt",
              fieldInterval: 5,
              data: isolineInputData,
              interpolationSearchRadius: [0.5, 1.0],
            });

            const data: FeatureCollection = {
              type: "FeatureCollection",
              features,
            };

            const updatedCache = await updateCache(
              data,
              popupCachelastUpdatedTime,
              payloadType,
              new Date(Date.now() - (3 * HOUR + 10 * MINUTE)),
            );

            featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point | LineString>;
          } catch (error) {
            console.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        default:
          console.info(`ℹ️ No generation logic implemented for payload type '${payloadType}', skipping...`);
      }
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(
        "\x1b[32m%s\x1b[0m",
        `✅ Success: ${payloadType.toUpperCase()} payload generated in ${duration} seconds`,
      );
    };

    const parallelPayloadTypes = PAYLOAD_TYPE.filter(
      (payloadType) => payloadType !== "isobar" && payloadType !== "isotherm",
    ) as PayloadType[];

    await Promise.all(parallelPayloadTypes.map((payloadType) => generatePayload(payloadType)));

    // Isobars depend on popup cache contents, so run them only after popup update is finished.
    if (PAYLOAD_TYPE.includes("isobar") || PAYLOAD_TYPE.includes("isotherm")) {
      await generatePayload("isobar");
      await generatePayload("isotherm");
    }

    await ensureStationListCache();

    await generateTiles(featureCollectionsByType, {
      tileSetName: "realtime",
    });

    console.log("\x1b[35m%s\x1b[0m", "🚀 Complete: All payload files generated successfully!");
  } catch (error) {
    throw new Error(`\x1b[31m%s\x1b[0m❌ Error: Failed while creating payload files:\n\n ${(error as Error).stack}`);
  }
}
