import { createHash } from "crypto";

import "dotenv/config";
import type { RedisJSON } from "redis";
import type { Feature, FeatureCollection } from "geojson";
import type { PayloadCache, PayloadType, Popup, StationList, TiledSurfacePlotData } from "./types.js";
import { HOUR, MINUTE } from "../../lib/constants.js";
import { redisClient } from "../../lib/redis.js";

const redis = await redisClient("vector-tiles");

const CACHE_PREFIX = "tiles:realtime";

type ClusteredPointPayloadType = "lightning";
type SurfaceSiteDoc = {
  features: TiledSurfacePlotData[];
};
type TimeSliceDoc = {
  startTime: number;
  expiryTime: number;
  features: Feature[];
};

const ISOLINE_RETENTION_TIME = 3 * HOUR + 10 * MINUTE;
const TIMESTEP_BUCKET = 10 * MINUTE;
const CLUSTERED_POINT_RETENTION: Record<ClusteredPointPayloadType, number> = {
  // pirep: 4.5 * HOUR,
  lightning: 4 * HOUR,
};

const emptyPayloadCache = (): PayloadCache => ({
  data: { type: "FeatureCollection", features: [] },
  lastUpdatedTime: 0,
});

const isClusteredPointPayload = (cacheType: PayloadType): cacheType is ClusteredPointPayloadType =>
  cacheType === "lightning";

async function getJsonRoot<T>(key: string): Promise<T | null> {
  const raw = (await redis.json.get(key, { path: "$" })) as T[] | null;
  return raw?.[0] ?? null;
}

async function setlastUpdatedTime(cacheType: PayloadType, lastUpdatedTime: number) {
  await redis.json.set(`${CACHE_PREFIX}:${cacheType}:meta`, "$", { lastUpdatedTime } as unknown as RedisJSON);
}

async function getlastUpdatedTime(cacheType: PayloadType) {
  const raw = (await redis.json.get(`${CACHE_PREFIX}:${cacheType}:meta`, { path: "$.lastUpdatedTime" })) as
    | number[]
    | null;
  return raw?.[0] ?? 0;
}

const mergeTiledPlotFeatures = (
  currentData: TiledSurfacePlotData[],
  newData: TiledSurfacePlotData[],
  dataCutoffTime: Date,
) => {
  const bySite = new Map<string, TiledSurfacePlotData[]>();

  // purge old obs from the data set
  for (const feature of currentData) {
    const time = new Date(feature.properties.validTime);
    if (time < dataCutoffTime) continue;

    const key = feature.properties.siteId;

    if (!bySite.has(key)) {
      bySite.set(key, []);
    }

    bySite.get(key)!.push(feature);
  }

  // add new obs to the data
  for (const feature of newData) {
    const key = feature.properties.siteId;

    if (!bySite.has(key)) {
      bySite.set(key, []);
    }

    bySite.get(key)!.push(feature);
  }
  // sort by valid time
  for (const [_, features] of bySite) {
    features.sort((a, b) => a.properties.validTime - b.properties.validTime);
  }

  // now build the validity windows
  for (const [_, features] of bySite) {
    const n = features.length;

    for (let i = 0; i < n; i++) {
      const curr = features[i];
      const t = curr.properties.validTime;

      const prev = features[i - 1]?.properties.validTime;
      const next = features[i + 1]?.properties.validTime;

      // if previous is undefined (we're at the zeroth time) set the start time to t - 1.5 hours
      // otherwise use the actual validity time
      curr.properties.startTime = prev ? t : t - 1.5 * HOUR;

      // if next is undefined (we're at the latest most-recent ob) set the end time to t + 1.5 hours
      curr.properties.expiryTime = next ?? t + 1.5 * HOUR;
    }
  }

  return Array.from(bySite.values()).flat();
};

const mergePopupFeatures = (currentData: Popup | null, newData: Popup, dataCutoffTime: Date): Popup | null => {
  const currentMetars = currentData
    ? currentData.properties.metars.filter((metar) =>
        metar.validTime !== null && metar.validTime !== undefined ? new Date(metar.validTime) >= dataCutoffTime : false,
      )
    : [];

  const newestThree = [...currentMetars, ...newData.properties.metars]
    .sort((a, b) => (a.validTime ?? 0) - (b.validTime ?? 0))
    .slice(-3);

  if (!newestThree.length) {
    return null;
  }

  return {
    ...newData,
    properties: {
      ...newData.properties,
      metars: newestThree,
    },
  };
};

