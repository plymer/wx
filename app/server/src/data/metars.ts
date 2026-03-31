// this script will download and parse the metars 'cache' files from aviationweather.gov
// metar cache updates minutely

import "dotenv/config";
import { lt } from "drizzle-orm";
import { generateDbConnection, readGzipFile } from "../lib/utils.js";
import { xmlParser } from "../lib/utils.js";
import { metars } from "../db/tables/avwx.drizzle.js";
import type { CacheMetarData, MetarData, XMLCacheFile } from "../lib/types.js";
import { metarSchema } from "../lib/validation.js";
import { HOUR } from "../lib/constants.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/metars.cache.xml.gz";
const DB_NAME = "avwx";

async function main() {
  const db = await generateDbConnection(DB_NAME, { metars });

  if (!db) {
    console.error(`[${DB_NAME.toUpperCase()}] (METARs) Database connection failed.`);
    process.exit(1);
  }

  const xml = await readGzipFile(RESOURCE_URL, DB_NAME);

  const { parser } = xmlParser();

  const metarData = (parser.parse(xml) as XMLCacheFile<CacheMetarData, "metar">).response.data.metar;

  // const dataKeys = new Set<string>();

  try {
    const output: MetarData[] = metarData
      .map((metar) => {
        // if we can't geo-location the metars, throw them out
        if (metar.longitude === -99.99 || metar.latitude === -99.99 || metar.elevationM === 9999) return;

        // use our validation schema to make sure we are passing valid data into the database
        const parsed = metarSchema.safeParse(metar);

        if (!parsed.success) {
          console.error("PARSE ERROR", metar, parsed.error.issues);
          return;
        }

        // destructure the parsed data to get the fields we want
        const {
          stationId: siteId,
          observationTime: validTime,
          seaLevelPressureMb: mslp,
          rawText,
          flightCategory: category,
          tempC: tt,
          dewpointC: td,
          windDirDegrees: windDir,
          windGustKt: windGst,
          windSpeedKt: windSpd,
          wxString,
          visibilityStatuteMi: vis,
        } = parsed.data;

        const hasQnh = /Q\d{4}/.test(rawText);
        const outputMslp = mslp ? mslp : hasQnh ? parseInt(rawText.match(/Q\d{4}/)?.[0].substring(1) ?? "0") : null;

        // return the data, ready to be inserted into the database
        return {
          siteId,
          validTime,
          rawText,
          category,
          windDir,
          windSpd,
          windGst,
          vis,
          wxString,
          mslp: outputMslp === 0 ? null : outputMslp,
          tt,
          td,
        };
      })
      .filter((entry) => entry !== undefined);

    console.log(`[${DB_NAME.toUpperCase()}] Inserting ${output.length} METARs...`);

    // console.log("METAR Data Keys:", Array.from(dataKeys).sort());

    // insert the metar data, or update each metar if it already exists (our pk is siteId + validTime)
    await Promise.allSettled(
      output.map(async (metar) => {
        await db
          .insert(metars)
          .values(metar)
          .onDuplicateKeyUpdate({
            set: {
              category: metar.category,
              tt: metar.tt,
              td: metar.td,
              mslp: metar.mslp,
              windDir: metar.windDir,
              windSpd: metar.windSpd,
              windGst: metar.windGst,
              vis: metar.vis,
              wxString: metar.wxString,
              rawText: metar.rawText,
            },
          });
      }),
    );

    console.log(`[${DB_NAME.toUpperCase()}] Cleaning up old METARs...`);
    // now clean up the database and remove any metars older than 96 hours
    await db.delete(metars).where(lt(metars.validTime, new Date(Date.now() - 96 * HOUR)));

    console.log(`[${DB_NAME.toUpperCase()}] METAR cleanup complete.`);

    console.log(`[${DB_NAME.toUpperCase()}] METAR cache file processing complete.`);
    process.exit(0);
  } catch (error) {
    console.error(`[${DB_NAME.toUpperCase()}] Error processing METAR cache file: ${error as Error}`);
    process.exit(1);
  }
}

await main();
