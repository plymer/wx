#!/usr/bin/node
import { createDbConnString, HOUR, Logger, MINUTE } from "@msc-cmac-apps/cmac-helpers/node";
import * as avSchema from "./schemas/dms-aviation.js";
import * as lgSchema from "./schemas/dms-lightning.js";
import { drizzle } from "drizzle-orm/mysql2";
import { and, asc, between, desc, gt, inArray, InferSelectModel, like, not } from "drizzle-orm";
import {
  formatClouds,
  formatWind,
  generatePirepGeoJson,
  generateTimeseriesGeoJson,
  getObType,
  getStationType,
  limitResultsByKeys,
} from "./geoJson.js";
import { Nullable, OutputPopupData, PayloadType, Popup, WxMapPopupMetar } from "./types.js";
import { Feature, FeatureCollection, LineString, MultiPoint, Point, Position } from "geojson";
import { getCache, getStationCache, updateCache } from "./redis.js";
import { updateStationList } from "./stationList.js";
import { generateTiles } from "./tiles.js";
import { PAYLOAD_TYPE } from "./config/index.js";
import { Tuple2DWithValue, tupleArrayToGeoJSON } from "@plymer/fast-barnes-ts";

const aviationDb = drizzle(createDbConnString("dms-aviation"), {
  mode: "default",
  schema: { ...avSchema },
});

const lightningDb = drizzle(createDbConnString("dms-lightning"), {
  mode: "default",
  schema: { ...lgSchema },
});

export const logger = new Logger({
  projectName: "payload-generator",
  fileName: "vector",
});

type IsolineInputDataPoint = {
  lat: number;
  lon: number;
  stationId: string;
  validTime: Date;
  mslp: number | null;
  tt: number | null;
  td: number | null;
};

const toFiniteNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

const getIsolineInputFromPopupFeatures = (popupFeatures: Popup[]): IsolineInputDataPoint[] => {
  return popupFeatures.reduce<IsolineInputDataPoint[]>((acc, feature) => {
    if (!feature.geometry || feature.geometry.type !== "Point") {
      return acc;
    }

    const [lon, lat] = feature.geometry.coordinates;

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return acc;
    }

    const stationId = feature.properties?.siteId;

    if (!stationId) {
      return acc;
    }

    feature.properties.metars.forEach((metar) => {
      const validTimeMs = metar.validTime;

      if (typeof validTimeMs !== "number" || !Number.isFinite(validTimeMs)) {
        return;
      }

      acc.push({
        lat,
        lon,
        stationId,
        validTime: new Date(validTimeMs),
        mslp: toFiniteNumber(metar.mslp),
        tt: toFiniteNumber(metar.tt),
        td: toFiniteNumber(metar.td),
      });
    });

    return acc;
  }, []);
};

const hasStationListData = (stationList: { min: string[]; med: string[]; max: string[] }) =>
  stationList.min.length > 0 || stationList.med.length > 0 || stationList.max.length > 0;

const ensureStationListCache = async () => {
  const stationCache = await getStationCache();

  if (hasStationListData(stationCache.data)) {
    return;
  }

  logger.warn("[PAYLOADS] Station list cache is empty. Running station list refresh before tile generation.");
  await updateStationList();
};

