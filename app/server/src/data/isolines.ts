import { and, gt, eq, Relations, between } from "drizzle-orm";
import { generateDbConnection } from "../lib/utils.js";
import { metars, stations } from "../db/tables/data.drizzle.js";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { HOUR, MINUTE } from "../lib/constants.js";
import { tupleArrayToGeoJSON, type Tuple2DWithValue } from "@plymer/fast-barnes-ts";
import type { FeatureCollection, LineString, MultiPolygon, Point } from "geojson";
import { redisClient } from "../lib/redis.js";
// import * as schemas from "../db/tables/data.drizzle.js";
// import * as relations from "../db/relations/data.relations.drizzle.js";

const bbox = [-180, 15, 50, 85]; // [west, south, east, north]

export async function createIsolines<TSchema extends Record<string, SQLiteTableWithColumns<any> | Relations<any, any>>>(
  db: Awaited<ReturnType<typeof generateDbConnection<TSchema>>>,
) {
  if (!db) {
    throw new Error("[ISOLINES] Database connection failed.");
  }

  const cacheClient = await redisClient("isolines");

  const now = new Date().getTime();

  const queryResult = await db
    .select({
      siteId: metars.siteId,
      validTime: metars.validTime,
      mslp: metars.mslp,
      tt: metars.tt,
      td: metars.td,
      lat: stations.lat,
      lon: stations.lon,
    })
    .from(metars)
    .leftJoin(stations, eq(stations.siteId, metars.siteId))
    .where(
      and(
        gt(metars.validTime, new Date(now - 4 * HOUR)),
        between(stations.lon, bbox[0], bbox[2]),
        between(stations.lat, bbox[1], bbox[3]),
      ),
    );

  const collatedData: Record<
    string,
    {
      lat: number;
      lon: number;
      values: { mslp: number | null; tt: number | null; td: number | null; validTime: Date }[];
    }
  > = {};

  const BLACKLISTED_SITES = ["PACX", "PFTO"];

  queryResult.forEach((metar) => {
    const { mslp, tt, td, validTime, lat, lon, siteId } = metar;

    if (!lat || !lon || BLACKLISTED_SITES.includes(siteId)) {
      return;
    }

    if (collatedData[metar.siteId]) {
      collatedData[metar.siteId].values.push({ mslp, tt, td, validTime });
    } else {
      collatedData[metar.siteId] = { lat, lon, values: [{ mslp, tt, td, validTime }] };
    }
  });

  const baseResolution = 2048;

  const DATA_TYPES = ["mslp", "tt", "td"] as const;

  const CONFIG: Record<
    (typeof DATA_TYPES)[number],
    { spacing: number; resolution: number | readonly [number, number]; sigma: ReadonlyArray<number>; smooth: boolean }
  > = {
    mslp: {
      spacing: 4,
      resolution: [baseResolution, baseResolution / 1.45],
      sigma: [1.1, 2.2],
      smooth: true,
    },
    tt: {
      spacing: 5,
      resolution: [baseResolution * 2, (baseResolution * 2) / 1.45],
      sigma: [0.5, 1.0],
      smooth: true,
    },
    td: { spacing: 5, resolution: [baseResolution * 2, (baseResolution * 2) / 1.45], sigma: [0.4, 0.6], smooth: true },
  };

  for (const type of DATA_TYPES) {
    // for the time being, we are going to skip generating isolines for tt/td because the performance isn't super great on the client and I might want to adjust how we handle it there
    if (type === "tt" || type === "td") {
      console.info(`[ISOLINES] Skipping isoline generation for '${type}'.`);
      continue;
    }

    const fcArray: FeatureCollection<
      Point | LineString | MultiPolygon,
      { value: number } | { kind: "max" | "min"; value: number }
    >[] = [];
    console.log(
      `[ISOLINES] Processing isolines for type '${type}' with ${Object.keys(collatedData).length} data points.`,
    );

    const tupleData = Object.values(collatedData).reduce<Tuple2DWithValue[]>((acc, data) => {
      const { lat, lon, values } = data;
      const computedTime = now - 10 * MINUTE;

      const dataForTime = values
        .sort((a, b) => {
          const aDiff = computedTime - new Date(a.validTime).getTime();
          const bDiff = computedTime - new Date(b.validTime).getTime();
          return aDiff - bDiff;
        })
        .find(
          (m) =>
            new Date(m.validTime).getTime() <= computedTime &&
            new Date(m.validTime).getTime() >= computedTime - 4 * HOUR,
        );

      if (dataForTime) {
        if (!dataForTime[type]) return acc;

        acc.push([lon, lat, dataForTime[type]]);
      }

      return acc;
    }, []);

    // convert the tuple data to GeoJSON features with the mslp value as a property

    const features = tupleArrayToGeoJSON(tupleData, "isolines", {
      contourOptions: { spacing: CONFIG[type].spacing, smooth: CONFIG[type].smooth },
      resolution: CONFIG[type].resolution,
      sigma: CONFIG[type].sigma,
      barnesOptions: { maxDist: 3.717, numIter: 18 },
      coordinateMode: "spherical",
      sphericalOptions: { standardParallels: [42.5, 65.5] },
      extrema: type === "mslp" ? { minProminence: 0.00001, minSeparation: 36 } : false,
    })
      .features.filter((f) => {
        if ("kind" in f.properties) {
          if (f.properties.kind !== "max" && f.properties.kind !== "min") {
            return false;
          } else {
            return true;
          }
        } else if ("value" in f.properties && !("kind" in f.properties)) {
          return true;
        }
      })
      .map((f) => {
        if ("kind" in f.properties) {
          return {
            ...f,
            properties: {
              ...f.properties,
              value: f.properties.kind === "max" ? Math.ceil(f.properties.value) : Math.floor(f.properties.value),
            },
          };
        } else return f;
      });

    fcArray.push({ type: "FeatureCollection", features });

    await cacheClient.rPush(`wxmap:isolines:${type}`, JSON.stringify(fcArray));
    await cacheClient.lTrim(`wxmap:isolines:${type}`, -19, -1);

    console.log(`[ISOLINES] Completed isoline processing for type '${type}'.`);
  }

  console.log(`[ISOLINES] Processing completed and results were cached.`);
}
