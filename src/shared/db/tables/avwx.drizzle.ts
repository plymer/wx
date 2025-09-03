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
  name: varchar({ length: 45 }),
  siteId: varchar({ length: 4 }).primaryKey(),
  lat: float().notNull(),
  lon: float().notNull(),
  elev_f: float(),
  elev_m: float(),
  country: varchar({ length: 2 }),
  state: varchar({ length: 2 }),
});

export const metars = mysqlTable(
  "metars",
  {
    siteId: varchar({ length: 4 }).notNull(),
    validTime: datetime().notNull(),
    tt: float(),
    td: float(),
    windDir: int(),
    windSpd: int(),
    windGst: int(),
    vis: text(),
    wxString: text(),
    category: varchar({ length: 4 }),
    rawText: text(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const tafs = mysqlTable(
  "tafs",
  {
    siteId: varchar({ length: 4 }).notNull(),
    validTime: datetime().notNull(),
    rawText: text(),
  },
  (table) => [primaryKey({ columns: [table.siteId, table.validTime] })],
);

export const pireps = mysqlTable(
  "pireps",
  {
    validTime: datetime().notNull(),
    lat: float().notNull(),
    lon: float().notNull(),
    flightLevel: int(),
    aircraftType: varchar({ length: 10 }),
    icg: varchar({ length: 10 }),
    turb: varchar({ length: 10 }),
    rawText: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.lat, table.lon, table.validTime] })],
);

export const sigmets = mysqlTable(
  "sigmets",
  {
    issueTime: datetime().notNull(),
    endTime: datetime().notNull(),
    charCode: varchar({ length: 20 }).default("-").notNull(),
    numberCode: smallint().default(0).notNull(),
    initialShape: mysqlEnum(["polygon", "line", "point"]),
    speed: int(),
    initialCoords: text(),
    finalCoords: text(),
    rawText: text().notNull(),
    domain: text(),
    issuer: text(),
    firRegion: text(),
    header: varchar({ length: 6 }).default("TEMP").notNull(),
    hazard: text(),
    hazardTrend: mysqlEnum(["NC", "INTSF", "WKN"]),
    hazardBottom: text(),
    hazardTop: text(),
    direction: float(),
  },
  (table) => [
    primaryKey({ columns: [table.header, table.issueTime, table.charCode, table.numberCode], name: "sigmets_pk" }),
  ],
);
