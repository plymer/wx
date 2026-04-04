/// <reference types="node" />

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const sqlitePath = process.env.SQLITE_PATH ?? "./sqlite-db/wx.sqlite";

export default defineConfig({
  out: "./drizzle",
  schema: "app/server/src/db/tables/data.drizzle.ts",
  dialect: "sqlite",
  dbCredentials: { url: sqlitePath },
});
