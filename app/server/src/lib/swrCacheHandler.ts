import { LRUCache } from "lru-cache";
import type { SwrCacheEntry } from "./common.types.js";

export function createSwrCacheHandler<T>({
  cacheKey,
  freshMs,
  staleMs,
  fetchFn,
  cache,
  max,
}: {
  cacheKey: string;
  freshMs: number;
  staleMs: number;
  fetchFn: () => Promise<T>;
  cache?: LRUCache<string, SwrCacheEntry<T>>;
  max?: number;
}) {
  const swrCache = cache ?? new LRUCache<string, SwrCacheEntry<T>>({ max: max ?? 1 });
  let refreshPromise: Promise<T> | null = null;

  const refresh = async (): Promise<T> => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = fetchFn()
      .then((data) => {
        const now = Date.now();

        swrCache.set(cacheKey, {
          data,
          freshUntil: now + freshMs,
          staleUntil: now + staleMs,
        });

        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  };

  const get = async (): Promise<T> => {
    const cached = swrCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.freshUntil > now) {
      return cached.data;
    }

    if (cached && cached.staleUntil > now) {
      // Serve stale data immediately while refreshing in the background.
      void refresh().catch((error) => {
        console.error(`[${cacheKey}] Background refresh failed`, error);
      });

      return cached.data;
    }

    return refresh();
  };

  const clear = () => {
    swrCache.delete(cacheKey);
  };

  return { get, refresh, clear };
}
