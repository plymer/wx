import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { tileSchema } from "../validationSchemas/tiles.zod.js";
import { redisCache } from "../middleware/redisCache.js";
import { MINUTE } from "../lib/constants.js";
import { getTile } from "../db/mvt-query.js";
import { COUNT_FIELD, updateRequestStatsByTime } from "../lib/updateRequestStats.js";
import { cacheClient } from "../services/redis.js";

const apiRouter = new Hono();

apiRouter.get("/health", (c) => {
  return c.json({ status: "ok" });
});

apiRouter.get("/stats", async (c) => {
  if (!cacheClient || !cacheClient.isReady) {
    console.warn("[REQUEST STATS] Redis client is not initialized.");
    return;
  }

  const statsKeys: string[] = [];

  for await (const k of cacheClient.scanIterator({ MATCH: "stats:*", COUNT: 100 })) {
    statsKeys.push(...k);
  }

  if (statsKeys.length === 0) return c.text("no stats available");

  const values = (await Promise.all(statsKeys.map((key) => cacheClient.hGet(key, COUNT_FIELD))))
    .filter((count): count is string => count !== null)
    .map((count, idx) => {
      const keyParts = statsKeys[idx].replace("stats:", "").split(":");

      switch (keyParts[0]) {
        case "hours": {
          const [type, hours] = keyParts;
          return { type, hours: parseInt(hours, 10), count: parseInt(count, 10) };
        }
        case "siteId": {
          const [type, date, site] = keyParts;
          return { type, date, site, count: parseInt(count, 10) };
        }

        case "position": {
          const [type, date, tile] = keyParts;
          return { type, date, tile, count: parseInt(count, 10) };
        }

        default:
          return { ...keyParts };
      }
    })
    .sort((a, b) => (a.type ? a.type.localeCompare(b.type || "") : -1));

  return c.json(values, 200);
});

apiRouter.get("/tiles/:t/:z/:x/:y", redisCache(MINUTE, "mvt"), zValidator("param", tileSchema), async (c) => {
  const { t, z, x, y } = c.req.valid("param");
  const tileData = await getTile(t, z, x, y);

  if (tileData) {
    await updateRequestStatsByTime({ position: `${z}-${x}-${y}` });
    c.header("Content-Type", "application/vnd.mapbox-vector-tile");
    return c.body(tileData as unknown as any);
  } else {
    return c.text("Tile not found", 404);
  }
});

export { apiRouter };
