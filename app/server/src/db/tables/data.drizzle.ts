import { sql } from "drizzle-orm";
import { check, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const INITIAL_SHAPES = ["polygon", "line", "point"] as const;
const HAZARD_TRENDS = ["NC", "INTSF", "WKN"] as const;

export const stations = sqliteTable("stations", {
  name: text("name"),
  siteId: text("siteId").primaryKey(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  elev_f: real("elev_f"),
  elev_m: real("elev_m"),
  country: text("country"),
  state: text("state"),
});

export const metars = sqliteTable(
  "metars",
  {
    siteId: text("siteId").notNull(),
    validTime: integer("validTime", { mode: "timestamp_ms" }).notNull(),
    tt: real("tt"),
    td: real("td"),
    windDir: integer("windDir"),
    windSpd: integer("windSpd"),
    windGst: integer("windGst"),
    mslp: real("mslp"),
    vis: text("vis"),
    wxString: text("wxString"),
    category: text("category"),
    rawText: text("rawText"),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const tafs = sqliteTable(
  "tafs",
  {
    siteId: text("siteId").notNull(),
    validTime: integer("validTime", { mode: "timestamp_ms" }).notNull(),
    rawText: text("rawText"),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const pireps = sqliteTable(
  "pireps",
  {
    validTime: integer("validTime", { mode: "timestamp_ms" }).notNull(),
    lat: real("lat").notNull(),
    lon: real("lon").notNull(),
    flightLevel: integer("flightLevel"),
    aircraftType: text("aircraftType"),
    icg: text("icg"),
    turb: text("turb"),
    rawText: text("rawText").notNull(),
  },
  (table) => [primaryKey({ columns: [table.lat, table.lon, table.validTime] })],
);

export const sigmets = sqliteTable(
  "sigmets",
  {
    issueTime: integer("issueTime", { mode: "timestamp_ms" }).notNull(),
    endTime: integer("endTime", { mode: "timestamp_ms" }).notNull(),
    charCode: text("charCode").default("-").notNull(),
    numberCode: integer("numberCode").default(0).notNull(),
    initialShape: text("initialShape", { enum: INITIAL_SHAPES }),
    speed: integer("speed"),
    initialCoords: text("initialCoords"),
    finalCoords: text("finalCoords"),
    rawText: text("rawText").notNull(),
    domain: text("domain"),
    issuer: text("issuer"),
    firRegion: text("firRegion"),
    header: text("header").default("TEMP").notNull(),
    hazard: text("hazard"),
    hazardTrend: text("hazardTrend", { enum: HAZARD_TRENDS }),
    hazardBottom: text("hazardBottom"),
    hazardTop: text("hazardTop"),
    direction: real("direction"),
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
    name: text("name"),
    type: text("type"),
    lat: real("lat"),
    lon: real("lon"),
    validTime: integer("validTime", { mode: "timestamp_ms" }),
    pm25: real("pm25"),
  },
  (table) => [primaryKey({ columns: [table.name, table.validTime], name: "aqData_pk" })],
);
