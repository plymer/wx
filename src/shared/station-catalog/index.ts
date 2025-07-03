// this script will download and parse the station catalog 'cache' files from aviationweather.gov
// stations update once per day

import { createGunzip } from "zlib";
import { sql } from "drizzle-orm";
import axios from "axios";
import { generateDbConnection } from "../lib/utils.js";
import { stations } from "../db/tables/stations.drizzle.js";
import { FEET_PER_METRE } from "../../server/lib/utils.js";
import { CacheStationData } from "../lib/types.js";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/stations.cache.json.gz";
const DB_NAME = "station-catalog";

async function main() {
  const db = await generateDbConnection(DB_NAME, { stations });

  if (!db) {
    console.error(`[${DB_NAME.toUpperCase()}] Database connection failed.`);
    process.exit(1);
  }

  try {
    // fetch the compressed data
    const response = await axios.get(RESOURCE_URL, { responseType: "arraybuffer" });
    const compressedData = response.data;

    // decompress the data
    const decompressedData = await new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      gunzip.on("error", (err) => reject(err));

      gunzip.write(compressedData);
      gunzip.end();
    });

    if (typeof decompressedData !== "string") {
      throw new Error(`[${DB_NAME.toUpperCase()}] Decompressed data is not a string`);
    }

    // parse the JSON data
    const stationData: CacheStationData[] = JSON.parse(decompressedData as string);

    if (stationData.length === 0) {
      throw new Error(`[${DB_NAME.toUpperCase()}] No station data found in the cache file.`);
    }

    const output = stationData.map((station) => {
      return {
        name: station.site,
        icaoId: station.icaoId,
        lat: station.lat,
        lon: station.lon,
        elev_f: Math.floor(station.elev * FEET_PER_METRE),
        elev_m: station.elev,
        country: station.country,
        state: station.state,
      };
    });

    console.log(`[${DB_NAME.toUpperCase()}] Inserting ${output.length} stations...`);

    // insert the station data, or update each station if it already exists
    await db
      .insert(stations)
      .values(output)
      .onDuplicateKeyUpdate({
        set: {
          name: sql`VALUES(name)`,
          lat: sql`VALUES(lat)`,
          lon: sql`VALUES(lon)`,
          elev_f: sql`VALUES(elev_f)`,
          elev_m: sql`VALUES(elev_m)`,
          country: sql`VALUES(country)`,
          state: sql`VALUES(state)`,
        },
      });

    console.log(`[${DB_NAME.toUpperCase()}] Cache file processing complete.`);
  } catch (error) {
    console.error(`[${DB_NAME.toUpperCase()}] Error processing cache file: ${(error as Error).message}`);
    process.exit(1);
  }
}

await main();
