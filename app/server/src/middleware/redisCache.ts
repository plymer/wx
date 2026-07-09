import { createMiddleware } from "hono/factory";
import { gunzipSync, gzipSync } from "zlib";
import { cacheClient } from "../main.js";

export const redisCache = (ttlMs: number, contentType: "json" | "text" | "mvt") =>
  createMiddleware(async (c, next) => {
    if (!cacheClient || !cacheClient.isReady) {
      console.warn("[REDIS CACHE] Redis client is not initialized.");
      return next();
    }

    // @ts-expect-error -- validated path params depend on the shape of the validator (which this middleware does not know about)
    const validatedPathParams = c.req.valid?.("param") as Record<string, unknown> | undefined;

    // @ts-expect-error -- validated query params depend on the shape of the validator (which this middleware does not know about)
    const validatedQueryParams = c.req.valid?.("query") as Record<string, unknown> | undefined;

    const allParams: Record<string, unknown> = {
      ...c.req.param(),
      ...c.req.query(),
      ...(validatedPathParams || {}),
      ...(validatedQueryParams || {}),
    };

    const sortedKeys = Object.keys(allParams).sort();

    const paramString =
      sortedKeys.length > 0 ? ":" + sortedKeys.map((key) => `${key}=${allParams[key]}`).join(":") : "";

    const key = `cache:${c.req.path}:${contentType}:${paramString}`;

    try {
      const cachedBase64 = await cacheClient.get(key);

      if (cachedBase64) {
        const raw = gunzipSync(Buffer.from(cachedBase64, "base64"));
        const headerContentType =
          contentType === "json"
            ? "application/json"
            : contentType === "text"
              ? "text/plain"
              : "application/vnd.mapbox-vector-tile";

        const body = contentType === "mvt" ? raw : raw.toString("utf8");

        return new Response(body, {
          headers: { "Content-Type": headerContentType, "X-Cache": "HIT" },
        });
      }
    } catch (error) {
      console.error("[REDIS CACHE] Error retrieving from cache:", error);
    }

    await next();

    // after the request completes, save the response to the cache
    if (c.res.status === 200) {
      c.res.headers.set("X-Cache", "MISS");

      const queueLimit = 50;
      const currentQueue = cacheClient.queue?.length || 0;

      if (currentQueue < queueLimit) {
        const saveToCache = async () => {
          try {
            const rawData =
              contentType === "mvt"
                ? Buffer.from(await c.res.clone().arrayBuffer())
                : Buffer.from(await c.res.clone().text(), "utf8");
            const compressed = gzipSync(rawData).toString("base64");
            const ttlSec = ttlMs / 1000;

            const timeout = 800; // 800ms timeout for cache set op

            const savePromise = cacheClient.set(key, compressed, { EX: ttlSec });
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Cache set operation timed out")), timeout),
            );

            await Promise.race([savePromise, timeoutPromise]);
          } catch (error) {
            console.log("[REDIS CACHE]", error);
          }
        };
        saveToCache().catch(() => {});
      } else {
        console.warn("[REDIS CACHE] Cache queue limit reached. Skipping cache save for this request.");
      }
    }
  });
