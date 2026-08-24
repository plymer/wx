import { ETAG_CACHE_KEY } from "../config/cache-keys.config.js";
import { CHECKIN_HEADERS } from "./constants.js";
import { cacheClient } from "../services/redis.js";

/**
 * Perform a HEAD request to determin if we need to fetch a remote resource based on its ETag
 * @param url the URL to perform the HEAD request against
 * @param dataType the key to use for caching the ETag in Redis
 * @returns A boolean indicating whether the resource should be fetched (true) or skipped (false)
 */
export async function etagCheckin(url: string, dataType: string): Promise<boolean> {
  if (!cacheClient) {
    console.warn(`[${dataType.toUpperCase()}] Redis client not available, continuing naively.`);
    return true;
  }

  const previousCacheKey = await cacheClient.get(`${ETAG_CACHE_KEY}:${dataType}`);
  // do preflight check with HEAD request to get the ETag
  const headResponse = await fetch(url, { method: "HEAD", headers: CHECKIN_HEADERS });
  if (!headResponse.ok) {
    throw new Error(`Failed to fetch HEAD: ${headResponse.status} ${headResponse.statusText}`);
  }

  const remoteETag = headResponse.headers.get("ETag");
  if (remoteETag) {
    if (previousCacheKey === remoteETag) {
      console.log(`[${dataType.toUpperCase()}] ETag matches previous cache key, skipping fetch.`);
      return false;
    } else {
      await cacheClient.set(`${ETAG_CACHE_KEY}:${dataType}`, remoteETag);
    }
  }
  return true;
}