export async function fetchNswobData({
  order,
  stationTypes,
  hours,
  lastUpdatedId = 0,
  limit,
}: {
  order: "asc" | "desc";
  stationTypes: InferSelectModel<typeof avSchema.nswob>["stationType"][] | undefined;
  hours?: number;
  lastUpdatedId?: number;
  limit?: number;
}) {
  // Build conditions for data order

  const start = new Date(Date.now() - (hours ?? 4) * HOUR);
  const end = new Date();

  try {
    // Fetch data
    const data = (
      await aviationDb.query.nswob.findMany({
        where: and(
          not(like(avSchema.nswob.rawDataType, "mvrd%")), // metro vancouver road dept
          not(like(avSchema.nswob.rawDataType, "env_aqmet%")), // bc environment air quality met stations
          not(like(avSchema.nswob.rawDataType, "cocorahs%")),
          not(like(avSchema.nswob.rawDataType, "on_trca%")), // toronto region conservation authority
          not(like(avSchema.nswob.rawDataType, "on_grca%")), // grand river conservation authority
          not(like(avSchema.nswob.rawDataType, "on_mnr%")), // ontario ministry of natural resources
          lastUpdatedId !== 0 ? gt(avSchema.nswob.id, lastUpdatedId) : between(avSchema.nswob.validTime, start, end),
          stationTypes !== undefined ? inArray(avSchema.nswob.stationType, stationTypes) : undefined,
        ),
        with: { stations: { columns: { lat: true, lon: true, siteName: true } } },
        orderBy: [
          asc(avSchema.nswob.stationId),
          order === "asc" ? asc(avSchema.nswob.validTime) : desc(avSchema.nswob.validTime),
        ],
      })
    ).map((record) => {
      const hasStationData = record.stations && record.stations.lat && record.stations.lon;
      const isStationDataClose =
        hasStationData &&
        Math.abs(record.stations!.lat - record.lat) <= 5 &&
        Math.abs(record.stations!.lon - record.lon) <= 5;

      const useStationData = hasStationData && isStationDataClose;

      return {
        ...record,
        lat: useStationData ? record.stations!.lat : record.lat,
        lon: useStationData ? record.stations!.lon : record.lon,
        stationName: useStationData ? record.stations!.siteName : record.stationName,
      };
    });

    // Limit the result set per site
    const result = limit
      ? limitResultsByKeys(data, limit, (record) =>
          record.stationType === "THIRD_PARTY" ? `${record.dataSource}: ${record.stationId}` : record.stationId,
        )
      : data;

    return result;
  } catch (error) {
    logger.error(`Error fetching NSWOB data: ${error instanceof Error ? error.message : String(error)}`);
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

  const BLACKLISTED_SITES = [""];
  try {
    const collatedData: Record<string, { lat: number; lon: number; values: { val: number; validTime: Date }[] }> = {};
    const outputFeatures: Feature[] = [];
    data.forEach((ob) => {
      const { lat, lon, stationId, validTime } = ob;
      const val = ob[field];
      if (!lat || !lon || !val || BLACKLISTED_SITES.includes(stationId)) return;
      if (collatedData[stationId]) {
        collatedData[stationId].values.push({ val, validTime });
      } else {
        collatedData[stationId] = {
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
    logger.error((error as Error).message);
    return [];
  }
}

async function main() {
  // going to retain the ability to merge multiple datasets into one tile
  const featureCollectionsByType: Partial<Record<PayloadType, FeatureCollection<Point | MultiPoint | LineString>>> = {};

  const { lastUpdatedId: nswobDataUpdatedId } = await getCache("popup");

  let nswobData: InferSelectModel<typeof avSchema.nswob>[] = [];

  try {
    const startTime = performance.now();
    logger.log("\x1b[0m%s\x1b[0m", "ℹ️ Info: Fetching data from NSWOB...");
    nswobData = await fetchNswobData({
      order: "asc",
      stationTypes: ["LAND", "LAND_MANNED", "LAND_AUTO", "THIRD_PARTY", "FM_BUOY", "MOORED_BUOY", "SHIP", "LIGHTHOUSE"],
      lastUpdatedId: nswobDataUpdatedId,
      hours: 4,
    });
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (nswobData.length === 0) {
      logger.info("ℹ️ No new data fetched from NSWOB, skipping payload generation");
    }
    logger.log(
      "\x1b[32m%s\x1b[0m",
      `✅ Success: Fetched ${nswobData.length} records from NSWOB in ${duration} seconds`,
    );
  } catch (error) {
    logger.error("\x1b[31m%s\x1b[0m", "❌ Error: Failed while creating payload files:\n\n", (error as Error).stack);
    process.exit(1);
  }

  const popupData = nswobData;
  const marineData = nswobData.filter((record) => ["FM_BUOY", "MOORED_BUOY", "SHIP"].includes(record.stationType));
  const landData = nswobData.filter((record) =>
    ["LAND", "LAND_MANNED", "LAND_AUTO", "THIRD_PARTY"].includes(record.stationType),
  );
  const lighthouseData = nswobData.filter((record) => record.stationType === "LIGHTHOUSE");

  try {
    const generatePayload = async (payloadType: PayloadType) => {
      const startTime = performance.now();

      logger.log("\x1b[0m%s\x1b[0m", `ℹ️ Info: Starting ${payloadType.toUpperCase()} payload generation...`);

      switch (payloadType as PayloadType) {
        case "marine":
        case "lighthouse":
        case "land": {
          const observations =
            payloadType === "marine" ? marineData : payloadType === "land" ? landData : lighthouseData;

          const maxId = observations.reduce((max, obs) => (obs.id > max ? obs.id : max), nswobDataUpdatedId);

          const data: FeatureCollection = {
            type: "FeatureCollection",
            features: generateTimeseriesGeoJson(observations),
          };

          const updatedCache = await updateCache(data, maxId, payloadType, new Date(Date.now() - 6 * HOUR));
          featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point>;

          break;
        }
        case "popup": {
          const tafLookback = new Date(Date.now() - 12 * HOUR);

          const maxId = popupData.reduce((max, obs) => (obs.id > max ? obs.id : max), nswobDataUpdatedId);

          const output = popupData.reduce<OutputPopupData>((acc, curr) => {
            if (!acc[curr.stationId]) {
              acc[curr.stationId] = {
                lng: curr.lon,
                lat: curr.lat,
                siteName: curr.stationName,
                metars: [],
              };
            }

            const basicObType = getObType(curr.rawText);

            const obSource = curr.dataSource;

            const obType =
              basicObType === "HOURLY"
                ? obSource === "nav_canada" || obSource === "nws"
                  ? "METAR"
                  : obSource === "msc"
                    ? "LWIS"
                    : null
                : basicObType;

            const wind = formatWind(
              curr.windDir,
              curr.windDirAvg10,
              curr.windSpd,
              curr.windSpdAvg10,
              curr.windSpdMax10,
            );

            const clouds = formatClouds(curr.clouds);

            const parsedMetar: Nullable<WxMapPopupMetar> = {
              wind,
              vis: curr.visibility,
              wx: curr.wx,
              windShear: curr.windShear,
              clouds,
              tt: curr.tt,
              td: curr.td,
              altimeter: curr.altimeter,
              mslp: curr.mslp,
              validTime: curr.validTime.getTime(),
              rmk: curr.rmk,
              stationType: curr.stationType,
              obType,
              rvr: curr.rvr,
              correctionLevel: curr.correctionLevel,
              rawText: curr.rawText,
            };

            acc[curr.stationId].metars.push(parsedMetar);

            return acc;
          }, {});

          const tafResponse = await aviationDb.query.tafs
            .findMany({
              where: gt(avSchema.tafs.validTime, tafLookback),
              orderBy: [asc(avSchema.tafs.validTime)],
            })
            .then((results) => limitResultsByKeys(results, 1, "site"));

          // now merge the taf data into the metar data by station

          tafResponse.forEach((tafRecord) => {
            if (output[tafRecord.site]) {
              output[tafRecord.site].taf = tafRecord.raw;
            }
          });

          const featuresArray: Feature<
            Point,
            {
              siteId: string;
              siteName?: string | null;
              taf: string | null;
              stationType: "lighthouse" | "ship" | "buoy" | "hwos" | "awos" | "auto";
              metars: Partial<WxMapPopupMetar>[];
              dataType: "site";
            }
          >[] = Object.entries(output).map(([siteId, data]) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [data.lng, data.lat],
            },
            properties: {
              siteId,
              siteName: data.siteName,
              stationType: getStationType(data.metars),
              taf: data.taf ?? null,
              metars: data.metars,
              dataType: "site",
            },
          }));

          const data: FeatureCollection<Point> = {
            type: "FeatureCollection",
            features: featuresArray,
          };

          const updatedCache = await updateCache(data, maxId, payloadType, new Date(Date.now() - 6 * HOUR));
          featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point>;

          break;
        }
        case "pirep": {
          try {
            const pirepData = await aviationDb.query.pireps.findMany({
              where: gt(avSchema.pireps.issueTime, new Date(Date.now() - 4.5 * HOUR)),
            });

            const { lastUpdatedId } = await getCache(payloadType);

            const maxId = pirepData.reduce((max, pirep) => (pirep.id > max ? pirep.id : max), lastUpdatedId);

            const data: FeatureCollection = {
              type: "FeatureCollection",
              features: generatePirepGeoJson(pirepData),
            };

            const updatedCache = await updateCache(data, maxId, payloadType, new Date(Date.now() - 4.5 * HOUR));
            featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point>;
          } catch (error) {
            logger.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        case "lightning": {
          // we're going to do a full dump of the data since
          // a) the query is relatively fast (1 record per minute of time)
          // b) the latest timestep can get updated after the fact due to how the data feed works
          // we can rework this later to do some back-tracking but I'm taking this shortcut now
          // (you're welcome, future me)

          try {
            const lightningData = await lightningDb.query.lightning.findMany({
              where: gt(lgSchema.lightning.validTime, new Date(Date.now() - 4 * HOUR)),
            });

            const data: FeatureCollection = {
              type: "FeatureCollection",
              features: lightningData.map((evt) => {
                const COORD_DELIMITER = " ";
                const validTime = evt.validTime.getTime();
                const startTime = Math.floor(validTime / (10 * MINUTE)) * 10 * MINUTE;
                const expiryTime = startTime + 10 * MINUTE;

                const coords = evt.coords
                  ?.split(COORD_DELIMITER)
                  .map((coord) => {
                    const [lat, lon] = coord.split(",");
                    return [Number(lon), Number(lat)] as Position;
                  })
                  .filter(([lon, lat]) => {
                    // Filter out NaN or invalid
                    return !isNaN(lon) && !isNaN(lat);
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
            logger.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        case "isobar": {
          try {
            const { data: popupCacheData, lastUpdatedId: popupCacheLastUpdatedId } = await getCache("popup");
            const popupFeatures = popupCacheData.features as Popup[];
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
              popupCacheLastUpdatedId,
              payloadType,
              new Date(Date.now() - (3 * HOUR + 10 * MINUTE)),
            );

            featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point | LineString>;
          } catch (error) {
            logger.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        case "isotherm": {
          try {
            const { data: popupCacheData, lastUpdatedId: popupCacheLastUpdatedId } = await getCache("popup");
            const popupFeatures = popupCacheData.features as Popup[];
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
              popupCacheLastUpdatedId,
              payloadType,
              new Date(Date.now() - (3 * HOUR + 10 * MINUTE)),
            );

            featureCollectionsByType[payloadType] = updatedCache.data as FeatureCollection<Point | LineString>;
          } catch (error) {
            logger.error(
              "\x1b[31m%s\x1b[0m",
              `❌ Error: Failed to generate ${payloadType.toUpperCase()} payload:\n\n`,
              (error as Error).stack,
            );
          }

          break;
        }
        default:
          logger.info(`ℹ️ No generation logic implemented for payload type '${payloadType}', skipping...`);
      }
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      logger.log(
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

    logger.log("\x1b[35m%s\x1b[0m", "🚀 Complete: All payload files generated successfully!");

    process.exit(0);
  } catch (error) {
    logger.error("\x1b[31m%s\x1b[0m", "❌ Error: Failed while creating payload files:\n\n", (error as Error).stack);
    process.exit(1);
  }
}

await main();
