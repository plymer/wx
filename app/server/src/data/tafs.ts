import "dotenv/config";
import { lt, Relations } from "drizzle-orm";
import { generateDbConnection, readGzipFile } from "../lib/utils.js";
import { xmlParser } from "../lib/utils.js";
import { tafs } from "../db/tables/data.drizzle.js";
import type { CacheTafData, TafData, XMLCacheFile } from "../lib/types.js";
import { tafSchema } from "../lib/validation.js";
import { HOUR } from "../lib/constants.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/tafs.cache.xml.gz";

export async function getTafs<TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>>(
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>,
) {
  if (!db) {
    throw new Error("[TAF] Database connection failed.");
  }

  const xml = await readGzipFile(RESOURCE_URL, "taf");

  const { parser } = xmlParser();

  const tafData = (parser.parse(xml) as XMLCacheFile<CacheTafData, "taf">).response.data.taf;

  try {
    const output: TafData[] = tafData
      .map((taf) => {
        // if we can't geo-location the metars, throw them out
        if (taf.longitude === -99.99 || taf.latitude === -99.99 || taf.elevationM === 9999) return;

        // use our validation schema to make sure we are passing valid data into the database
        const parsed = tafSchema.safeParse(taf);

        if (!parsed.success) {
          console.error(parsed.error);
          throw new Error(parsed.error.message);
        }

        // destructure the parsed data to get the fields we want
        const { stationId: siteId, issueTime: validTime, rawText } = parsed.data;

        // return the data, ready to be inserted into the database
        return {
          siteId,
          validTime,
          rawText,
        };
      })
      .filter((entry) => entry !== undefined);

    console.log(`[TAF] Inserting ${output.length} TAFs...`);

    // insert the metar data, or update each metar if it already exists (our pk is siteId + validTime)
    await Promise.allSettled(
      output.map(async (taf) => {
        await db
          .insert(tafs)
          .values(taf)
          .onConflictDoUpdate({
            target: [tafs.siteId, tafs.validTime],
            set: { rawText: taf.rawText },
          });
      }),
    );

    console.log(`[TAF] Cleaning up old TAFs...`);
    // now clean up the database and remove any tafs older than 24 hours
    await db.delete(tafs).where(lt(tafs.validTime, new Date(Date.now() - 24 * HOUR)));

    console.log(`[TAF] TAF cleanup complete.`);

    console.log(`[TAF] TAF cache file processing complete.`);
  } catch (error) {
    throw new Error(`[TAF] Error processing TAF cache file: ${(error as Error).message}`);
  }
}
