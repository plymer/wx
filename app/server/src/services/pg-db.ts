import { drizzle } from "drizzle-orm/node-postgres";
import "dotenv/config";

const dbUser = process.env.DB_USER ?? "postgres";
const dbPassword = process.env.DB_PASSWORD ?? "password";
const dbHost = process.env.DB_HOST ?? "127.0.0.1";
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

export class DatabaseConnection<TSchema extends Record<string, unknown>> {
  schema: TSchema;
  consumer: string;
  db: ReturnType<typeof drizzle<TSchema>>;
  constructor(dbSchema: TSchema, consumer: string) {
    this.db = drizzle(
      `postgres://${credentials.user}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.database}`,
      { schema: dbSchema },
    );
    this.schema = dbSchema;
    this.consumer = consumer;
  }

  async testConnection() {
    try {
      await this.db.execute("SELECT 1");
      console.log(`[${this.consumer.toUpperCase()}] Postgres connection successful!`);
    } catch (error) {
      console.error(`[${this.consumer.toUpperCase()}] Postgres connection failed:`, error);
    }
  }

  async getDb() {
    await this.testConnection();
    return this.db;
  }
}

export type DbShape<TSchema extends Record<string, unknown>> = DatabaseConnection<TSchema>["db"];
