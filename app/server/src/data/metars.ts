import "dotenv/config";
import { lt, Relations } from "drizzle-orm";
import { generateDbConnection, readGzipFile } from "../lib/utils.js";
import { xmlParser } from "../lib/utils.js";
import { metars } from "../db/tables/data.drizzle.js";
import type { CacheMetarData, MetarData, XMLCacheFile } from "../lib/types.js";
import { metarSchema } from "../lib/validation.js";
import { HOUR } from "../lib/constants.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/metars.cache.xml.gz";

export async function getMetars<TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>>(
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>,
) {
  if (!db) {
    throw new Error("[METAR] Database connection failed.");
  }

  const xml = await readGzipFile(RESOURCE_URL, "metar");

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

    console.log(`[METAR] Inserting ${output.length} METARs...`);

    // console.log("METAR Data Keys:", Array.from(dataKeys).sort());

    // insert the metar data, or update each metar if it already exists (our pk is siteId + validTime)
    await Promise.allSettled(
      output.map(async (metar) => {
        await db
          .insert(metars)
          .values(metar)
          .onConflictDoUpdate({
            target: [metars.siteId, metars.validTime],
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

    console.log(`[METAR] Cleaning up old data...`);
    // now clean up the database and remove any metars older than 96 hours
    await db.delete(metars).where(lt(metars.validTime, new Date(Date.now() - 96 * HOUR)));

    console.log(`[METAR] Cleanup complete.`);

    console.log(`[METAR] Cache file processing complete.`);
  } catch (error) {
    throw new Error(`[METAR] Error processing cache file: ${(error as Error).message}`);
  }
}
