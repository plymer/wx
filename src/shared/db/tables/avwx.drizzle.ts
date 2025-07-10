import { datetime, float, int, mysqlTable, primaryKey, text, varchar } from "drizzle-orm/mysql-core";

export const stations = mysqlTable("stations", {
  name: varchar({ length: 45 }),
  icaoId: varchar({ length: 4 }).primaryKey(),
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
