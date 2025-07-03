import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm/sql";

export function generateDbConnection(dbName: string) {
  const credentials = {
    userName: process.env.AM_I_A_SERVER ? `${dbName}user` : "root",
    password: process.env.DB_PASSWORD,
  };

  if (!credentials.password) {
    throw new Error("DB_PASSWORD environment variable is not set");
  }

  return `mysql://${credentials.userName}:${credentials.password}@localhost:3306/${dbName}`;
}

export async function testDbConnection(db: ReturnType<typeof drizzle>) {
  try {
    await db.execute(sql`SELECT 1`);
    console.log(`[DATA PROCESSING] Database connection is valid.`);
  } catch (err) {
    console.error(`[DATA PROCESSING] Database connection failed:`, err);
    process.exit(1);
  }
}
