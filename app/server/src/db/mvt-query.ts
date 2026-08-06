/*

create geometry inside the isobars table from lng/lat points (from WGS84 -> web mercator)

INSERT INTO "isobars" ("start_time", "expiry_time", "geometry")
VALUES (
    NOW(),
    NOW() + INTERVAL '1 hour',
    ST_Transform(
        ST_GeomFromText(
            'LINESTRING(
                -123.1207 49.2827,
                -113.4909 53.5461,
                -106.6700 52.1332,
                -97.1384 49.8951,
                -75.6972 45.4215,
                -63.5752 44.6488
            )',
            4326
        ),
        3857
    )
);

Drizzle ORM flow documentation
https://orm.drizzle.team/docs/guides/postgis-geometry-point


use ST_TileEnvelope to get the bbox of the requested tile from the Z/X/Y params
https://postgis.net/docs/ST_TileEnvelope.html

transform the geometries to the tile's coordinate system using ST_AsMVTGeom
https://postgis.net/docs/ST_AsMVTGeom.html

finally, encode the result of the tranformations as MVT using ST_AsMVT
https://postgis.net/docs/ST_AsMVT.html

 */

import { sql } from "drizzle-orm";
import { pgDb as db } from "../services/database.js";

const DATETIME_COLUMNS = new Set<string>(["valid_time", "start_time", "expiry_time"]);
const VECTOR_TILE_EXTENT = 4096;
const VECTOR_TILE_BUFFER = 64;
const MIN_ZOOM = 2;
const MAX_ZOOM = 8;

const TABLES = [
  {
    name: "isolines",
    columns: ["start_time", "expiry_time", "value", "line_type"],
  },
  { name: "mslp_extrema", columns: ["start_time", "expiry_time", "value", "kind"] },
  {
    name: "metars",
    columns: ["valid_time", "site_id"],
  },
  {
    name: "lightning",
    columns: ["start_time", "expiry_time"],
  },
  // { name: "pireps", columns: [valid_time, "rawText"] },
] as const;

