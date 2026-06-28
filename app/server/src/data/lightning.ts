import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";
import type { LightningFC } from "../lib/lightning.types.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { lt, type Relations } from "drizzle-orm";
import type { generateDbConnection } from "../lib/utils.js";
import { lightningData } from "../db/tables/data.drizzle.js";

const formatDateToUrlDate = (date: Date) => {
  return date
    .toISOString()
    .replace(/.\d+Z$/g, "")
    .replace("T", "_")
    .replace(/:/g, "");
};

export async function getLightning<TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>>(
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>,
) {
  if (!db) {
    throw new Error("[LIGHTNING] Database connection failed.");
  }

  // we want to check the 'current time' of the roundedMinutes (closest 6-minute bin) and then the previous 6-minute bin to catch any 'strays' or update with a new 'slice' after a new timestamp is generated
  // its a strange way that they serve the data, but it is what it is
  // current bin catched everything from the requested time until the next bin is generated (ex. 18:36Z bin catches everything from 18:30Z until 18:42Z)
  // after which the new bin is created and starts accumulating, while the 'old' bin gets trimmed (ex. new bin 18:36Z until 18:48Z, old bin now 18:30Z until 18:36Z)
  // this means we have to 'recompute' the previous bin's strikes

  const latestTime = new Date().getUTCMinutes();
  const roundedMinutes = Math.floor(latestTime / 6) * 6;

  const currentBin = new Date();
  currentBin.setUTCMinutes(roundedMinutes);
  currentBin.setUTCSeconds(0);
  currentBin.setUTCMilliseconds(0);

  const previousBin = new Date(currentBin);
  previousBin.setUTCMinutes(roundedMinutes - 6);

  const bins = [formatDateToUrlDate(currentBin), formatDateToUrlDate(previousBin)];

  const urlList = bins.map((ts) => `https://weather.gc.ca/api/app/v2/Lightning/1/${ts}`);

  try {
    const responses = (
      await Promise.all(
        urlList.map(async (url) =>
          fetch(url, { headers: DEFAULT_REMOTE_HEADERS })
            .then((res) => res.json() as Promise<LightningFC>)
            .catch((err) => {
              console.error(`[LIGHTNING] Error when fetching data from ${url}:`, err.message);
              return null;
            }),
        ),
      )
    ).filter((res): res is LightningFC => res !== null);

    await Promise.allSettled(
      responses.map(async (res) => {
        if (!res) return null;

        const { dateFrom, dateTo, features } = res;

        const from = new Date(dateFrom);
        const to = new Date(dateTo);

        const strikeCoords = features
          .map((f) => {
            if (f.geometry.type !== "Point") {
              throw new Error("[LIGHTNING] Error: Lightning feature not type 'Point'");
            }
            return f.geometry.coordinates.join(",");
          })
          .join(" ");

        await db
          .insert(lightningData)
          .values({ dateFrom: from, dateTo: to, strikes: strikeCoords })
          .onConflictDoUpdate({
            target: lightningData.dateFrom,
            set: { dateFrom: from, dateTo: to, strikes: strikeCoords },
          });
      }),
    );

    await db.delete(lightningData).where(lt(lightningData.dateFrom, new Date(new Date().getTime() - 4 * HOUR)));
  } catch (error) {
    throw new Error(`[LIGHTNING] Error: ${(error as Error).stack}`);
  }
}
