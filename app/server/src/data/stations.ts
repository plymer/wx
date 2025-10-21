// this script will download and parse the station catalog 'cache' files from aviationweather.gov
// stations update once per day

import "dotenv/config";
import { generateDbConnection, readGzipFile } from "../lib/utils.js";
import { stations } from "../db/tables/avwx.drizzle.js";
import { FEET_PER_METRE } from "../lib/constants.js";
import type { CacheStationData, StationData } from "../lib/types.js";
import { stationSchema } from "../lib/validation.js";
import { scrapeWiki } from "./canada-airports.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/stations.cache.json.gz";
const DB_NAME = "avwx";

async function main() {
  const db = await generateDbConnection(DB_NAME, { stations });

  if (!db) {
    console.error(`[${DB_NAME.toUpperCase()}] (Stations) Database connection failed.`);
    process.exit(1);
  }

  const data = await readGzipFile(RESOURCE_URL, DB_NAME);

  try {
    // parse the JSON data
    const stationData: CacheStationData[] = JSON.parse(data);

    if (stationData.length === 0) {
      throw new Error(`[${DB_NAME.toUpperCase()}] No station data found in the cache file.`);
    }

    const output: StationData[] = stationData
      .map((station) => {
        // parse our object and validate it against the schema
        const parsed = stationSchema.safeParse(station);
        if (!parsed.success) {
          console.error(`[${DB_NAME.toUpperCase()}] Invalid station data (${station.icaoId}): ${parsed.error.message}`);
          return undefined; // skip invalid station data
        }

        return {
          name: station.site,
          siteId: station.icaoId,
          lat: station.lat,
          lon: station.lon,
          elev_f: Math.floor(station.elev * FEET_PER_METRE),
          elev_m: station.elev,
          country: station.country,
          state: station.state,
        };
      })
      .filter((entry) => entry !== undefined); // filter out any undefined entries

    console.log(`[${DB_NAME.toUpperCase()}] Inserting ${output.length} stations...`);

    // insert the station data, or update each station if it already exists
    await Promise.allSettled(
      output.map(async (station) => {
        await db
          .insert(stations)
          .values(station)
          .onDuplicateKeyUpdate({
            set: {
              name: station.name,
              lat: station.lat,
              lon: station.lon,
              elev_f: station.elev_f,
              elev_m: station.elev_m,
              country: station.country,
              state: station.state,
            },
          });
      }),
    );

    console.log(`[${DB_NAME.toUpperCase()}] Station cache file processing complete.`);
  } catch (error) {
    console.error(`[${DB_NAME.toUpperCase()}] Error processing station cache file: ${(error as Error).message}`);
    process.exit(1);
  }

  try {
    await scrapeWiki();
  } catch (error) {
    console.error(
      `[${DB_NAME.toUpperCase()}] Error scraping Canadian Sites from Wikipedia: ${(error as Error).message}`,
    );
    process.exit(1);
  }
  process.exit(0);
}

await main();
