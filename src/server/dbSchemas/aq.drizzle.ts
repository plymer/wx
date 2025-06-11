import { int, float, mysqlTable, varchar, datetime } from "drizzle-orm/mysql-core";

export const aqData = mysqlTable("aqData", {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 45 }),
  type: varchar({ length: 3 }),
  lat: float(),
  lon: float(),
  validTime: datetime({ mode: "date" }),
  pm25: float(),
});
