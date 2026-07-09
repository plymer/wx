import { sql } from "drizzle-orm";

import {
  generateMarchedIsolines,
  getExtremaLocations,
  findGridExtrema2D,
  type Tuple2DWithValue,
  getIsolineThreshold,
} from "@plymer/fast-barnes-ts";

import type { DbShape } from "../services/database.js";
import { isobars } from "../db/schemas.drizzle.js";
import { lonLatToWebMercator } from "../lib/utils.js";

export async function createIsolines<TSchema extends Record<string, unknown>>(db: Awaited<DbShape<TSchema>>) {
  if (!db) {
    throw new Error("[SIGMET] Database connection failed.");
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

    const CONFIG: Record<
      (typeof DATA_TYPES)[number],
      { spacing: number; resolution: number | readonly [number, number]; sigma: ReadonlyArray<number> }
    > = {
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
      const coords = line.map(([lon, lat]) => {
        const { x, y } = lonLatToWebMercator(lon, lat);
        return `${x} ${y}`;
      });

      const value = getIsolineThreshold(marched, idx);

      return { value, geometry: `LINESTRING(${coords.join(",")})` };
    });

    // insert the isolines data into the database
    await Promise.all(
      lineData.map(async (line) => {
        await db.insert(isobars).values({
          expiryTime: new Date(now + 90 * 60 * 1000), // 90 minutes from now
          startTime: new Date(now),
          value: line.value,
          geometry: line.geometry,
        });
      }),
    );

    const extrema = findGridExtrema2D(barnesResult, barnesParams.x0, barnesParams.step);

    const _extremaPointData = getExtremaLocations("mslp", extrema, barnesParams.unproject);

    console.log(`[ISOLINES] Processing completed and results were cached.`);
  } catch (error) {
    console.error("[ISOLINES] Error during isoline processing:", (error as Error).stack);
    throw error;
  }
}