/*
function pirepQuery(t: number, z: number) {
  // similar to lightning, we need to cluster PIREPs at low zooms
  // we'll use a similar time binning to generate the clusters at the time slices
  // they are single points, not multipoints so we dont need to ST_DumpPoints

  const clusterCellSizeMeters = getClusterCellSizeMeters(z, CLUSTER_GRID_UNITS);

  if (z > CLUSTER_MAX_ZOOM) {
    return sql`
        pireps_request_time AS (
          SELECT TIMESTAMP 'epoch' + (${t} * INTERVAL '1 millisecond') AS request_time
        ),

        pireps_layer AS (
          SELECT
            ST_AsMVTGeom(
              p.geometry,
              bounds.geom,
              extent => ${VECTOR_TILE_EXTENT},
              buffer => ${VECTOR_TILE_BUFFER}
            ) AS geometry,
            (EXTRACT(EPOCH FROM p.valid_time) * 1000)::bigint AS "start_time",
            (EXTRACT(EPOCH FROM (p.valid_time + INTERVAL '1 hour')) * 1000)::bigint AS "expiry_time",
            to_char(p.valid_time, 'HH24:MI') AS "timeString",
            1::integer AS point_count,
            FALSE AS clustered
          FROM pireps AS p
          CROSS JOIN bounds
          CROSS JOIN pireps_request_time rt
          WHERE p.geometry && bounds.query_geom
            AND p.valid_time >= rt.request_time - '4 hours'::interval
        )
      `;
  }

  return sql`
        pireps_request_time AS (
          SELECT TIMESTAMP 'epoch' + (${t} * INTERVAL '1 millisecond') AS request_time
        ),

        pireps_source AS (
          SELECT
            p.valid_time AS valid_time,
            p.valid_time AS start_time,
            p.valid_time + INTERVAL '1 hour' AS expiry_time,
            p.geometry
          FROM pireps AS p
          CROSS JOIN bounds
          CROSS JOIN pireps_request_time rt
          WHERE p.geometry && bounds.query_geom
            AND p.valid_time >= rt.request_time - '4 hours'::interval
        ),

        pireps_time_bounds AS (
          SELECT
            MIN(start_time) AS min_start,
            MAX(expiry_time) AS max_expiry
          FROM pireps_source
        ),

        pireps_slice_seed AS (
          SELECT
            min_start,
            max_expiry,
            ${sql.raw(`'${CLUSTER_TIMESTEP_MINUTES * 2} minutes'::interval`)} AS step_interval,
            ${sql.raw(`'${CLUSTER_TIMESTEP_MINUTES * 2} minutes'::interval`)} AS grace_interval
          FROM pireps_time_bounds
        ),

        pireps_active_in_slices AS (
          SELECT
            s.geometry,
            s.valid_time,
            gs.slice_start,
            CASE
              WHEN gs.slice_start + seed.step_interval >= seed.max_expiry
                THEN gs.slice_start + seed.step_interval + seed.grace_interval
              ELSE gs.slice_start + seed.step_interval
            END AS slice_visibility_expiry
          FROM pireps_source AS s
          CROSS JOIN pireps_slice_seed AS seed
          CROSS JOIN LATERAL generate_series(
            date_bin(seed.step_interval, s.start_time, TIMESTAMP 'epoch'),
            s.expiry_time,
            seed.step_interval
          ) AS gs(slice_start)
          WHERE s.start_time <= gs.slice_start
            AND s.expiry_time > gs.slice_start
            AND s.valid_time <= gs.slice_start + seed.step_interval
        ),

        pireps_cluster_buckets AS (
          SELECT
            floor((ST_X(geometry) - ${WEB_MERCATOR_MIN}) / ${clusterCellSizeMeters})::integer AS grid_x,
            floor((ST_Y(geometry) - ${WEB_MERCATOR_MIN}) / ${clusterCellSizeMeters})::integer AS grid_y,
            geometry,
            valid_time,
            slice_start,
            slice_visibility_expiry
          FROM pireps_active_in_slices
          WHERE ${z} <= ${CLUSTER_MAX_ZOOM}
        ),

        pireps_grouped AS (
          SELECT
            grid_x,
            grid_y,
            slice_start,
            slice_visibility_expiry,
            ST_PointOnSurface(ST_Collect(geometry)) AS geometry,
            MAX(valid_time) AS valid_time,
            COUNT(*)::integer AS point_count
          FROM pireps_cluster_buckets
          GROUP BY grid_x, grid_y, slice_start, slice_visibility_expiry
        ),

        pireps_from_slices AS (
          SELECT
            geometry,
            valid_time,
            slice_start AS start_time,
            slice_visibility_expiry AS expiry_time,
            point_count,
            point_count > 1 AS clustered
          FROM pireps_grouped
        ),

        pireps_unclustered_all AS (
          SELECT
            geometry,
            valid_time,
            valid_time AS start_time,
            valid_time + INTERVAL '1 hour' AS expiry_time,
            1::integer AS point_count,
            FALSE AS clustered
          FROM pireps_source
        ),

        pireps_features AS (
          SELECT *
          FROM pireps_from_slices
          WHERE ${z} <= ${CLUSTER_MAX_ZOOM}

          UNION ALL

          SELECT *
          FROM pireps_unclustered_all
          WHERE ${z} > ${CLUSTER_MAX_ZOOM}
        ),

        pireps_layer AS (
          SELECT
            ST_AsMVTGeom(
              pireps_features.geometry,
              bounds.geom,
              extent => ${VECTOR_TILE_EXTENT},
              buffer => ${VECTOR_TILE_BUFFER}
            ) AS geometry,
            (EXTRACT(EPOCH FROM pireps_features.start_time) * 1000)::bigint AS "start_time",
            (EXTRACT(EPOCH FROM pireps_features.expiry_time) * 1000)::bigint AS "expiry_time",
            to_char(pireps_features.valid_time, 'HH24:MI') AS "timeString",
            pireps_features.point_count,
            pireps_features.clustered
          FROM pireps_features
          CROSS JOIN bounds
          WHERE pireps_features.geometry && bounds.query_geom
        )
      `;
}
*/