const cleanOldPopupData = (feature: Popup, dataCutoffTime: Date) => {
  const retainedMetars = [...feature.properties.metars]
    .filter((metar) =>
      metar.validTime !== null && metar.validTime !== undefined ? new Date(metar.validTime) >= dataCutoffTime : false,
    )
    .sort((a, b) => (a.validTime ?? 0) - (b.validTime ?? 0))
    .slice(-3);

  if (!retainedMetars.length) return null;

  return {
    ...feature,
    properties: {
      ...feature.properties,
      metars: retainedMetars,
    },
  };
};

const cleanOldPlotData = (features: TiledSurfacePlotData[], dataCutoffTime: Date) => {
  const retained = features.filter((feature) =>
    feature.properties.validTime !== null && feature.properties.validTime !== undefined
      ? new Date(feature.properties.validTime) >= dataCutoffTime
      : false,
  );

  if (!retained.length) return [];

  retained.sort((a, b) => a.properties.validTime - b.properties.validTime);

  for (let i = 0; i < retained.length; i++) {
    const curr = retained[i];
    const t = curr.properties.validTime;
    const prev = retained[i - 1]?.properties.validTime;
    const next = retained[i + 1]?.properties.validTime;

    curr.properties.startTime = prev ? t : t - 1.5 * HOUR;
    curr.properties.expiryTime = next ?? t + 1.5 * HOUR;
  }

  return retained;
};

const getFeatureStartTime = (feature: Feature) => {
  const startTime = (feature.properties as { startTime?: unknown } | null)?.startTime;
  return typeof startTime === "number" && Number.isFinite(startTime) ? startTime : null;
};

const getFeatureExpiryTime = (feature: Feature) => {
  const expiryTime = (feature.properties as { expiryTime?: unknown } | null)?.expiryTime;
  return typeof expiryTime === "number" && Number.isFinite(expiryTime) ? expiryTime : null;
};

const getFeatureValidTime = (feature: Feature) => {
  const validTime = (feature.properties as { validTime?: unknown } | null)?.validTime;
  return typeof validTime === "number" && Number.isFinite(validTime) ? validTime : null;
};

const getIsobarFeatureHashKey = (feature: Feature) => {
  const geometryJson = JSON.stringify(feature.geometry ?? null);
  const propertiesJson = JSON.stringify(feature.properties ?? null);

  return createHash("sha1").update(geometryJson).update("|").update(propertiesJson).digest("hex");
};

const mergeIsobarFeatures = (newData: Feature[], dataCutoffTime: Date): Feature[] => {
  const deduped = new Map<string, Feature>();

  newData.forEach((feature) => {
    const expiryTime = getFeatureExpiryTime(feature);

    if (expiryTime === null || expiryTime < dataCutoffTime.getTime()) {
      return;
    }

    const key = getIsobarFeatureHashKey(feature);
    deduped.set(key, feature);
  });

  return Array.from(deduped.values());
};

const cleanOldIsolineData = (features: Feature[], dataCutoffTime: Date) =>
  features.filter((feature) => {
    const expiryTime = getFeatureExpiryTime(feature);
    return expiryTime !== null && expiryTime >= dataCutoffTime.getTime();
  });

const cleanOldTimedFeatureData = (features: Feature[], dataCutoffTime: Date) =>
  features.filter((feature) => {
    const expiryTime = getFeatureExpiryTime(feature);

    if (expiryTime !== null) {
      return expiryTime >= dataCutoffTime.getTime();
    }

    const validTime = getFeatureValidTime(feature);
    return validTime !== null && validTime >= dataCutoffTime.getTime();
  });

const getClusteredPointFeatureKey = (cacheType: ClusteredPointPayloadType, feature: Feature) => {
  const properties = feature.properties ?? {};

  // if (cacheType === "pirep") {
  //   const id = (properties as { id?: unknown }).id;

  //   if (typeof id === "number" || typeof id === "string") {
  //     return `id:${id}`;
  //   }
  // }

  const validTime = (properties as { validTime?: unknown }).validTime;
  const geometryJson = JSON.stringify(feature.geometry ?? null);

  return createHash("sha1")
    .update(cacheType)
    .update("|")
    .update(geometryJson)
    .update("|")
    .update(String(validTime ?? "null"))
    .digest("hex");
};

