import "dotenv/config";
import * as fs from "fs/promises";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";

export async function getPublicAlerts() {
  const dataDir = process.env.STATIC_DATA_DIR || "./static-data";
  const destination = `${dataDir}/public-alerts.json`;

  const sourceUrl = "https://weather.gc.ca/data/dms/alert_geojson_2_0/alerts.public.en.geojson";

  try {
    const response = await fetch(sourceUrl, { headers: DEFAULT_REMOTE_HEADERS });
    if (!response.ok) {
      throw new Error(`[WXO] [ALERTS] Failed to fetch public alerts: ${response.statusText}`);
    }

    // extract the GeoJSON from the response
    const alertsGeoJSON = await response.json();

    // ensure the data directory exists
    const dataDirExists = await fs
      .access(dataDir)
      .then(() => true)
      .catch(() => false);

    if (!dataDirExists) await fs.mkdir(dataDir, { recursive: true });

    // write the data to a local file for caching
    await fs.writeFile(destination, JSON.stringify(alertsGeoJSON));

    console.log(`[WXO] [ALERTS] Public alerts data successfully fetched and saved to ${destination}`);
  } catch (error) {
    console.error(`[WXO] [ALERTS] Error fetching public alerts: ${error}`);
    return;
  }
}

await getPublicAlerts();
