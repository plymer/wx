// this script will download and parse the taf 'cache' files from aviationweather.gov
// taf cache updates minutely

import "dotenv/config";
import { lt } from "drizzle-orm";
import { generateDbConnection, readGzipFile } from "../shared/lib/utils.js";
import { xmlParser } from "../shared/lib/utils.js";
import { tafs } from "../shared/db/tables/avwx.drizzle.js";
import type { CacheTafData, TafData, XMLCacheFile } from "../shared/lib/types.js";
import { tafSchema } from "../shared/lib/validation.js";
import { HOUR } from "../shared/lib/constants.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/tafs.cache.xml.gz";
const DB_NAME = "avwx";

async function main() {
  const db = await generateDbConnection(DB_NAME, { tafs });

  if (!db) {
    console.error(`[${DB_NAME.toUpperCase()}] (TAFs) Database connection failed.`);
    process.exit(1);
  }

  const xml = await readGzipFile(RESOURCE_URL, DB_NAME);

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

    console.log(`[${DB_NAME.toUpperCase()}] Inserting ${output.length} TAFs...`);

    // insert the metar data, or update each metar if it already exists (our pk is siteId + validTime)
    await Promise.allSettled(
      output.map(async (taf) => {
        await db
          .insert(tafs)
          .values(taf)
          .onDuplicateKeyUpdate({
            set: { rawText: taf.rawText },
          });
      }),
    );

    console.log(`[${DB_NAME.toUpperCase()}] Cleaning up old TAFs...`);
    // now clean up the database and remove any tafs older than 24 hours
    await db.delete(tafs).where(lt(tafs.validTime, new Date(Date.now() - 24 * HOUR)));

    console.log(`[${DB_NAME.toUpperCase()}] TAF cleanup complete.`);

    console.log(`[${DB_NAME.toUpperCase()}] TAF cache file processing complete.`);
    process.exit(0);
  } catch (error) {
    console.error(`[${DB_NAME.toUpperCase()}] Error processing TAF cache file: ${(error as Error).message}`);
    process.exit(1);
  }
}

await main();
