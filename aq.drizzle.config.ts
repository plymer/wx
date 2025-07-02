import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { generateDbConnection } from "./src/shared/lib/utils";

const url = generateDbConnection("aq");

export default defineConfig({
  out: "./drizzle",
  schema: "src/shared/db/schemas/aq.drizzle.ts",
  dialect: "mysql",
  dbCredentials: { url },
});
