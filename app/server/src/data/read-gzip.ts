import { createGunzip } from "zlib";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";
import { ETAG_CACHE_KEY } from "../config/cache-keys.config.js";
import { cacheClient } from "../services/redis.js";

export async function readGzipFile(url: string, dataType: string) {
  if (!cacheClient) {
    console.warn(`[${dataType.toUpperCase()}] Redis client not available, continuing naively.`);
  }

  const previousCacheKey = cacheClient ? await cacheClient.get(`${ETAG_CACHE_KEY}:${dataType}`) : null;

  try {
    // do preflight check with HEAD request to get the ETag
    const headResponse = await fetch(url, { method: "HEAD", headers: DEFAULT_REMOTE_HEADERS });
    if (!headResponse.ok) {
      throw new Error(`Failed to fetch HEAD: ${headResponse.status} ${headResponse.statusText}`);
    }

    const remoteETag = headResponse.headers.get("ETag");
    if (remoteETag) {
      if (previousCacheKey === remoteETag) {
        console.log(`[${dataType.toUpperCase()}] ETag matches previous cache key, skipping fetch.`);
        return null;
      } else {
        if (cacheClient) {
          await cacheClient.set(`${ETAG_CACHE_KEY}:${dataType}`, remoteETag);
        }
      }
    }

    // fetch the compressed data
    const arrayBuffer = await fetch(url, { headers: DEFAULT_REMOTE_HEADERS }).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }

      return res.arrayBuffer();
    });
    const compressedData = Buffer.from(arrayBuffer);

    // decompress the data
    const decompressedData = await new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      gunzip.on("error", (err) => reject(err));

      gunzip.write(compressedData);
      gunzip.end();
    });

    if (typeof decompressedData !== "string") {
      throw new Error(`[${dataType.toUpperCase()}] Decompressed data is not a string`);
    }

    return decompressedData;
  } catch (error) {
    console.error(`[${dataType.toUpperCase()}] Error reading gzip file:`, error);
    throw error;
  }
}
