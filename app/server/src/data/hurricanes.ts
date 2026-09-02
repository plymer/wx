import { cacheClient } from "../services/redis.js";
import type { DataTypes, HurricaneDataResponse } from "../lib/hurricanes.types.js";
import type { DataProcessResult } from "../lib/types.js";
import { HURRICANE_CACHE_KEY } from "../config/cache-keys.config.js";

export async function getHurricaneData(): Promise<DataProcessResult> {
  if (!cacheClient) {
    throw new Error("Cache client is not initialized");
  }

  let wasError = false;
  const DATA_TYPES: DataTypes[] = ["track", "error_cone", "cyclone", "wind_radii"];

  for (const type of DATA_TYPES) {
    const url = `https://api.weather.gc.ca/collections/hurricanes-${type}-realtime/items?lang=en&sortby=latest_publication&latest_publication=true&active=true&f=json`;
    try {
      const response = (await fetch(url).then((res) => res.json())) as HurricaneDataResponse[typeof type];

      if (!response || !response.features) {
        console.error(`No features found for hurricane data type: ${type}`);
        continue;
      }

      console.log("\n", response.features, "\n");

      // extract our features and store them in the cache
      const cacheKey = `${HURRICANE_CACHE_KEY}:${type}`;
      const expiryTime = 60 * 60 * 6; // 6 hours

      await cacheClient.setEx(cacheKey, expiryTime, JSON.stringify(response.features));
    } catch (error) {
      console.error(`Error fetching hurricane data for type ${type}:`, (error as Error).message);
      wasError = true;
    }
  }

  if (wasError) return { result: "error" };
  else return { result: "success" };
}
