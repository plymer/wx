/// <reference types="node" />

import { defineConfig } from "drizzle-kit";
import { credentials } from "./app/server/src/services/database.js";

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: credentials,
  extensionsFilters: ["postgis"],
  schema: "./app/server/src/db/schemas.drizzle.ts",
  out: "./drizzle",
});
