import { gte } from "drizzle-orm";
import type { Feature, Point } from "geojson";
import { TRPCError } from "@trpc/server";

import { aqData } from "../db/tables/aq.drizzle.js";
import { aqSchema } from "../validationSchemas/aq.zod.js";
import { HOUR } from "../lib/constants.js";

import type { AQData } from "../lib/types.js";
import { aqDb } from "../main.js";
import { publicProcedure, router } from "../lib/trpc.js";

export const aqRouter = router({
  aq: publicProcedure.input(aqSchema).query(async ({ input }) => {
    if (!aqDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No AQ database connection available" });
    }

    const { hours } = input;
    console.log(`[API] Fetching AQ data from the last ${hours} hours(s)...`);

    const then = new Date(new Date().getTime() - hours * HOUR);

    try {
      const data = await aqDb.query.aqData.findMany({
        where: gte(aqData.validTime, then),
      });

      const geoData = data.reduce((acc: Array<Feature<Point>>, item: AQData) => {
        if (!item.lat || !item.lon) {
          console.warn(`Skipping item with missing coordinates: ${JSON.stringify(item)}`);
          return acc;
        }

        const output: Feature<Point> = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [item.lon, item.lat],
          },
          properties: {
            name: item.name,
            type: item.type,
            pm25: item.pm25,
            validTime: item.validTime,
          },
        };

        acc.push(output);
        return acc;
      }, []);

      return geoData;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
});