function isolinesQuery(z: number) {
  const dataTypes = ["mslp", "tt", "td"];

  const toleranceMetres = z <= 4 ? 20_000 : z <= 6 ? 8_000 : z <= 8 ? 3_000 : z <= 10 ? 1_000 : 0;

  return sql.join(
    dataTypes.map((dataType) => {
      return sql`
      ${sql.raw(`${dataType}_layer`)} AS (
        SELECT
          ST_AsMVTGeom(
            ST_SimplifyVW(
              isolines.geometry,
              ${toleranceMetres}
            ),
            bounds.geom,
            extent => ${VECTOR_TILE_EXTENT},
            buffer => ${VECTOR_TILE_BUFFER}
          ) AS geometry,
          isolines.value,
          (EXTRACT(EPOCH FROM isolines.start_time) * 1000)::bigint AS start_time,
          (EXTRACT(EPOCH FROM isolines.expiry_time) * 1000)::bigint AS expiry_time
        FROM isolines
        CROSS JOIN bounds
        WHERE
          isolines.line_type = ${dataType}
          AND isolines.geometry && bounds.query_geom
          AND isolines.start_time >= NOW() - INTERVAL '3.5 hours'
      )
    `;
    }),
    sql`, `,
  );
}

function lightningQuery(z: number) {
  return sql`
  
        -- for zooms 2-8 use the pre-clustered strikes we created
        clustered_strikes AS (
          SELECT
            lc.start_time,
            lc.expiry_time,
            (dumped).geom AS geometry
          FROM lightning_clustered AS lc
          CROSS JOIN LATERAL ST_DumpPoints(lc.geometry) AS dumped
          CROSS JOIN bounds
          WHERE ${z} >= ${MIN_ZOOM}
            AND ${z} <= ${MAX_ZOOM}
            AND lc.zoom_level = ${z}
            AND (dumped).geom && bounds.query_geom
            AND lc.start_time >= NOW() - INTERVAL '4 hours'
        ),

        -- for zooms > 8 use the raw, unclustered strike data
        raw_strikes AS (
          SELECT
            l.start_time,
            l.expiry_time,
            (dumped).geom AS geometry
          FROM lightning AS l
          CROSS JOIN LATERAL ST_DumpPoints(l.geometry) AS dumped
          CROSS JOIN bounds
          WHERE ${z} > ${MAX_ZOOM}
            AND (dumped).geom && bounds.query_geom
            AND l.start_time >= NOW() - INTERVAL '4 hours'
        ),
        

        -- combine the clustered and raw strikes into a single set of features for the requested tile
        lightning_features AS (
          SELECT
            ST_PointOnSurface(clustered_strikes.geometry) AS geometry,
            clustered_strikes.start_time,
            clustered_strikes.expiry_time
          FROM clustered_strikes

          UNION ALL

          SELECT 
            raw_strikes.geometry,
            raw_strikes.start_time,
            raw_strikes.expiry_time
          FROM raw_strikes
        ),

        -- finalize the query result by wrapping it as a vector tile geometry
        lightning_layer AS (
          SELECT
            ST_AsMVTGeom(
              lightning_features.geometry,
              bounds.geom,
              extent => ${VECTOR_TILE_EXTENT},
              buffer => ${VECTOR_TILE_BUFFER}
            ) AS geometry,
            (EXTRACT(EPOCH FROM lightning_features.start_time) * 1000)::bigint AS start_time,
            (EXTRACT(EPOCH FROM lightning_features.expiry_time) * 1000)::bigint AS expiry_time
          FROM lightning_features
          CROSS JOIN bounds
          WHERE lightning_features.geometry && bounds.query_geom
        )
      `;
}

