import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../services/trpc.js";
import { getTile } from "../db/mvt-query.js";
import { tileSchema } from "../validationSchemas/tiles.zod.js";

export const tilesRouter = router({
  tiles: publicProcedure.input(tileSchema).query(async ({ input }) => {
    const { t, z, x, y } = input;
    try {
      const tiles = await getTile(t, z, x, y);
      return tiles;
    } catch (error) {
      console.error("[TILES] Error fetching tiles:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tiles.",
      });
    }
  }),
});
