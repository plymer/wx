/// <reference types="node" />

import { defineConfig } from "drizzle-kit";
import { credentials } from "./app/server/src/services/pg-db.js";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: credentials,
  extensionsFilters: ["postgis"],
  schema: "./app/server/src/db/tables/pg.drizzle.ts",
  out: "./drizzle",
});
