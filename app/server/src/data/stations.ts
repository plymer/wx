// this script will download and parse the station catalog 'cache' files from aviationweather.gov
// stations update once per day

import "dotenv/config";
import { readGzipFile } from "../lib/utils.js";
import { stations } from "../db/schemas.drizzle.js";
import { FEET_PER_METRE } from "../lib/constants.js";
import type { CacheStationData, StationData } from "../lib/types.js";
import { stationSchema } from "../lib/validation.js";
import { scrapeWiki } from "./canada-airports.js";
import type { DbShape } from "../services/database.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/stations.cache.json.gz";

export async function buildStationCatalog<TSchema extends Record<string, unknown>>(db: Awaited<DbShape<TSchema>>) {
  if (!db) {
    throw new Error("[STATIONS] Database connection failed.");
  }

  const data = await readGzipFile(RESOURCE_URL, "station");

  try {
    // parse the JSON data
    const stationData: CacheStationData[] = JSON.parse(data);

    if (stationData.length === 0) {
      throw new Error(`[STATION] No station data found in the cache file.`);
    }

    const output: StationData[] = stationData
      .map((station) => {
        if (!station.icaoId) return undefined; // skip stations without an ICAO ID
        // parse our object and validate it against the schema
        const parsed = stationSchema.safeParse(station);
        if (!parsed.success) {
          // console.error(`[STATION] Invalid station data (${station.icaoId}): ${parsed.error.message}`);
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

    // insert the station data, or update each station if it already exists
    await Promise.allSettled(
      output.map(async (station) => {
        await db
          .insert(stations)
          .values(station)
          .onConflictDoUpdate({
            target: stations.siteId,
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
  } catch (error) {
    console.error(`[STATION] Error processing station cache file: ${(error as Error).message}`);
    process.exit(1);
  }

  try {
    await scrapeWiki(db);
  } catch (error) {
    console.error(`[STATION] Error scraping Canadian Sites from Wikipedia: ${(error as Error).message}`);
    process.exit(1);
  }
}
