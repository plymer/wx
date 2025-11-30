import "dotenv/config";
import { defineConfig } from "drizzle-kit";

function genDbConnString(dbName: string) {
  const userName = process.env.AM_I_A_SERVER ? `${dbName}user` : "root";
  const password = process.env.DB_PASSWORD;
  if (!password) {
    console.error("DB_PASSWORD environment variable is not set");
    return undefined;
  }

  return `mysql://${userName}:${password}@localhost:3306/${dbName}`;
}

const url = genDbConnString("avwx");

if (!url) {
  console.error("[Station Catalog] Database credentials are not set.");
  process.exit(1);
}

export default defineConfig({
  out: "./drizzle",
  schema: "app/server/src/db/tables/avwx.drizzle.ts",
  dialect: "mysql",
  dbCredentials: { url },
});
