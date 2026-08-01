import { sql } from "drizzle-orm";

import {
  generateMarchedIsolines,
  getExtremaLocations,
  findGridExtrema2D,
  type Tuple2DWithValue,
  getIsolineThreshold,
} from "@plymer/fast-barnes-ts";

import { isobars, extrema as extremaTable } from "../db/schemas.drizzle.js";
import { lonLatToWebMercator } from "../lib/utils.js";
import { MINUTE } from "../lib/constants.js";
import { pgDb as db } from "../services/database.js";

export async function createIsolines() {
  if (!db) {
    throw new Error("[ISOLINES] Database connection failed.");
  }

  try {
    const now = new Date().getTime();

    const distinctQuery = sql`
      SELECT DISTINCT ON ("siteId")
        metars.${sql.identifier("mslp")} AS "value",
        ST_X(ST_Transform("geometry", 4326)) AS "lon",
        ST_Y(ST_Transform("geometry", 4326)) AS "lat"
      FROM "metars"
      WHERE "validTime" >= NOW() - INTERVAL '90 minute'
      ORDER BY "siteId", "validTime" DESC
    `;

    const queryResult = await db.execute(distinctQuery);

    const rows = queryResult.rows as Array<{
      value: number | null;
      lon: number;
      lat: number;
    }>;

    const tupleData: Tuple2DWithValue[] = rows
      .filter((row) => row.value !== null)
      .map((row) => [row.lon, row.lat, row.value as number]);

    const baseResolution = 2048;

    const DATA_TYPES = ["mslp", "tt", "td"] as const;

    type IsolineConfig = Record<
      (typeof DATA_TYPES)[number],
      { spacing: number; resolution: number | readonly [number, number]; sigma: ReadonlyArray<number> }
    >;

    const CONFIG: IsolineConfig = {
      mslp: {
        spacing: 4,
        resolution: [baseResolution, baseResolution / 1.45],
        sigma: [1.1, 2.2],
      },
      tt: {
        spacing: 5,
        resolution: [baseResolution * 2, (baseResolution * 2) / 1.45],
        sigma: [0.5, 1.0],
      },
      td: {
        spacing: 5,
        resolution: [baseResolution * 2, (baseResolution * 2) / 1.45],
        sigma: [0.4, 0.6],
      },
    };

    const { barnesParams, barnesResult, ...marched } = generateMarchedIsolines(tupleData, {
      thresholdStep: CONFIG.mslp.spacing,
      resolution: CONFIG.mslp.resolution as [number, number],
      sigma: CONFIG.mslp.sigma,
    });

    const lineData = marched.polylines.map((line, idx) => {
      const coords = line.map(([lng, lat]) => {
        const { x, y } = lonLatToWebMercator(lng, lat);
        return `${x} ${y}`;
      });

      const value = getIsolineThreshold(marched, idx);

      return { value, geometry: `LINESTRING(${coords.join(",")})` };
    });

    // insert the isolines data into the database
    await Promise.all(
      lineData.map(async (line) => {
        await db!.insert(isobars).values({
          expiryTime: new Date(now + 10 * MINUTE),
          startTime: new Date(now),
          value: line.value,
          geometry: line.geometry,
        });
      }),
    );

    const extrema = findGridExtrema2D(barnesResult, barnesParams.x0, barnesParams.step);

    const extremaPointData = getExtremaLocations("mslp", extrema, barnesParams.unproject);

    await Promise.all(
      extremaPointData.map(async (point) => {
        const { x, y } = lonLatToWebMercator(point.lng, point.lat);
        const geometry = `POINT(${x} ${y})`;

        await db!.insert(extremaTable).values({
          expiryTime: new Date(now + 10 * MINUTE),
          startTime: new Date(now),
          value: point.value,
          geometry,
        });
      }),
    );

    console.log(`[ISOLINES] Processing completed and results were cached.`);
  } catch (error) {
    console.error("[ISOLINES] Error during isoline processing:", (error as Error).stack);
    throw error;
  }
}
