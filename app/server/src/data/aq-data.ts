import "dotenv/config";
import { lt } from "drizzle-orm";
import { aqData } from "../db/schemas.drizzle.js";
import type { AQData, DataProcessResult } from "../lib/types.js";
import { aqSchema } from "../lib/validation.js";
import { HOUR } from "../lib/constants.js";
import { pgDb as db } from "../services/database.js";
import { etagCheckin } from "../lib/etag.js";

export async function getAqData(): Promise<DataProcessResult> {
  if (!db) {
    throw new Error("[AQ-DATA] Failed to connect to the database.");
  }

  try {
    const now = new Date();

    const cacheBuster = Math.floor(now.getTime() / 1000);

    const url = `https://cyclone.unbc.ca/aqmap/data/aqmap_most_recent_obs.csv?${cacheBuster}`;

    if (!(await etagCheckin(url, "aqData"))) {
      console.log("[AQ-DATA] Air quality data is up to date, skipping fetch.");
      return { result: "skipped" };
    }

    const data = await fetch(url).then((res) => res.text());

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
      .reduce<AQData[]>((acc, row) => {
        const parsed = aqSchema.safeParse(row);

        if (!parsed.success) {
          console.error(parsed.error);
          return acc; // Skip this row if validation fails
        }

        const { monitor, network, lat, lng, date, pm25_recent_r } = parsed.data;

        // if any of these columns are null, skip this row
        if (!monitor || !network || !lat || !lng || !date || !pm25_recent_r) return acc;

        const geometry = `POINT(${lng} ${lat})`;

        const data: AQData = {
          name: monitor,
          type: network,
          geometry,
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
        await db!
          .insert(aqData)
          .values(data)
          .onConflictDoUpdate({
            target: [aqData.name, aqData.validTime],
            set: {
              pm25: data.pm25,
            },
          });
      }),
    );

    await db.delete(aqData).where(lt(aqData.validTime, new Date(now.getTime() - 4 * HOUR)));
    return { result: "success" };
  } catch (error) {
    console.error(`[AQ-DATA] Error processing air quality data: ${(error as Error).message}`);
    return { result: "error" };
  }
}
