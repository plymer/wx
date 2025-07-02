// this script will download and parse the station catalog 'cache' files from aviationweather.gov
// stations update once per day

import { createGunzip } from "zlib";
import axios from "axios";
// import { drizzle } from "drizzle-orm/mysql2";

const RESOURCE_URL = "https://aviationweather.gov/data/cache/stations.cache.json.gz";

async function main() {
  // const db = drizzle();

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
      throw new Error("Decompressed data is not a string");
    }

    // parse the JSON data
    const stations = JSON.parse(decompressedData as string);

    // process and store the station data in the database
    for (const station of stations) {
      // Here you would insert or update your station data in the database
      console.log(`Processing station: ${station}`);
      // Example: await db.insert(stationTable).values(station);
    }

    console.log("Station catalog processing complete.");
  } catch (error) {
    console.error("Error processing station catalog:", error);
  }
}

await main();
