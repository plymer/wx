import { cacheClient } from "../services/redis.js";
import type { HurricaneDataType, HurricaneDataResponse } from "../lib/hurricanes.types.js";
import type { DataProcessResult } from "../lib/types.js";
import { HURRICANE_CACHE_KEY } from "../config/cache-keys.config.js";
import { transformHurricaneMetobject } from "../lib/utils.js";

export async function getHurricaneData(): Promise<DataProcessResult> {
  if (!cacheClient) {
    throw new Error("Cache client is not initialized");
  }

  const now = new Date().getTime();

  let wasError = false;
  const DATA_TYPES: HurricaneDataType[] = ["track", "error_cone", "cyclone", "wind_radii"];

  for (const type of DATA_TYPES) {
    const url = `https://api.weather.gc.ca/collections/hurricanes-${type}-realtime/items?lang=en&sortby=latest_publication&latest_publication=true&active=true&f=json`;
    try {
      const response = (await fetch(url).then((res) => res.json())) as HurricaneDataResponse[typeof type];

      if (!response || !response.features) {
        console.error(`No features found for hurricane data type: ${type}`);
        continue;
      }
      const cacheKey = `${HURRICANE_CACHE_KEY}:${type}`;
      const expiryTime = 60 * 60 * 6; // 6 hours

      const featureCount = response.features.length;
      const expiredFeatures = response.features.filter(
        (f) =>
          new Date(f.properties.forecast_datetime).getTime() < now &&
          new Date(f.properties.validity_datetime).getTime() < now,
      ).length;

      if (featureCount === expiredFeatures) {
        await cacheClient.setEx(cacheKey, expiryTime, JSON.stringify(transformHurricaneMetobject(type, [])));
      } else {
        await cacheClient.setEx(
          cacheKey,
          expiryTime,
          JSON.stringify(transformHurricaneMetobject(type, response.features)),
        );
      }
    } catch (error) {
      console.error(`Error fetching hurricane data for type ${type}:`, (error as Error).message);
      wasError = true;
    }
  }

  if (wasError) return { result: "error" };
  else return { result: "success" };
}
