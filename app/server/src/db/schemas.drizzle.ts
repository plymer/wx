import { getColumns, sql } from "drizzle-orm";
import {
  customType,
  pgTable,
  pgView,
  varchar,
  timestamp,
  text,
  index,
  bigserial,
  integer,
  doublePrecision,
  primaryKey,
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

export const metars = pgTable(
  "metars",
  {
    geometry: geometry({ srid: 3857, type: "point" }), // web mercator coordinates
    siteId: varchar({ length: 4 }).notNull(),
    stationPriority: integer(),
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
  (t) => [
    index("metar_spatial_index").using("gist", t.geometry),
    primaryKey({ name: "metars_pk", columns: [t.siteId, t.validTime] }),
  ],
);

export const tafs = pgTable(
  "tafs",
  {
    siteId: text().notNull(),
    validTime: timestamp({ mode: "date" }).notNull(),
    rawText: text(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const stations = pgTable("stations", {
  name: text(),
  siteId: varchar({ length: 4 }).primaryKey(),
  lat: doublePrecision().notNull(),
  lon: doublePrecision().notNull(),
  elev_f: doublePrecision(),
  elev_m: doublePrecision(),
  country: text(),
  state: text(),
});

export const stationVisibility = pgTable(
  "stationVisibility",
  {
    siteId: varchar({ length: 4 }).primaryKey(),
    minZoom: doublePrecision().notNull(),
  },
  (t) => [
    index("station_visibility_index").using("btree", t.siteId),
    index("station_visibility_min_zoom_index").using("btree", t.minZoom),
  ],
);

export const isobars = pgTable(
  "isobars",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    value: integer().notNull(),
    startTime: timestamp({ mode: "date" }).notNull(),
    expiryTime: timestamp({ mode: "date" }).notNull(),
    geometry: geometry({ srid: 3857, type: "LineString" }).notNull(),
  },
  (t) => [index("isobar_spatial_index").using("gist", t.geometry)],
);

export const lightning = pgTable(
  "lightning",
  {
    startTime: timestamp({ mode: "date" }).primaryKey(),
    expiryTime: timestamp({ mode: "date" }).notNull(),
    geometry: geometry({ srid: 3857, type: "MultiPoint" }).notNull(),
  },
  (t) => [index("lightning_spatial_index").using("gist", t.geometry)],
);

export const aqData = pgTable(
  "aqData",
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
    primaryKey({ columns: [table.name, table.validTime], name: "aqData_pk" }),
    index("aqData_spatial_index").using("gist", table.geometry),
  ],
);

export const sigmets = pgTable(
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
  (table) => [
    primaryKey({ columns: [table.header, table.issueTime, table.charCode, table.numberCode], name: "sigmets_pk" }),
  ],
);

// export const pireps = pgTable(
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

export const metarsTemporalView = pgView("metars_temporal").as((qb) =>
  qb
    .select({
      ...getColumns(metars),
      startTime: sql<Date>`${metars.validTime}`.as("startTime"),
      expiryTime:
        sql<Date>`lead(${metars.validTime}, 1, ${metars.validTime} + interval '1 hour') over (partition by ${metars.siteId} order by ${metars.validTime})`.as(
          "expiryTime",
        ),
    })
    .from(metars),
);
