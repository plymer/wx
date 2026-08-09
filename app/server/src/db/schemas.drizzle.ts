import { sql } from "drizzle-orm";
import {
  customType,
  varchar,
  timestamp,
  text,
  index,
  bigserial,
  integer,
  doublePrecision,
  primaryKey,
  snakeCase,
  smallint,
} from "drizzle-orm/pg-core";

type GeometryType = "point" | "MultiPoint" | "LineString" | "MultiLineString" | "polygon" | "MultiPolygon";

const INITIAL_SHAPES = ["polygon", "line", "point"] as const;
const HAZARD_TRENDS = ["NC", "INTSF", "WKN"] as const;

const geometry = customType<{
  data: string;
  driverData: string;
  config: {
    type: GeometryType;
    srid?: number;
  };
}>({
  dataType(config) {
    return `geometry(${config?.type ?? "point"}, ${config?.srid ?? 4326})`;
  },

  toDriver(value) {
    return value;
  },

  fromDriver(value) {
    return value;
  },
});

export const metars = snakeCase.table(
  "metars",
  {
    geometry: geometry({ srid: 3857, type: "point" }), // web mercator coordinates
    siteId: varchar({ length: 4 }).notNull(),
    stationPriority: integer().default(0),
    windDir: integer(),
    windSpd: integer(),
    windGst: integer(),
    stationType: text(),
    obType: text(),
    ceiling: integer(),
    rawText: text(),
    vis: text(),
    wxString: text(),
    tt: doublePrecision(),
    td: doublePrecision(),
    mslp: doublePrecision(),
    category: varchar({ length: 4 }),
    timeString: text(),
    createdAt: timestamp({ mode: "date" }).notNull(),
    validTime: timestamp({ mode: "date" }).notNull(),
  },
  (t) => [index("metar_spatial_index").using("gist", t.geometry), primaryKey({ columns: [t.siteId, t.validTime] })],
);

// gas -- 1-23 or eom bill 25th --> sep 1st
// electric -- 1, 10-28

export const tafs = snakeCase.table(
  "tafs",
  {
    siteId: text().notNull(),
    validTime: timestamp({ mode: "date" }).notNull(),
    rawText: text(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const stations = snakeCase.table(
  "stations",
  {
    name: text(),
    siteId: varchar({ length: 4 }).primaryKey(),
    lat: doublePrecision().notNull(),
    lon: doublePrecision().notNull(),
    elevF: doublePrecision(),
    elevM: doublePrecision(),
    country: text(),
    state: text(),
    minZoom: doublePrecision().default(10).notNull(),
  },
  (t) => [index("station_min_zoom_index").using("btree", t.minZoom)],
);

export const isolines = snakeCase.table(
  "isolines",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    value: integer().notNull(),
    lineType: text({ enum: ["mslp", "tt", "td"] }).notNull(),
    startTime: timestamp({ mode: "date" }).notNull(),
    expiryTime: timestamp({ mode: "date" }).notNull(),
    geometry: geometry({ srid: 3857, type: "MultiLineString" }).notNull(),
  },
  (t) => [
    index("isolines_spatial_index").using("gist", t.geometry),
    index("isolines_start_time_index").using("btree", t.startTime),
    index("isolines_line_type_index").using("btree", t.lineType),
  ],
);

export const mslpExtrema = snakeCase.table("mslp_extrema", {
  id: bigserial({ mode: "number" }).primaryKey(),
  value: doublePrecision().notNull(),
  kind: text({ enum: ["max", "min"] }).notNull(),
  startTime: timestamp({ mode: "date" }).notNull(),
  expiryTime: timestamp({ mode: "date" }).notNull(),
  geometry: geometry({ srid: 3857, type: "point" }).notNull(),
});

export const lightning = snakeCase.table(
  "lightning",
  {
    startTime: timestamp({ mode: "date" }).primaryKey(),
    expiryTime: timestamp({ mode: "date" }).notNull(),
    geometry: geometry({ srid: 3857, type: "MultiPoint" }).notNull(),
  },
  (t) => [index("lightning_spatial_index").using("gist", t.geometry)],
);

export const lightningClustered = snakeCase.table(
  "lightning_clustered",
  {
    startTime: timestamp({ mode: "date" }).notNull(),
    expiryTime: timestamp({ mode: "date" }).notNull(),
    geometry: geometry({ srid: 3857, type: "MultiPoint" }).notNull(),
    zoomLevel: smallint().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.startTime, t.zoomLevel] }),
    index("lightning_clustered_spatial_index").using("gist", t.geometry),
    index("lightning_clustered_zoom_index").using("btree", t.zoomLevel),
  ],
);

