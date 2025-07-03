import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { genDbConnString } from "./src/shared/lib/utils";

const url = genDbConnString("aq");

if (!url) {
  console.error("[AQ] Database credentials are not set.");
  process.exit(1);
}

export default defineConfig({
  out: "./drizzle",
  schema: "src/shared/db/tables/aq.drizzle.ts",
  dialect: "mysql",
  dbCredentials: { url },
});
