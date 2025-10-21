import { datetime, float, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";
export const aqData = mysqlTable("aqData", {
    name: varchar("name", { length: 45 }),
    type: varchar("type", { length: 3 }),
    lat: float("lat"),
    lon: float("lon"),
    validTime: datetime("validTime", { mode: "date" }),
    pm25: float("pm25"),
}, (table) => ({
    pk: primaryKey({ columns: [table.name, table.validTime] }),
}));
