import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schemas from "../db/schemas.drizzle.js";
import "dotenv/config";
import { defineRelations } from "drizzle-orm";

const relations = defineRelations(schemas, (r) => ({
  stations: {
    metars: r.many.metars(),
    tafs: r.many.tafs(),
  },
  metars: {
    stations: r.one.stations({
      from: r.metars.siteId,
      to: r.stations.siteId,
    }),
  },
  tafs: {
    stations: r.one.stations({
      from: r.tafs.siteId,
      to: r.stations.siteId,
    }),
  },
}));

const createDb = (client: Pool) => drizzle({ client, relations });

type Database = ReturnType<typeof createDb>;

export const credentials = {
  user: process.env.DB_USER ?? "postgres",
  password: process.env.DB_PASSWORD ?? "password",
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: parseInt(process.env.DB_PORT ?? "5432", 10),
  database: process.env.DB_NAME ?? "wxdb",
  ssl: false,
};

export class DatabaseConnection {
  private _db: Database | undefined;
  private _dbClient: Pool | undefined;
  private _consumer: string;

  constructor(consumer: string) {
    this._consumer = consumer;
  }

  public async getDb() {
    return this._db;
  }

  public async getClient() {
    return this._dbClient;
  }

  public async connect() {
    const client = new Pool({ ...credentials });
    this._dbClient = client;
    this._db = createDb(client);

    const isConnected = await this.testConnection();

    if (isConnected) {
      console.log(`[${this._consumer.toUpperCase()}] Postgres connection successful!`);
      return;
    } else {
      console.error(`[${this._consumer.toUpperCase()}] Postgres connection failed.`);
      this._db = undefined;
      this._dbClient = undefined;
      return;
    }
  }

  public async disconnect() {
    if (this._dbClient) {
      await this._dbClient.end();
      console.log(`[${this._consumer.toUpperCase()}] Postgres connection closed.`);
      this._db = undefined;
      this._dbClient = undefined;
      return;
    } else {
      console.warn(`[${this._consumer.toUpperCase()}] No Postgres connection to close.`);
      return;
    }
  }

  public async isHealthy() {
    if (!this._db || !this._dbClient) return false;

    const isConnected = await this.testConnection();

    if (isConnected) {
      return true;
    } else {
      console.warn(`[${this._consumer.toUpperCase()}] Postgres connection is unhealthy.`);
      return false;
    }
  }

  public async reconnect() {
    console.log(`[${this._consumer.toUpperCase()}] Attempting to reconnect to Postgres...`);

    if (this._dbClient) {
      try {
        await this._dbClient.end();
      } catch {
        // ignore errors here
      }
    }

    this._db = undefined;
    this._dbClient = undefined;

    await this.connect();
    return this._db !== undefined && this._dbClient !== undefined;
  }

  private async testConnection() {
    if (!this._db) return false;
    try {
      await this._db.execute("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }
}

const pgDbConnection = new DatabaseConnection("data");
await pgDbConnection.connect();

export const pgDb = await pgDbConnection.getDb();
export const pgConnection = pgDbConnection;
