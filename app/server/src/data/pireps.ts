import "dotenv/config";
import { lt, Relations } from "drizzle-orm";
import { generateDbConnection, readGzipFile } from "../lib/utils.js";
import { xmlParser } from "../lib/utils.js";
import { pireps } from "../db/tables/data.drizzle.js";
import type { CachePirepData, PirepData, XMLCacheFile } from "../lib/types.js";
import { pirepSchema } from "../lib/validation.js";
import { HOUR } from "../lib/constants.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";

const CACHEFILE_URL = "https://aviationweather.gov/data/cache/aircraftreports.cache.xml.gz";
// const NAVCAN_URL =
//   "https://plan.navcanada.ca/weather/api/alpha/?site=CZEG&site=CZVR&site=CZWG&site=CZYZ&site=CZUL&site=CZQM&site=CZQX&alpha=pirep";

export async function getPireps<TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>>(
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>,
) {
  if (!db) {
    throw new Error("[PIREP] Database connection failed.");
  }

  const xml = await readGzipFile(CACHEFILE_URL, "pirep");

  const { parser } = xmlParser();

  const pirepData = (
    parser.parse(xml) as XMLCacheFile<CachePirepData, "aircraftreport">
  ).response.data.aircraftreport.filter((report) => report.reportType === "PIREP");

  try {
    const output: PirepData[] = pirepData
      .map((pirep) => {
        // if we can't geo-locate the pirep, throw it out
        if (pirep.longitude === -99.99 || pirep.latitude === -99.99) return;

        // use our validation schema to make sure we are passing valid data into the database
        const parsed = pirepSchema.safeParse(pirep);

        if (!parsed.success) {
          console.error(parsed.error);
          return;
        }

        // destructure the parsed data to get the fields we want
        const {
          aircraftRef: aircraftType,
          latitude: lat,
          longitude: lon,
          observationTime: validTime,
          rawText,
          icingCondition,
          turbulenceCondition,
          altitudeFtMsl: flightLevel,
        } = parsed.data;

        const icg = icingCondition?.icingIntensity || null;
        const turb = turbulenceCondition?.turbulenceIntensity || null;

        // return the data, ready to be inserted into the database
        return {
          aircraftType,
          lat,
          lon,
          validTime,
          rawText,
          flightLevel,
          icg,
          turb,
        };
      })
      .filter((entry) => entry !== undefined);

    console.log(`[PIREP] Inserting ${output.length} PIREPs...`);

    // insert the pirep data, or update each pirep if it already exists (our pk is lat + lon + validTime)
    await Promise.allSettled(
      output.map(async (pirep) => {
        await db
          .insert(pireps)
          .values(pirep)
          .onConflictDoUpdate({
            target: [pireps.lat, pireps.lon, pireps.validTime],
            set: {
              flightLevel: pirep.flightLevel,
              aircraftType: pirep.aircraftType,
              icg: pirep.icg,
              turb: pirep.turb,
              rawText: pirep.rawText,
            },
          });
      }),
    );

    console.log(`[PIREP] Cleaning up old data...`);
    // now clean up the database and remove any pireps older than 4 hours
    await db.delete(pireps).where(lt(pireps.validTime, new Date(Date.now() - 4 * HOUR)));

    console.log(`[PIREP] Cleanup complete.`);

    console.log(`[PIREP] Cache file processing complete.`);
  } catch (error) {
    throw new Error(`[PIREP] Error processing cache file: ${(error as Error).message}`);
  }
}
