import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";
import type { LightningFC } from "../lib/lightning.types.js";
import { lt, sql, desc } from "drizzle-orm";
import { lightning, lightningClustered } from "../db/schemas.drizzle.js";
import { pgDb as db } from "../services/database.js";
import { lonLatToWebMercator } from "../lib/utils.js";

const formatDateToUrlDate = (date: Date) => {
  return date
    .toISOString()
    .replace(/.\d+Z$/g, "")
    .replace("T", "_")
    .replace(/:/g, "");
};

export async function getLightning() {
  if (!db) {
    throw new Error("[LIGHTNING] Database connection failed.");
  }

  // we want to check the 'current time' of the roundedMinutes (closest 6-minute bin) and then the previous 6-minute bin to catch any 'strays' or update with a new 'slice' after a new timestamp is generated
  // its a strange way that they serve the data, but it is what it is
  // current bin catched everything from the requested time until the next bin is generated (ex. 18:36Z bin catches everything from 18:30Z until 18:42Z)
  // after which the new bin is created and starts accumulating, while the 'old' bin gets trimmed (ex. new bin 18:36Z until 18:48Z, old bin now 18:30Z until 18:36Z)
  // this means we have to 'recompute' the previous bin's strikes

  const latestTime = new Date().getUTCMinutes();
  const roundedMinutes = Math.floor(latestTime / 6) * 6;

  const currentBin = new Date();
  currentBin.setUTCMinutes(roundedMinutes);
  currentBin.setUTCSeconds(0);
  currentBin.setUTCMilliseconds(0);

  const previousBin = new Date(currentBin);
  previousBin.setUTCMinutes(roundedMinutes - 6);

  const bins = [formatDateToUrlDate(currentBin), formatDateToUrlDate(previousBin)];

  try {
    const responses = (
      await Promise.all(
        bins.map(async (ts) =>
          fetch(`https://weather.gc.ca/api/app/v2/Lightning/1/${ts}`, { headers: DEFAULT_REMOTE_HEADERS })
            .then((res) => res.json() as Promise<LightningFC>)
            .catch((err) => {
              console.error(
                `[LIGHTNING] Error when fetching data from ${`https://weather.gc.ca/api/app/v2/Lightning/1/${ts}`}:`,
                err.message,
              );
              return null;
            }),
        ),
      )
    ).filter((res): res is LightningFC => res !== null);

    await Promise.allSettled(
      responses.map(async (res) => {
        if (!res) return null;

        const { dateFrom, dateTo, features } = res;

        const from = new Date(dateFrom);
        const to = new Date(dateTo);

        const strikeCoords = features
          .map((f) => {
            if (f.geometry.type !== "Point") {
              throw new Error("[LIGHTNING] Error: Lightning feature not type 'Point'");
            }
            const [lon, lat] = f.geometry.coordinates;
            const { x, y } = lonLatToWebMercator(lon, lat);
            return `${x} ${y}`;
          })
          .join(",");

        const strikeCoordsGeom = strikeCoords.length > 0 ? `MULTIPOINT(${strikeCoords})` : "MULTIPOINT EMPTY";

        await db!
          .insert(lightning)
          .values({ startTime: from, expiryTime: to, geometry: strikeCoordsGeom })
          .onConflictDoUpdate({
            target: lightning.startTime,
            set: { startTime: from, expiryTime: to, geometry: strikeCoordsGeom },
          });
      }),
    );

    // now cluster our lightning data for faster queries

    const minZoom = 2;
    const maxZoom = 8;
    const webMercatorWidth = 40075016.68557849; // width of the world in web mercator coordinates
    const tileSize = 512;
    const clusterPixels = 32;

    function getClusterSizeMetres(z: number) {
      const mPx = webMercatorWidth / (tileSize * Math.pow(2, z));
      return mPx * clusterPixels;
    }

    const latestTimes = await db
      .select({ startTime: lightning.startTime, expiryTime: lightning.expiryTime })
      .from(lightning)
      .orderBy(desc(lightning.startTime))
      .limit(2);

    for (const t of latestTimes) {
      let sourceTable = sql.identifier("lightning");
      let sourceWhere = sql`WHERE start_time = (${t.startTime}::timestamptz AT TIME ZONE 'UTC')`;

      // oxlint-disable-next-line
      for (let z = maxZoom; z >= minZoom; z--) {
        const cellSize = getClusterSizeMetres(z);

        await db.execute(sql`
          WITH raw_pts AS (
            SELECT
            (dp).geom::geometry(Point,3857) as geom,
            ST_SnapToGrid((dp).geom::geometry(Point,3857), ${cellSize}) as cell
          FROM ${sourceTable}
          CROSS JOIN LATERAL ST_DumpPoints(geometry) dp
          ${sourceWhere}
        ),
        bucketed AS (
          SELECT DISTINCT ON (cell)
            geom
          FROM raw_pts
          ORDER BY cell
        ),
        assembled AS (
          SELECT
            COALESCE(
              ST_Multi(ST_Collect(geom))::geometry(MultiPoint,3857),
              'MULTIPOINT EMPTY'::geometry(MultiPoint,3857)
            ) as geometry
          FROM bucketed
        ),
        deleted AS (
          DELETE FROM lightning_clustered
          WHERE start_time = (${t.startTime}::timestamptz AT TIME ZONE 'UTC') AND zoom_level = ${z}
          RETURNING 1
        )
        INSERT INTO lightning_clustered
          (start_time, expiry_time, zoom_level, geometry)
        SELECT
          (${t.startTime}::timestamptz AT TIME ZONE 'UTC'),
          (${t.expiryTime}::timestamptz AT TIME ZONE 'UTC'),
          ${z},
          geometry
        FROM assembled
        ON CONFLICT (start_time, zoom_level)
        DO UPDATE SET geometry = EXCLUDED.geometry
        `);

        // next iteration uses the previous zoom's output
        sourceTable = sql.identifier("lightning_clustered");
        sourceWhere = sql`
          WHERE start_time = (${t.startTime}::timestamptz AT TIME ZONE 'UTC')
            AND zoom_level = ${z}
        `;
      }
    }

    await db.delete(lightning).where(lt(lightning.startTime, new Date(new Date().getTime() - 4 * HOUR)));
    await db
      .delete(lightningClustered)
      .where(lt(lightningClustered.startTime, new Date(new Date().getTime() - 4 * HOUR)));
  } catch (error) {
    if (error instanceof Error) {
      const causeMessage = (error as { cause?: { message?: string } }).cause?.message;
      throw new Error(`[LIGHTNING] Error: ${error.message}${causeMessage ? ` | cause: ${causeMessage}` : ""}`, {
        cause: error,
      });
    }

    throw new Error(`[LIGHTNING] Error: Unknown failure`, { cause: error });
  }
}
