import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { tileSchema } from "../validationSchemas/tiles.zod.js";
// import { redisCache } from "../middleware/redisCache.js";
// import { MINUTE } from "../lib/constants.js";
import { getTile } from "../db/mvt-query.js";

const apiRouter = new Hono();

apiRouter.get("/health", (c) => {
  return c.json({ status: "ok" });
});

apiRouter.get("/tiles/:t/:z/:x/:y", zValidator("param", tileSchema), async (c) => {
  const { t, z, x, y } = c.req.valid("param");
  const tileData = await getTile(t, z, x, y);

  if (tileData) {
    c.header("Content-Type", "application/vnd.mapbox-vector-tile");
    return c.body(tileData as unknown as any);
  } else {
    return c.text("Tile not found", 404);
  }
});

export { apiRouter };
