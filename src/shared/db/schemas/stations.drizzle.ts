import { int, float, mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";

export const stations = mysqlTable("stations", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 45 }),
  icaoId: varchar({ length: 4 }),
  lat: float(),
  lon: float(),
  elev_f: float(),
  elev_m: float(),
  country: varchar({ length: 2 }),
  state: varchar({ length: 2 }),
});