const mergeClusteredPointFeatures = (
  cacheType: ClusteredPointPayloadType,
  currentFeatures: Feature[],
  incomingFeatures: Feature[],
  dataCutoffTime: Date,
) => {
  const deduped = new Map<string, Feature>();

  [...currentFeatures, ...incomingFeatures].forEach((feature) => {
    const expiryTime = getFeatureExpiryTime(feature);
    const validTime = getFeatureValidTime(feature);
    const timeToCheck = expiryTime ?? validTime;

    if (timeToCheck === null || timeToCheck < dataCutoffTime.getTime()) {
      return;
    }

    const key = getClusteredPointFeatureKey(cacheType, feature);

    // Insert current first and incoming second so incoming run data replaces stale duplicates.
    deduped.set(key, feature);
  });

  return Array.from(deduped.values());
};

const dedupeClusteredPointSliceFeatures = (cacheType: ClusteredPointPayloadType, features: Feature[]) => {
  const deduped = new Map<string, Feature>();

  for (const feature of features) {
    const key = getClusteredPointFeatureKey(cacheType, feature);
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, feature);
      continue;
    }

    const existingValidTime = getFeatureValidTime(existing) ?? 0;
    const incomingValidTime = getFeatureValidTime(feature) ?? 0;

    if (incomingValidTime > existingValidTime) {
      deduped.set(key, feature);
      continue;
    }

    if (incomingValidTime === existingValidTime) {
      const existingExpiryTime = getFeatureExpiryTime(existing) ?? 0;
      const incomingExpiryTime = getFeatureExpiryTime(feature) ?? 0;

      if (incomingExpiryTime > existingExpiryTime) {
        deduped.set(key, feature);
      }
    }
  }

  return Array.from(deduped.values());
};

