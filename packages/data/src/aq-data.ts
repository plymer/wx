import axios from "axios";
import "dotenv/config";
import { lt } from "drizzle-orm";
import { generateDbConnection } from "@wx/shared/lib/utils.js";
import { aqData } from "@wx/shared/db/tables/aq.drizzle.js";
import { CSVAQData, AQData } from "@wx/shared/lib/types.js";
import { aqSchema } from "@wx/shared/lib/validation.js";
import { HOUR } from "@wx/shared/lib/constants.js";

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
        const parsed = aqSchema.safeParse(row);

        if (!parsed.success) {
          console.error(parsed.error);
          return acc; // Skip this row if validation fails
        }

        const { monitor, network, lat, lng, date, pm25_recent_r } = parsed.data;

        // if any of these columns are null, skip this row
        if (!monitor || !network || !lat || !lng || !date || !pm25_recent_r) return acc;

        const data: AQData = {
          name: monitor,
          type: network,
          lat,
          lon: lng,
          validTime: date,
          pm25: pm25_recent_r,
        };

        acc.push(data);

        return acc;
      }, [])
      .filter((row: AQData) => row.lat !== null && row.lon !== null && row.validTime !== null && row.pm25 !== null);

    // prevent having duplicate entries in the database by checking for duplicate PKs
    await Promise.allSettled(
      rows.map(async (data) => {
        await db
          .insert(aqData)
          .values(data)
          .onDuplicateKeyUpdate({
            set: {
              pm25: data.pm25,
            },
          });
      }),
    );

    console.log(`[AQ Data] Inserted ${rows.length} rows into the database.`);

    console.log(`[AQ Data] Cleaning up out of date records...`);

    const holdHours = 4;
    const cleanUpTime = new Date(now.getTime() - holdHours * HOUR);

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
