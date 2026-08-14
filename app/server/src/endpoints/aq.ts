import { publicProcedure, router } from "../services/trpc.js";
import { pgDb as db } from "../services/database.js";
import { TRPCError } from "@trpc/server";
import { HOUR } from "../lib/constants.js";
// import { AQ_DATA_CACHE_KEY } from "../config/cache-keys.config.js";
// import { cacheClient } from "../services/redis.js";
// import type { AQData } from "../lib/types.js";

export const aqRouter = router({
  aq: publicProcedure.query(async () => {
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No avwx connection available",
      });
    }

    // const cachedData = await cacheClient.get(AQ_DATA_CACHE_KEY);

    // if (cachedData) {
    //   console.log("[API] Cache HIT for AQ data");
    //   return JSON.parse(cachedData) as AQData[];
    // }

    // console.log("[API] Cache MISS for AQ data. Fetching from source...");

    const aqData = await db.query.aqData.findMany({
      where: { validTime: { gt: new Date(Date.now() - 4 * HOUR) } },
      orderBy: { validTime: "asc" },
    });

    // await cacheClient.setEx(AQ_DATA_CACHE_KEY, 60 * 10, JSON.stringify(aqData));

    return aqData;
  }),
});
