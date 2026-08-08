import { sql } from "drizzle-orm";

import {
  generateMarchedIsolines,
  getExtremaLocations,
  getIsolineThreshold,
  type Tuple2DWithValue,
} from "@plymer/fast-barnes-ts";

import { isolines, mslpExtrema } from "../db/schemas.drizzle.js";
import { lonLatToWebMercator } from "../lib/utils.js";
import { MINUTE } from "../lib/constants.js";
import { pgDb as db } from "../services/database.js";

export async function createIsolines() {
  if (!db) {
    throw new Error("[ISOLINES] Database connection failed.");
  }

  // const DATA_TYPES = ["mslp", "tt", "td"] as const;
  const DATA_TYPES = ["mslp", "tt"] as const;
  const BASE_RESOLUTION = 2048;

  type IsolineConfig = Record<
    (typeof DATA_TYPES)[number],
    { spacing: number; resolution: number | readonly [number, number]; sigma: ReadonlyArray<number> }
  >;

  const CONFIG: IsolineConfig = {
    mslp: {
      spacing: 4,
      resolution: [BASE_RESOLUTION, BASE_RESOLUTION / 1.45],
      sigma: [1.1, 2.2],
    },
    tt: {
      spacing: 5,
      resolution: [BASE_RESOLUTION * 2, (BASE_RESOLUTION * 2) / 1.45],
      sigma: [0.5, 1.0],
    },
    // td: {
    //   spacing: 5,
    //   resolution: [BASE_RESOLUTION * 2, (BASE_RESOLUTION * 2) / 1.45],
    //   sigma: [0.4, 0.6],
    // },
  };

  await Promise.allSettled(
    DATA_TYPES.map(async (dataType) => {
      try {
        const now = new Date().getTime();

        const distinctQuery = sql`
          SELECT DISTINCT ON (site_id)
            metars.${sql.identifier(dataType)} AS value,
            ST_X(ST_Transform("geometry", 4326)) AS lng,
            ST_Y(ST_Transform("geometry", 4326)) AS lat
          FROM metars
          WHERE valid_time >= NOW() - INTERVAL '90 minute'
          ORDER BY site_id, valid_time DESC
        `;

        const queryResult = await db!.execute(distinctQuery);

        const rows = queryResult.rows as Array<{
          value: number | null;
          lng: number;
          lat: number;
        }>;

        const tupleData: Tuple2DWithValue[] = rows
          .filter((row) => row.value !== null)
          .map((row) => [row.lng, row.lat, row.value as number]);

        const { barnesParams, barnesResult, ...marched } = generateMarchedIsolines(tupleData, {
          thresholdStep: CONFIG[dataType].spacing,
          resolution: CONFIG[dataType].resolution as [number, number],
          sigma: CONFIG[dataType].sigma,
        });

        const lineData = marched.polylines
          .map((line, idx) => {
            const coords = line.map(([lng, lat]) => {
              const { x, y } = lonLatToWebMercator(lng, lat);
              return `${x} ${y}`;
            });

            const value = getIsolineThreshold(marched, idx);

            return { value, geometry: `(${coords.join(",")})` };
          })
          .reduce(
            (acc, line) => {
              acc[line.value] = acc[line.value] || [];
              acc[line.value].push(line.geometry);
              return acc;
            },
            {} as Record<number, string[]>,
          );

        // insert the isolines data into the database
        await Promise.all(
          Object.entries(lineData).map(async ([value, geometries]) => {
            await db!.insert(isolines).values({
              expiryTime: new Date(now + 10 * MINUTE),
              startTime: new Date(now),
              value: Number(value),
              lineType: dataType,
              geometry: `MULTILINESTRING(${geometries.join(",")})`,
            });
          }),
        );

        if (dataType === "mslp") {
          const extremaPointData = getExtremaLocations(
            dataType,
            barnesResult,
            barnesParams.x0,
            barnesParams.step,
            { minProminence: 0.0000001 },
            barnesParams.unproject,
          );

          console.log(`[ISOLINES] Found ${extremaPointData.length} extrema points to store.`);

          await Promise.all(
            extremaPointData.map(async (point) => {
              await db!.insert(mslpExtrema).values({
                expiryTime: new Date(now + 10 * MINUTE),
                kind: point.kind,
                startTime: new Date(now),
                value: point.value,
                geometry: point.geometry,
              });
            }),
          );
        }

        console.log(`[ISOLINES] Processing completed and results were stored.`);
      } catch (error) {
        console.error("[ISOLINES] Error during isoline processing:", (error as Error).stack);
        throw error;
      }
    }),
  );
}
