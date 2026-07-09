import { drizzle } from "drizzle-orm/node-postgres";
import "dotenv/config";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import type { Relations } from "drizzle-orm";

const dbUser = process.env.DB_USER ?? "postgres";
const dbPassword = process.env.DB_PASSWORD ?? "password";
const dbHost = process.env.DB_HOST ?? "localhost";
const dbPort = process.env.DB_PORT ?? "5432";
const dbName = process.env.DB_NAME ?? "wxdb";

export const credentials = {
  user: dbUser,
  password: dbPassword,
  host: dbHost,
  port: parseInt(dbPort, 10),
  database: dbName,
  ssl: false,
};

export class DatabaseConnection<TSchema extends Record<string, PgTableWithColumns<any> | Relations<any, any>>> {
  schema: TSchema;
  db: ReturnType<typeof drizzle<TSchema>>;
  constructor(dbSchema: TSchema) {
    this.db = drizzle(
      `postgres://${credentials.user}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}`,
    );
    this.schema = dbSchema;
  }

  async testConnection() {
    try {
      await this.db.execute("SELECT 1");
      console.log("Database connection successful!");
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }

  async getDb() {
    await this.testConnection();
    return this.db;
  }
}

export type DbShape<TSchema extends Record<string, PgTableWithColumns<any> | Relations<any, any>>> =
  DatabaseConnection<TSchema>["db"];
