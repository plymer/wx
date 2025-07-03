import { Relations } from "drizzle-orm";
import { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm/sql";

export async function generateDbConnection<
  TSchema extends Record<string, MySqlTableWithColumns<any> | Relations<any, any>>,
>(dbName: string, dbSchema: TSchema) {
  const connectionString = genDbConnString(dbName);

  if (!connectionString) {
    console.error(`[${dbName.toUpperCase()}] Database credentials are not set.`);
    return undefined;
  }

  const db = drizzle(connectionString, { mode: "default", schema: dbSchema });

  const isConnected = await testDbConnection(db, dbName);

  if (isConnected) return db;
  else return undefined;
}

export function genDbConnString(dbName: string) {
  const userName = process.env.AM_I_A_SERVER ? `${dbName}user` : "root";
  const password = process.env.DB_PASSWORD;
  if (!password) {
    console.error("DB_PASSWORD environment variable is not set");
    return undefined;
  }

  return `mysql://${userName}:${password}@localhost:3306/${dbName}`;
}

export async function testDbConnection(db: ReturnType<typeof drizzle>, dbName: string) {
  try {
    await db.execute(sql`SELECT 1`);
    console.log(`[${dbName.toUpperCase()}] Database connection is valid.`);
    return true;
  } catch (err) {
    console.error(`[${dbName.toUpperCase()}] Database connection failed:`, err);
    return false;
  }
}
