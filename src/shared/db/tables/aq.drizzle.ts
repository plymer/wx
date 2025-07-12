import { float, mysqlTable, varchar, datetime, primaryKey } from "drizzle-orm/mysql-core";

export const aqData = mysqlTable(
  "aqData",
  {
    name: varchar({ length: 45 }),
    type: varchar({ length: 3 }),
    lat: float(),
    lon: float(),
    validTime: datetime({ mode: "date" }),
    pm25: float(),
  },
  (table) => [primaryKey({ columns: [table.name, table.validTime] })],
);
