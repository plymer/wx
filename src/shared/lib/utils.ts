import axios from "axios";
import { Relations } from "drizzle-orm";
import { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm/sql";
import { createGunzip } from "zlib";
import { XMLParser } from "fast-xml-parser";

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

export async function readGzipFile(url: string, dbName: string) {
  try {
    // fetch the compressed data
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const compressedData = response.data;

    // decompress the data
    const decompressedData = await new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const chunks: Buffer[] = [];

      gunzip.on("data", (chunk) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      gunzip.on("error", (err) => reject(err));

      gunzip.write(compressedData);
      gunzip.end();
    });

    if (typeof decompressedData !== "string") {
      throw new Error(`[${dbName.toUpperCase()}] Decompressed data is not a string`);
    }

    return decompressedData;
  } catch (error) {
    console.error(`[${dbName.toUpperCase()}] Error reading gzip file:`, error);
    throw error;
  }
}

/**
 * transform a tag or attribute name into camelCase so that it can be used as a key in a JSON object
 * @param name a tag or attribute name that we want to transform
 * @returns a camelCase version of the tag or attribute name supplied
 */
function transformName(name: string) {
  const parts = name.replace(/[-_]/g, " ").split(" ");
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("")
  );
}

/**
 * create a new XMLParser instance configured with JSON-friendly options
 * @returns a new XMLParser that replaces all namespace prefixes and converts all tags and attributes to camelCase
 */
export function xmlParser() {
  const parser = new XMLParser({
    removeNSPrefix: true,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    transformAttributeName: (attrName) => transformName(attrName),
    transformTagName: (tagName) => transformName(tagName),
  });

  return parser;
}
