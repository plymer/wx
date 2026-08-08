import { publicProcedure, router } from "../services/trpc.js";
import { pgDb as db } from "../services/database.js";
import { TRPCError } from "@trpc/server";
import { HOUR } from "../lib/constants.js";

export const aqRouter = router({
  aq: publicProcedure.query(async () => {
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No avwx connection available",
      });
    }

    const aqData = await db.query.aqData.findMany({
      where: { validTime: { gt: new Date(Date.now() - 4 * HOUR) } },
      orderBy: { validTime: "asc" },
    });

    return aqData;
  }),
});