function stationPlotQuery(z: number) {
  // use the 'metars_temporal' view to get the latest obs,
  // which uses a LEAD function under the hood to do our window lookup
  // we also apply a zoom-based station filter to limit the number of features at low zoom

  return sql`
      metars_layer AS (
        SELECT
          ST_AsMVTGeom(
            metars_temporal.geometry,
            bounds.geom,
            extent => ${VECTOR_TILE_EXTENT},
            buffer => ${VECTOR_TILE_BUFFER}
          ) AS geometry,
          *,
          (EXTRACT(EPOCH FROM metars_temporal.valid_time) * 1000)::bigint AS start_time,
          (EXTRACT(EPOCH FROM metars_temporal.expiry_time) * 1000)::bigint AS expiry_time
        FROM metars_temporal
        CROSS JOIN bounds
        JOIN stations st
        ON st.site_id = metars_temporal.site_id
        WHERE
        st.min_zoom <= ${z}
        AND metars_temporal.geometry && bounds.query_geom
          -- AND metars_temporal.valid_time <= NOW() - INTERVAL '3 hour'
      )
      `;
}

export async function getTile(t: number, z: number, x: number, y: number) {
  if (!db) {
    throw new Error("[MVT-QUERY] Database connection failed.");
  }

  const layerQueries = TABLES.map((table) => {
    const { name, columns } = table;

    switch (name) {
      case "isolines":
        return isolinesQuery(z);
      // case "pireps":
      //   // special case that requires clustering of PIREPs at low zoom levels
      //   return pirepQuery(t, z);
      case "metars":
        // special case that requires doing a LEAD window function to
        // compute expiry_time on the fly for each observation
        return stationPlotQuery(z);
      case "lightning":
        // special case that requires clustering of lightning strikes at low zoom levels
        return lightningQuery(z);
      default:
        // if any other tables we don't have a special case for
        const layerName = `${name}_layer`;

        const columnSql = sql.join(
          columns.map((col) => {
            // if we're dealing with a datetime column we need to convert it
            // from datetime to epoch milliseconds for the vector tile output
            if (DATETIME_COLUMNS.has(col)) {
              return sql`(EXTRACT(EPOCH FROM ${sql.identifier(name)}.${sql.identifier(col)}) * 1000)::bigint AS ${sql.identifier(col)}`;
            }

            // otherwise just return the column as it is
            return sql`${sql.identifier(name)}.${sql.identifier(col)}`;
          }),
          sql`, `,
        );

        // combine our column queries for the individual layer and ensure we are
        // wrapping the query to return MVT Geometry for conversion later
        return sql`
      ${sql.raw(layerName)} AS (
        SELECT
          ST_AsMVTGeom(
            ${sql.identifier(name)}.geometry,
            bounds.geom,
            extent => ${VECTOR_TILE_EXTENT},
            buffer => ${VECTOR_TILE_BUFFER}
          ) AS geometry,
          ${columnSql}
        FROM ${sql.identifier(name)}
        CROSS JOIN bounds
        WHERE ${sql.identifier(name)}.geometry && bounds.query_geom
      )
    `;
    }
  });

  // ensure that each query returns the result encoded as a vector tile using ST_AsMVT
  // the result is aliased to the name of the table (this is the layer name in the tile data that MapLibre references)
  const tileSelects = [
    ...[{ name: "mslp" }, { name: "tt" }, { name: "td" }],
    ...TABLES.filter(({ name }) => name !== "isolines"),
  ].map(({ name }) => {
    const layerName = `${name}_layer`;

    return sql`
      (
        SELECT ST_AsMVT(
          ${sql.raw(`${layerName}.*`)},
          ${name}
        )
        FROM ${sql.raw(layerName)}
      )
    `;
  });

  // join each of the layer queries together into a single query, and then select it as a single tile
  const fullQuery = sql`
    -- set our bbox for the requested tile plus a buffer to get partially-overlapping geometries
    WITH bounds AS (
      SELECT
        ST_TileEnvelope(${z}, ${x}, ${y}) AS geom,
        ST_TileEnvelope(
          ${z},
          ${x},
          ${y},
          margin => (${VECTOR_TILE_BUFFER}::double precision / ${VECTOR_TILE_EXTENT}::double precision)
        ) AS query_geom
    ),

    -- get the actual data
    ${sql.join(layerQueries, sql`,`)}

    -- output the data as a single vector tile
    SELECT
      ${sql.join(tileSelects, sql` || `)}
      AS tile;
  `;

  const result = await db.execute(fullQuery);

  return result.rows[0]?.tile as Buffer | undefined;
}
