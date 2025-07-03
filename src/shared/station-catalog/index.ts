// this script will download and parse the station catalog 'cache' files from aviationweather.gov
// stations update once per day

import { createGunzip } from "zlib";
import axios from "axios";
import { generateDbConnection } from "../lib/utils";
import { stations } from "../db/schemas/stations.drizzle";
import { FEET_PER_METRE } from "../../server/lib/utils";

export type CacheStationData = {
  icaoId: string;
  iataId: string;
  faaId: string;
  wmoId: string;
  lat: number;
  lon: number;
  elev: number;
  site: string;
  state: string;
  country: string;
  priority: number;
};

const RESOURCE_URL = "https://aviationweather.gov/data/cache/stations.cache.json.gz";

async function main() {
  const db = await generateDbConnection("station-catalog", { stations });

  if (!db) {
    console.error("[Station Catalog] Database connection failed.");
    return;
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
      throw new Error("[Station Catalog] Decompressed data is not a string");
    }

    // parse the JSON data
    const stationData: CacheStationData[] = JSON.parse(decompressedData as string);

    if (stationData.length === 0) {
      console.warn("[Station Catalog] No station data found in the cache file.");
      return;
    }

    // process and store the station data in the database
    for (const station of stationData) {
      db.insert(stations).values({
        name: station.site,
        icaoId: station.icaoId,
        lat: station.lat,
        lon: station.lon,
        elev_f: station.elev * FEET_PER_METRE,
        elev_m: station.elev,
        country: station.country,
        state: station.state,
      });
    }

    console.log("[Station Catalog] Cache file processing complete.");
  } catch (error) {
    console.error("[Station Catalog] Error processing cache file:", error);
  }
}

await main();
