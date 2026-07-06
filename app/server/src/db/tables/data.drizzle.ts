import { sql } from "drizzle-orm";
import { check, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const INITIAL_SHAPES = ["polygon", "line", "point"] as const;
const HAZARD_TRENDS = ["NC", "INTSF", "WKN"] as const;

export const stations = sqliteTable("stations", {
  name: text(),
  siteId: text().primaryKey(),
  lat: real().notNull(),
  lon: real().notNull(),
  elev_f: real(),
  elev_m: real(),
  country: text(),
  state: text(),
});

export const metars = sqliteTable(
  "metars",
  {
    siteId: text().notNull(),
    validTime: integer({ mode: "timestamp_ms" }).notNull(),
    createdAt: integer({ mode: "timestamp_ms" }),
    tt: real(),
    td: real(),
    windDir: integer(),
    windSpd: integer(),
    windGst: integer(),
    mslp: real(),
    vis: text(),
    wxString: text(),
    category: text(),
    rawText: text(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const tafs = sqliteTable(
  "tafs",
  {
    siteId: text().notNull(),
    validTime: integer({ mode: "timestamp_ms" }).notNull(),
    rawText: text(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const pireps = sqliteTable(
  "pireps",
  {
    validTime: integer({ mode: "timestamp_ms" }).notNull(),
    lat: real().notNull(),
    lon: real().notNull(),
    flightLevel: integer(),
    aircraftType: text(),
    icg: text(),
    turb: text(),
    rawText: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.lat, table.lon, table.validTime] })],
);

export const sigmets = sqliteTable(
  "sigmets",
  {
    issueTime: integer({ mode: "timestamp_ms" }).notNull(),
    endTime: integer({ mode: "timestamp_ms" }).notNull(),
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
    hazardTrend: text({ enum: HAZARD_TRENDS }),
    hazardBottom: text(),
    hazardTop: text(),
    direction: real(),
  },
  (table) => [
    primaryKey({ columns: [table.header, table.issueTime, table.charCode, table.numberCode], name: "sigmets_pk" }),
    check(
      "sigmets_initial_shape_check",
      sql`${table.initialShape} IS NULL OR ${table.initialShape} IN ('polygon', 'line', 'point')`,
    ),
    check(
      "sigmets_hazard_trend_check",
      sql`${table.hazardTrend} IS NULL OR ${table.hazardTrend} IN ('NC', 'INTSF', 'WKN')`,
    ),
  ],
);

export const aqData = sqliteTable(
  "aqData",
  {
    name: text(),
    type: text(),
    lat: real(),
    lon: real(),
    validTime: integer({ mode: "timestamp_ms" }),
    pm25: real(),
  },
  (table) => [primaryKey({ columns: [table.name, table.validTime], name: "aqData_pk" })],
);

export const lightningData = sqliteTable(
  "lightning",
  {
    dateFrom: integer({ mode: "timestamp_ms" }),
    dateTo: integer({ mode: "timestamp_ms" }),
    strikes: text(),
  },
  (table) => [primaryKey({ columns: [table.dateFrom], name: "lightningData_pk" })],
);