export const aqData = snakeCase.table(
  "aq_data",
  {
    geometry: geometry({ srid: 3857, type: "point" }).notNull(),
    name: text(),
    type: text(),
    lat: doublePrecision(),
    lon: doublePrecision(),
    validTime: timestamp({ mode: "date" }),
    pm25: doublePrecision(),
  },
  (table) => [
    primaryKey({ columns: [table.name, table.validTime] }),
    index("aq_data_spatial_index").using("gist", table.geometry),
  ],
);

export const sigmets = snakeCase.table(
  "sigmets",
  {
    issueTime: timestamp({ mode: "date" }).notNull(),
    endTime: timestamp({ mode: "date" }).notNull(),
    charCode: text().default("-").notNull(),
    numberCode: integer().default(0).notNull(),
    initialShape: text({ enum: INITIAL_SHAPES }),
    speed: integer(),
    initialCoords: text(),
    finalCoords: text(),
    rawText: text().notNull(),
    domain: text(),
    issuer: text(),
    firRegion: text(),
    header: text().default("TEMP").notNull(),
    hazard: text(),
    hazardName: text(),
    hazardTrend: text({ enum: HAZARD_TRENDS }),
    hazardBottom: text(),
    hazardTop: text(),
    direction: doublePrecision(),
  },
  (table) => [primaryKey({ columns: [table.header, table.issueTime, table.charCode, table.numberCode] })],
);

// export const pireps = snakeCase.table(
//   "pireps",
//   {
//     geometry: geometry({ srid: 3857, type: "POINT" }).notNull(),
//     id: bigserial({ mode: "number" }).primaryKey(),
//     issuingOffice: text(),
//     reportType: text(),
//     validTime: timestamp({ mode: "date" }).notNull(),
//     issueTime: timestamp({ mode: "date" }).notNull(),
//     lat: doublePrecision().notNull(),
//     lon: doublePrecision().notNull(),
//     rawText: text().notNull(),
//     ws: boolean(),
//     sky: text(),
//     aircraftType: text(),
//     fir: text(),
//     flightLevel: integer(),
//     icing: text(),
//     turbulence: text(),
//     wakeTurbClass: text(),
//   },
//   (t) => [
//     index("pireps_spatial_index").using("gist", t.geometry),
//     index("pireps_valid_time_index").using("btree", t.validTime),
//   ],
// );

export const metarsTemporalView = snakeCase.view("metars_temporal").as((qb) =>
  qb
    .select({
      geometry: sql`${metars.geometry}`.as("geometry"),
      siteId: sql`${metars.siteId}`.as("site_id"),
      stationPriority: sql`${metars.stationPriority}`.as("station_priority"),
      windDir: sql`${metars.windDir}`.as("wind_dir"),
      windSpd: sql`${metars.windSpd}`.as("wind_spd"),
      windGst: sql`${metars.windGst}`.as("wind_gst"),
      stationType: sql`${metars.stationType}`.as("station_type"),
      obType: sql`${metars.obType}`.as("ob_type"),
      ceiling: sql`${metars.ceiling}`.as("ceiling"),
      rawText: sql`${metars.rawText}`.as("raw_text"),
      vis: sql`${metars.vis}`.as("vis"),
      wxString: sql`${metars.wxString}`.as("wx_string"),
      tt: sql`${metars.tt}`.as("tt"),
      td: sql`${metars.td}`.as("td"),
      mslp: sql`${metars.mslp}`.as("mslp"),
      category: sql`${metars.category}`.as("category"),
      timeString: sql`${metars.timeString}`.as("time_string"),
      createdAt: sql`${metars.createdAt}`.as("created_at"),
      validTime: sql`${metars.validTime}`.as("valid_time"),
      startTime: sql<Date>`${metars.validTime}`.as("start_time"),
      expiryTime: sql<Date>`
        lead(
          ${metars.validTime},
          1,
          ${metars.validTime} + interval '90 minutes'
        )
        over (
          partition by ${metars.siteId}
          order by ${metars.validTime}
        )`.as("expiry_time"),
    })
    .from(metars)
    .where(sql`${metars.validTime} >= NOW() - INTERVAL '4 hours'`),
);
