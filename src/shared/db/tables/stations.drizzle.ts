import { float, mysqlTable, varchar } from "drizzle-orm/mysql-core";

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