async function getTimedSliceCache(
  cacheType: "isobar" | "isotherm" | ClusteredPointPayloadType,
  retentionTime: number,
  cleaner: (features: Feature[], dataCutoffTime: Date) => Feature[],
): Promise<PayloadCache> {
  try {
    const timestepValues = await redis.sMembers(`${CACHE_PREFIX}:${cacheType}:timesteps`);
    const cutoffTime = new Date(Date.now() - retentionTime);
    const features: Feature[] = [];
    const staleTimeSteps: string[] = [];

    for (const timestepValue of timestepValues) {
      const startTime = Number(timestepValue);

      if (!Number.isFinite(startTime)) {
        staleTimeSteps.push(timestepValue);
        continue;
      }

      const key = `${CACHE_PREFIX}:${cacheType}:timestep:${startTime}`;
      const sliceDoc = await getJsonRoot<TimeSliceDoc>(key);

      if (!sliceDoc) {
        staleTimeSteps.push(timestepValue);
        continue;
      }

      const retained = cleaner(sliceDoc.features, cutoffTime);

      if (!retained.length) {
        staleTimeSteps.push(timestepValue);
        await redis.del(key);
        continue;
      }

      if (retained.length !== sliceDoc.features.length) {
        const maxExpiryTime = retained.reduce((max, feature) => {
          const expiryTime = getFeatureExpiryTime(feature);
          return expiryTime !== null && expiryTime > max ? expiryTime : max;
        }, 0);

        await redis.json.set(key, "$", {
          startTime,
          expiryTime: maxExpiryTime,
          features: retained,
        } as unknown as RedisJSON);
      }

      features.push(...retained);
    }

    if (staleTimeSteps.length) {
      await redis.sRem(`${CACHE_PREFIX}:${cacheType}:timesteps`, staleTimeSteps);
    }

    return {
      data: { type: "FeatureCollection", features },
      lastUpdatedTime: await getlastUpdatedTime(cacheType),
    };
  } catch (err) {
    console.error(`[Redis Get Cache Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
    return emptyPayloadCache();
  }
}

async function getIsolineCache(cacheType: "isobar" | "isotherm"): Promise<PayloadCache> {
  return getTimedSliceCache(cacheType, ISOLINE_RETENTION_TIME, cleanOldIsolineData);
}

async function getClusteredPointCache(cacheType: ClusteredPointPayloadType): Promise<PayloadCache> {
  const output = await getTimedSliceCache(cacheType, CLUSTERED_POINT_RETENTION[cacheType], cleanOldTimedFeatureData);
  output.data.features = dedupeClusteredPointSliceFeatures(cacheType, output.data.features);
  return output;
}

async function getPopupCache(): Promise<PayloadCache> {
  try {
    const siteIds = await redis.sMembers(`${CACHE_PREFIX}:popup:sites`);
    const cutoffTime = new Date(Date.now() - 6 * HOUR);
    const features: Popup[] = [];
    const staleSiteIds: string[] = [];

    for (const siteId of siteIds) {
      const key = `${CACHE_PREFIX}:popup:site:${encodeURIComponent(siteId)}`;
      const feature = await getJsonRoot<Popup>(key);

      if (!feature) {
        staleSiteIds.push(siteId);
        continue;
      }

      const sanitized = cleanOldPopupData(feature, cutoffTime);

      if (!sanitized) {
        staleSiteIds.push(siteId);
        await redis.del(key);
        continue;
      }

      if (sanitized.properties.metars.length !== feature.properties.metars.length) {
        await redis.json.set(key, "$", sanitized as unknown as RedisJSON);
      }

      features.push(sanitized);
    }

    if (staleSiteIds.length) {
      await redis.sRem(`${CACHE_PREFIX}:popup:sites`, staleSiteIds);
    }

    return {
      data: { type: "FeatureCollection", features },
      lastUpdatedTime: await getlastUpdatedTime("popup"),
    };
  } catch (err) {
    console.error(`[Redis Get Cache Failed] popup: ${err instanceof Error ? err.message : String(err)}`);
    return emptyPayloadCache();
  }
}

async function getSurfacePlotCache(): Promise<PayloadCache> {
  try {
    const siteIds = await redis.sMembers(`${CACHE_PREFIX}:plot:sites`);
    const cutoffTime = new Date(Date.now() - 6 * HOUR);
    const features: TiledSurfacePlotData[] = [];
    const staleSiteIds: string[] = [];

    for (const siteId of siteIds) {
      const key = `${CACHE_PREFIX}:plot:site:${encodeURIComponent(siteId)}`;
      const siteDoc = await getJsonRoot<SurfaceSiteDoc>(key);

      if (!siteDoc) {
        staleSiteIds.push(siteId);
        continue;
      }

      const retained = cleanOldPlotData(siteDoc.features, cutoffTime);

      if (!retained.length) {
        staleSiteIds.push(siteId);
        await redis.del(key);
        continue;
      }

      if (retained.length !== siteDoc.features.length) {
        await redis.json.set(key, "$", { features: retained } as unknown as RedisJSON);
      }

      features.push(...retained);
    }

    if (staleSiteIds.length) {
      await redis.sRem(`${CACHE_PREFIX}:plot:sites`, staleSiteIds);
    }

    return {
      data: { type: "FeatureCollection", features },
      lastUpdatedTime: await getlastUpdatedTime("plot"),
    };
  } catch (err) {
    console.error(`[Redis Get Cache Failed] plot: ${err instanceof Error ? err.message : String(err)}`);
    return emptyPayloadCache();
  }
}

export const updateCache = async (
  incomingData: FeatureCollection,
  lastUpdatedTime: number,
  cacheType: PayloadType,
  dataCutoffTime: Date,
): Promise<PayloadCache> => {
  if (!redis.isReady) {
    return {
      lastUpdatedTime,
      data: incomingData,
    };
  }

  if (cacheType === "popup") {
    try {
      const incomingFeatures = incomingData.features as Popup[];

      await Promise.all(
        incomingFeatures.map(async (feature) => {
          const siteId = feature.properties.siteId;
          const siteKey = `${CACHE_PREFIX}:popup:site:${encodeURIComponent(siteId)}`;
          const existing = await getJsonRoot<Popup>(siteKey);

          const merged = mergePopupFeatures(existing ?? null, feature, dataCutoffTime);

          if (!merged) {
            await redis.del(siteKey);
            await redis.sRem(`${CACHE_PREFIX}:popup:sites`, siteId);
            return;
          }

          await redis.json.set(siteKey, "$", merged as unknown as RedisJSON);
          await redis.sAdd(`${CACHE_PREFIX}:popup:sites`, siteId);
        }),
      );

      await setlastUpdatedTime("popup", lastUpdatedTime);

      const output = await getPopupCache();
      console.log(`✅ Cache for '${cacheType}' updated successfully.`);
      return output;
    } catch (err) {
      console.error(`❌ [Redis Save Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
      return emptyPayloadCache();
    }
  }

  if (cacheType === "plot") {
    try {
      const incomingFeatures = incomingData.features as TiledSurfacePlotData[];
      const groupedBySite = new Map<string, TiledSurfacePlotData[]>();

      for (const feature of incomingFeatures) {
        const siteId = feature.properties.siteId;
        if (!groupedBySite.has(siteId)) {
          groupedBySite.set(siteId, []);
        }

        groupedBySite.get(siteId)!.push(feature);
      }

      await Promise.all(
        Array.from(groupedBySite.entries()).map(async ([siteId, newFeatures]) => {
          const siteKey = `${CACHE_PREFIX}:${cacheType}:site:${encodeURIComponent(siteId)}`;
          const existing = await getJsonRoot<SurfaceSiteDoc>(siteKey);

          const merged = mergeTiledPlotFeatures(existing?.features ?? [], newFeatures, dataCutoffTime);

          if (!merged.length) {
            await redis.del(siteKey);
            await redis.sRem(`${CACHE_PREFIX}:${cacheType}:sites`, siteId);
            return;
          }

          await redis.json.set(siteKey, "$", { features: merged } as unknown as RedisJSON);
          await redis.sAdd(`${CACHE_PREFIX}:${cacheType}:sites`, siteId);
        }),
      );

      await setlastUpdatedTime(cacheType, lastUpdatedTime);

      const output = await getSurfacePlotCache();
      console.log(`✅ Cache for '${cacheType}' updated successfully.`);
      return output;
    } catch (err) {
      console.error(`❌ [Redis Save Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
      return emptyPayloadCache();
    }
  }

  if (isClusteredPointPayload(cacheType)) {
    try {
      const incomingFeatures = incomingData.features;
      const groupedByStartTime = new Map<number, Feature[]>();

      for (const feature of incomingFeatures) {
        const startTime = getFeatureStartTime(feature);

        if (startTime === null) {
          continue;
        }

        if (!groupedByStartTime.has(startTime)) {
          groupedByStartTime.set(startTime, []);
        }

        groupedByStartTime.get(startTime)!.push(feature);
      }

      await Promise.all(
        Array.from(groupedByStartTime.entries()).map(async ([startTime, newFeatures]) => {
          const key = `${CACHE_PREFIX}:${cacheType}:timestep:${startTime}`;
          const existing = await getJsonRoot<TimeSliceDoc>(key);
          const merged = mergeClusteredPointFeatures(cacheType, existing?.features ?? [], newFeatures, dataCutoffTime);

          if (!merged.length) {
            await redis.del(key);
            await redis.sRem(`${CACHE_PREFIX}:${cacheType}:timesteps`, startTime.toString());
            return;
          }

          const maxExpiryTime = merged.reduce((max, feature) => {
            const expiryTime = getFeatureExpiryTime(feature);

            if (expiryTime !== null) {
              return expiryTime > max ? expiryTime : max;
            }

            const validTime = getFeatureValidTime(feature);
            return validTime !== null && validTime > max ? validTime : max;
          }, 0);

          await redis.json.set(key, "$", {
            startTime,
            expiryTime: maxExpiryTime || startTime + TIMESTEP_BUCKET,
            features: merged,
          } as unknown as RedisJSON);

          await redis.sAdd(`${CACHE_PREFIX}:${cacheType}:timesteps`, startTime.toString());
        }),
      );

      await setlastUpdatedTime(cacheType, lastUpdatedTime);

      const output = await getClusteredPointCache(cacheType);
      console.log(`✅ Cache for '${cacheType}' updated successfully.`);
      return output;
    } catch (err) {
      console.error(`❌ [Redis Save Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
      return emptyPayloadCache();
    }
  }

  if (cacheType === "isobar" || cacheType === "isotherm") {
    try {
      const incomingFeatures = incomingData.features;
      const groupedByStartTime = new Map<number, Feature[]>();

      for (const feature of incomingFeatures) {
        const startTime = getFeatureStartTime(feature);

        if (startTime === null) {
          continue;
        }

        if (!groupedByStartTime.has(startTime)) {
          groupedByStartTime.set(startTime, []);
        }

        groupedByStartTime.get(startTime)!.push(feature);
      }

      await Promise.all(
        Array.from(groupedByStartTime.entries()).map(async ([startTime, newFeatures]) => {
          const key = `${CACHE_PREFIX}:${cacheType}:timestep:${startTime}`;
          const merged = mergeIsobarFeatures(newFeatures, dataCutoffTime);

          if (!merged.length) {
            await redis.del(key);
            await redis.sRem(`${CACHE_PREFIX}:${cacheType}:timesteps`, startTime.toString());
            return;
          }

          const maxExpiryTime = merged.reduce((max, feature) => {
            const expiryTime = getFeatureExpiryTime(feature);
            return expiryTime !== null && expiryTime > max ? expiryTime : max;
          }, 0);

          await redis.json.set(key, "$", {
            startTime,
            expiryTime: maxExpiryTime,
            features: merged,
          } as unknown as RedisJSON);

          await redis.sAdd(`${CACHE_PREFIX}:${cacheType}:timesteps`, startTime.toString());
        }),
      );

      await setlastUpdatedTime(cacheType, lastUpdatedTime);

      const output = await getIsolineCache(cacheType);
      console.log(`✅ Cache for '${cacheType}' updated successfully.`);
      return output;
    } catch (err) {
      console.error(`❌ [Redis Save Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
      return emptyPayloadCache();
    }
  }

  const output: PayloadCache = {
    lastUpdatedTime,
    data: incomingData,
  };

  output.data.features = incomingData.features;

  try {
    const timeout = 2500;

    const savePromise = redis.json.set(`${CACHE_PREFIX}:${cacheType}:flat`, "$", {
      data: output.data,
      lastUpdatedTime,
    } as unknown as RedisJSON);

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout));

    await Promise.race([savePromise, timeoutPromise]);
  } catch (err) {
    console.error(`❌ [Redis Save Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
  }

  console.log(`✅ Cache for '${cacheType}' updated successfully.`);
  return output;
};

export const getCache = async (cacheType: PayloadType): Promise<PayloadCache> => {
  switch (cacheType) {
    case "popup":
      return getPopupCache();
    // case "pirep":
    case "lightning":
      return getClusteredPointCache(cacheType);
    case "isobar":
    case "isotherm":
      return getIsolineCache(cacheType);
    case "plot":
      // case "marine":
      // case "lighthouse":
      return getSurfacePlotCache();
    default:
      try {
        const cache = (await redis.json.get(`${CACHE_PREFIX}:${cacheType}:flat`, { path: "$" })) as
          | PayloadCache[]
          | null;

        if (cache?.[0]) {
          return { data: cache[0].data, lastUpdatedTime: cache[0].lastUpdatedTime };
        } else {
          return emptyPayloadCache();
        }
      } catch (err) {
        console.error(`[Redis Get Cache Failed] ${cacheType}: ${err instanceof Error ? err.message : String(err)}`);
        return emptyPayloadCache();
      }
  }
};

export const getStationCache = async () => {
  try {
    const cache = (await redis.json.get(`${CACHE_PREFIX}:stationList`, { path: "$" })) as StationList[] | null;

    return cache?.[0] ?? { data: { min: [], med: [], max: [] }, lastUpdatedTime: 0 };
  } catch (err) {
    console.error(`[Redis Get Cache Failed] stationList: ${err instanceof Error ? err.message : String(err)}`);
    return {
      data: { min: [], med: [], max: [] },
      lastUpdatedTime: 0,
    };
  }
};

export const updateStationCache = async (data: StationList["data"], lastUpdatedTime: number) => {
  try {
    await redis.json.set(`${CACHE_PREFIX}:stationList`, "$", {
      data,
      lastUpdatedTime,
    } as unknown as RedisJSON);
  } catch (err) {
    console.error(`[Redis Overwrite Cache Failed] stationList: ${err instanceof Error ? err.message : String(err)}`);
  }
};
