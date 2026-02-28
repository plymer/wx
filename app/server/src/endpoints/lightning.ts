import type { Feature, MultiPoint, Point } from "geojson";
import { TRPCError } from "@trpc/server";

import type { LightningFC } from "../lib/lightning.types.js";
import { publicProcedure, router } from "../lib/trpc.js";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";

export const lightningRouter = router({
  lightning: publicProcedure.query(async () => {
    const latestTime = new Date().getUTCMinutes();
    const roundedMinutes = Math.floor(latestTime / 6) * 6;

    const searchStartTime = new Date();
    searchStartTime.setUTCMinutes(roundedMinutes);
    searchStartTime.setUTCSeconds(0);
    searchStartTime.setUTCMilliseconds(0);

    const timeStamps = [];
    for (let i = 0; i < 32; i++) {
      const time = new Date(searchStartTime.getTime() - i * 6 * 60 * 1000);
      const formattedTime = time
        .toISOString()
        .replace(/.\d+Z$/g, "")
        .replace("T", "_")
        .replace(/:/g, "");
      timeStamps.push(formattedTime);
    }

    const urlList = timeStamps.map((ts) => `https://weather.gc.ca/api/app/v2/Lightning/1/${ts}`);

    try {
      const responses = (
        await Promise.all(
          urlList.map(async (url) =>
            fetch(url, { headers: DEFAULT_REMOTE_HEADERS })
              .then((res) => res.json() as Promise<LightningFC>)
              .catch((err) => {
                console.error(`Error fetching data from ${url}:`, err.message);
                return null;
              }),
          ),
        )
      ).filter((res): res is LightningFC => res !== null);

      const features: Feature<MultiPoint, { validTime: number }>[] = [];

      responses.forEach((res) => {
        if (!res) return null;

        const validTime = new Date(res.dateTo || res.timeStamp).getTime();
        const coords = res.features.map((feature) => (feature.geometry as Point).coordinates);

        features.push({
          type: "Feature",
          geometry: { type: "MultiPoint", coordinates: coords },
          properties: {
            validTime,
          },
        });
      });

      return features;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
});
