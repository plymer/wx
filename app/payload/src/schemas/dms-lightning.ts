import { datetime, mysqlTable, text } from "drizzle-orm/mysql-core";

export const lightning = mysqlTable("stroke-positions", {
  validTime: datetime().primaryKey(),
  coords: text(),
});
