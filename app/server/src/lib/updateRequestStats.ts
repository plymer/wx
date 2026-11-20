import { cacheClient } from "../services/redis.js";

function makeDateHash() {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const hour = now.getUTCHours();

  return `${year}${month}${day}${hour}`;
}

export const COUNT_FIELD = "count";

export async function updateRequestStatsByTime(keys: Record<string, string | number>) {
  if (!cacheClient || !cacheClient.isReady) {
    console.warn("[REQUEST STATS] Redis client is not initialized.");
    return;
  }

  const dateHash = makeDateHash();

  for (const k of Object.keys(keys)) {
    const key = `stats:${k}:${dateHash}:${keys[k]}`;
    await cacheClient.hIncrBy(key, COUNT_FIELD, 1);
  }
}

export async function updateRequestStats(keys: Record<string, string | number>) {
  if (!cacheClient || !cacheClient.isReady) {
    console.warn("[REQUEST STATS] Redis client is not initialized.");
    return;
  }

  for (const k of Object.keys(keys)) {
    const key = `stats:${k}:${keys[k]}`;
    await cacheClient.hIncrBy(key, COUNT_FIELD, 1);
  }
}
