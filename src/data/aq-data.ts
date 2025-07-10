import axios from "axios";
import "dotenv/config";
import { lt } from "drizzle-orm";
import { generateDbConnection } from "../shared/lib/utils.js";
import { aqData } from "../shared/db/tables/aq.drizzle.js";
import { CSVAQData, AQData } from "../shared/lib/types.js";

async function main() {
  const remote = axios.create({ baseURL: "https://cyclone.unbc.ca/aqmap/data/" });

  const db = await generateDbConnection("aq", { aqData });

  if (!db) {
    console.error("[AQ Data] Failed to connect to the database.");
    process.exit(1);
  }

  const now = new Date();

  const cacheBuster = Math.floor(now.getTime() / 1000);

  try {
    const data = await remote.get(`aqmap_most_recent_obs.csv?${cacheBuster}`).then((res) => res.data);

    // 29 columns, comma-separated

    // split into lines
    const lines = data.split("\n");

    // the header contains the column names
    const header = lines[0].split(",");

    // now loop over the rows and construct an array of objects
    const rows: AQData[] = lines
      .slice(1)
      .map((line: string) => {
        // Replace commas inside quotes with a space
        const sanitizedLine = line
          .replace(/"([^"]*)"/g, (match) => {
            return match.replace(/,/g, "").replace(/"/g, "");
          })
          .replace(/['"\\;]/g, "");

        const columns = sanitizedLine.split(",");
        const row: Record<string, string> = {};
        header.forEach((key: string, index: any) => {
          row[key] = columns[index];
        });
        return row;
      })
      .reduce((acc: AQData[], row: CSVAQData) => {
        const { monitor, network, lat, lng, date, pm25_recent_r } = row;

        const data: AQData = {
          name: monitor ? monitor.slice(0, 45) : null, // truncate to 45 characters
          type: network,
          lat: isNaN(parseFloat(lat)) ? null : parseFloat(lat),
          lon: isNaN(parseFloat(lng)) ? null : parseFloat(lng),
          validTime: date ? new Date(date.replace(" ", "T") + "Z") : null, // convert to seconds since epoch
          pm25: isNaN(parseFloat(pm25_recent_r)) ? null : parseFloat(pm25_recent_r),
        };

        acc.push(data);

        return acc;
      }, [])
      .filter((row: AQData) => row.lat !== null && row.lon !== null && row.validTime !== null && row.pm25 !== null);

    // insert the data into the database
    await db.insert(aqData).values(rows);

    console.log(`[AQ Data] Inserted ${rows.length} rows into the database.`);

    console.log(`[AQ Data] Cleaning up out of date records...`);

    const holdHours = 4;
    const cleanUpTime = new Date(now.getTime() - holdHours * 60 * 60 * 1000); // 24 hours ago

    const toDelete = (await db.select().from(aqData).where(lt(aqData.validTime, cleanUpTime))).length;

    await db.delete(aqData).where(lt(aqData.validTime, cleanUpTime));

    console.log(`[AQ Data] Deleted ${toDelete} out of date records.`);
    console.log(`[AQ Data] Process complete; exiting.`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}

await main();
