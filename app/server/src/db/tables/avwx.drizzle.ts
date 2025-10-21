import {
  datetime,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const stations = mysqlTable("stations", {
  name: varchar("name", { length: 45 }),
  siteId: varchar("siteId", { length: 4 }).primaryKey(),
  lat: float("lat").notNull(),
  lon: float("lon").notNull(),
  elev_f: float("elev_f"),
  elev_m: float("elev_m"),
  country: varchar("country", { length: 2 }),
  state: varchar("state", { length: 2 }),
});

export const metars = mysqlTable(
  "metars",
  {
    siteId: varchar("siteId", { length: 4 }).notNull(),
    validTime: datetime("validTime").notNull(),
    tt: float("tt"),
    td: float("td"),
    windDir: int("windDir"),
    windSpd: int("windSpd"),
    windGst: int("windGst"),
    vis: text("vis"),
    wxString: text("wxString"),
    category: varchar("category", { length: 4 }),
    rawText: text("rawText"),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const tafs = mysqlTable(
  "tafs",
  {
    siteId: varchar("siteId", { length: 4 }).notNull(),
    validTime: datetime("validTime").notNull(),
    rawText: text("rawText"),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const pireps = mysqlTable(
  "pireps",
  {
    validTime: datetime("validTime").notNull(),
    lat: float("lat").notNull(),
    lon: float("lon").notNull(),
    flightLevel: int("flightLevel"),
    aircraftType: varchar("aircraftType", { length: 10 }),
    icg: varchar("icg", { length: 10 }),
    turb: varchar("turb", { length: 10 }),
    rawText: text("rawText").notNull(),
  },
  (table) => [primaryKey({ columns: [table.lat, table.lon, table.validTime] })],
);

export const sigmets = mysqlTable(
  "sigmets",
  {
    issueTime: datetime("issueTime").notNull(),
    endTime: datetime("endTime").notNull(),
    charCode: varchar("charCode", { length: 20 }).default("-").notNull(),
    numberCode: smallint("numberCode").default(0).notNull(),
    initialShape: mysqlEnum("initialShape", ["polygon", "line", "point"]),
    speed: int("speed"),
    initialCoords: text("initialCoords"),
    finalCoords: text("finalCoords"),
    rawText: text("rawText").notNull(),
    domain: text("domain"),
    issuer: text("issuer"),
    firRegion: text("firRegion"),
    header: varchar("header", { length: 6 }).default("TEMP").notNull(),
    hazard: text("hazard"),
    hazardTrend: mysqlEnum("hazardTrend", ["NC", "INTSF", "WKN"]),
    hazardBottom: text("hazardBottom"),
    hazardTop: text("hazardTop"),
    direction: float("direction"),
  },
  (table) => [
    primaryKey({ columns: [table.header, table.issueTime, table.charCode, table.numberCode], name: "sigmets_pk" }),
  ],
);
