import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";
import { type InferInsertModel, sql } from "drizzle-orm";
import { pgDb } from "../services/database.js";
import { volcanoCodes } from "../db/schemas.drizzle.js";
import type { DataProcessResult } from "../lib/types.js";
import { lonLatToWebMercator } from "../lib/utils.js";

type VolcanoColorCodes = "UNASSIGNED" | "GREEN" | "YELLOW" | "ORANGE" | "RED";
type VolcanoAlertCodes = "UNASSIGNED" | "NORMAL" | "ADVISORY" | "WATCH" | "WARNING";

type DomesticVolcano = {
  id: string;
  img: string;
  desc: string;
  name: string;
  color: VolcanoColorCodes;
  alert: VolcanoAlertCodes;
  lat: string;
  lng: string;
  ft: number;
  m: null;
  webicorders: string[];
  curact?: string;
};

type InternationalVolcano = {
  id: string;
  name: string;
  lat: string;
  lng: string;
  color: VolcanoColorCodes;
  url?: string;
};

type VolcanoJsonResponse = {
  unmonitored: DomesticVolcano[];
  monitored: DomesticVolcano[];
  kuriles: InternationalVolcano[];
  russian: InternationalVolcano[];
};

type VolcanoData = InferInsertModel<typeof volcanoCodes>;

export async function getVolcanoStatus(): Promise<DataProcessResult> {
  if (!pgDb) return { result: "error" };

  const vaacJsonUrl = "https://www.weather.gov/source/vaac/vaac.json";

  try {
    const response = (await fetch(vaacJsonUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
      res.json(),
    )) as VolcanoJsonResponse;

    const data: VolcanoData[] = [];

    Object.entries(response).forEach(([_, volcanoes]) => {
      volcanoes
        .filter((v) => v.name !== null)
        .forEach((v) => {
          if (Object.hasOwn(v, "ft")) {
            const volc = v as DomesticVolcano;
            const { lng, lat, name, alert, color } = volc;
            const { x, y } = lonLatToWebMercator(parseFloat(lng), parseFloat(lat));

            data.push({
              name: name,
              alertLevel: alert.toLowerCase() as Lowercase<VolcanoAlertCodes>,
              geometry: `POINT(${x} ${y})`,
              colour: color.toLowerCase() as Lowercase<VolcanoColorCodes>,
            });
          } else {
            const volc = v as InternationalVolcano;
            const { lng, lat, name, color } = volc;
            const { x, y } = lonLatToWebMercator(parseFloat(lng), parseFloat(lat));
            data.push({
              name: name,
              alertLevel: undefined,
              geometry: `POINT(${x} ${y})`,
              colour: color.toLowerCase() as Lowercase<VolcanoColorCodes>,
            });
          }
        });
    });

    // dedupe volcanoes
    const uniqueData = [...new Map(data.map((row) => [row.name, row])).values()];

    await pgDb
      .insert(volcanoCodes)
      .values(uniqueData)
      .onConflictDoUpdate({
        target: volcanoCodes.name,
        set: { alertLevel: sql`excluded.alert_level`, colour: sql`excluded.colour` },
      });

    return { result: "success" };
  } catch (error) {
    console.error(`Error updating volcano data: ${(error as Error).message}`);
    return { result: "error" };
  }
}
