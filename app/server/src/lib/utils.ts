import { existsSync, readdirSync, statSync } from "fs";
import path from "path";
import suncalc, { type GetTimesResult } from "suncalc";
import { createGunzip } from "zlib";
import * as turf from "@turf/turf";
import { XMLParser } from "fast-xml-parser";
import type { Position } from "geojson";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import { Relations } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import type { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import "dotenv/config";

import type { LatLon, SunTimes } from "./common.types.js";
import type { XmetShapes } from "./alphanumeric.types.js";
import { DEFAULT_REMOTE_HEADERS, MINUTE } from "./constants.js";

import type { OutlookData, Panel, RegionData, WmoDirection } from "./types.js";
import { OFFICE_REGION_MAP } from "../config/charts.config.js";
import { outlookOfficeSchema, outlookRegionSchema } from "./validation.js";

/**
 *
 * @param input the number that needs to have zeroes prepended to it
 * @param minLength the number of digits that the output should to contain
 * @returns a string of the minimum length that represents the input prepended with a number of zeroes
 */
export function leadZero(input: number, minLength: number): string {
  const inputString: string = input.toString();
  let leader: string = "";

  for (let i = 0; i < minLength - inputString.length; i++) {
    leader += "0";
  }

  return leader + inputString;
}

export function makeISOTimeStamp(time: number, mode: "display" | "data" = "data") {
  return mode === "display"
    ? new Date(time)
        .toISOString() // convert the unix epoch time into an ISO date string
        .replace(/:\d+.\d+Z$/g, "Z") // remove the seconds and milliseconds
        .replace("T", " ") // replace the "T" with a space
    : new Date(time)
        .toISOString() // convert the unix epoch time into an ISO date string
        .replace(/.\d+Z$/g, "Z"); // remove the milliseconds
}

/**
 * transform a tag or attribute name into camelCase so that it can be used as a key in a JSON object
 * @param name a tag or attribute name that we want to transform
 * @returns a camelCase version of the tag or attribute name supplied
 */
export function transformName(name: string): string {
  // If the entire string is uppercase, convert it to lowercase first
  if (name === name.toUpperCase() && /[A-Z]/.test(name)) {
    name = name.toLowerCase();
  }

  if (!name.includes("-") && !name.includes("#") && !name.includes("_")) {
    const camelCase = name.charAt(0).toLowerCase() + name.slice(1);
    return camelCase;
  }

  // Find the first occurrence of any special character
  let index = -1;
  const specialChars = ["-", "#", "_"];

  for (const char of specialChars) {
    const charIndex = name.indexOf(char);
    if (charIndex !== -1 && (index === -1 || charIndex < index)) {
      index = charIndex;
    }
  }

  if (index === -1) {
    // No special characters found, just lowercase first character
    const camelCase = name.charAt(0).toLowerCase() + name.slice(1);
    return camelCase;
  }

  // Check if this is the first transformation (contains uppercase letters before special char)
  const firstPart = name.slice(0, index);
  const isFirstTransformation = /[A-Z]/.test(firstPart) && firstPart === firstPart.toUpperCase();

  // Only lowercase the first part if it's the initial transformation
  const transformedFirstPart = isFirstTransformation ? firstPart.toLowerCase() : firstPart;
  const secondPart = name.charAt(index + 1).toUpperCase() + name.slice(index + 2);
  const output = transformedFirstPart + secondPart;

  return transformName(output);
}

/**
 *
 * @param lat the latitude of the point that the sun times are calculated for
 * @param lon the longitude of the point that the sun times are calculated for
 * @returns an object of type SunTimes containing a string for the sunrise and sunset in the format of "HH:mmZ" or "---" if the sun never rises or sets
 */
export function getSunTimes(latLon: LatLon): SunTimes {
  // create a suncalc time object
  const times: GetTimesResult = suncalc.getTimes(new Date(), latLon.lat, latLon.lon);

  // set sunrise and sunset times to "---" when the sun doesn't rise or set today
  const riseString: string =
    times.sunrise.getUTCHours().toString() !== "NaN"
      ? leadZero(times.sunrise.getUTCHours(), 2) + ":" + leadZero(times.sunrise.getUTCMinutes(), 2) + "Z"
      : "---";
  const setString: string =
    times.sunsetStart.getUTCHours().toString() !== "NaN"
      ? leadZero(times.sunsetStart.getUTCHours(), 2) + ":" + leadZero(times.sunsetStart.getUTCMinutes(), 2) + "Z"
      : "---";

  return { rise: riseString, set: setString };
}
/**
 *
 * @param dim a string from the GetCapabilities document that represents the start time, end time, and time step interval in for format of `2025-02-19T01:30:00Z/2025-02-19T04:30:00Z/PT6M`
 * @returns an array of objects with a single key `validTime` that contains the epoch milliseconds of the time step
 */
export function processDimensionString(dim: string) {
  //2025-02-19T01:30:00Z/2025-02-19T04:30:00Z/PT6M
  const dimArray = dim.split("/");
  const start = new Date(dimArray[0]).getTime();
  const end = new Date(dimArray[1]).getTime();
  const interval = parseInt(dimArray[2].replace("PT", "").replace("M", "")) * MINUTE;

  // create an array of timestamps from the start time to the end time at the given interval
  const timesteps = [];
  for (let i = start; i <= end; i += interval) {
    timesteps.push({ validTime: i });
  }

  return timesteps;
}

/**
 *
 * @param shape - the string representing the type of shape defined in the database
 * @param bufferSize - the size of the resulting feature, as a radius or width from a central point or line
 * @param coords - the input coordinates in the format of "lat,lon lat,lon lat,lon ..."
 * @returns a Position object that contains the coordinates of the resulting shape, formatted for injection into a GeoJSON object
 */
export function processCoordinates(shape: XmetShapes | null, bufferSize: number | null, coords: string | null) {
  if (!shape || !coords || coords.trim() === "") return null;

  const COORD_DELIMITER = " ";

  const coordsList = coords
    .split(COORD_DELIMITER)
    .map((coord) => {
      const [lat, lon] = coord.split(",");
      return [Number(lon), Number(lat)] as Position;
    })
    .filter(([lon, lat]) => {
      // Filter out NaN or invalid
      return !isNaN(lon) && !isNaN(lat);
    });

  // Ensure we have valid coordinates
  if (coordsList.length === 0) {
    console.log("Error - No valid coordinates found in:", coords);
    return null;
  }

  switch (shape) {
    case "point":
      if (!bufferSize) return null;
      // buffer our point to create a circle
      const circle = turf.circle(coordsList[0], bufferSize, { steps: 24, units: "nauticalmiles" });

      // return the coordinates of the circle polygon
      return circle.geometry.coordinates;
    case "line":
      if (!bufferSize) return null;
      // we need to build two line offsets from the original line, and then weld them back together into a polygon
      // there should end up being 2n + 1 points in the output polygon, where n is the number of points in the input line
      const offsetA = turf.lineOffset(turf.lineString(coordsList), bufferSize, { units: "nauticalmiles" });
      const offsetB = turf.lineOffset(turf.lineString(coordsList), -bufferSize, { units: "nauticalmiles" });

      // TODO :: this is not 100% accurate so we will need to re-build our normals-generator function and use that logic to build the accurate offset lines

      // combine the coordinates of both offsets into a single array
      const offsetACoords = offsetA.geometry.coordinates;
      const offsetBCoords = offsetB.geometry.coordinates;

      // create a closed polygon by connecting both offset lines, and adding the first point of the first line to the end of the second line
      const coordinates = [...offsetACoords, ...offsetBCoords.reverse(), offsetACoords[0]];

      // create a polygon from the combined coordinates
      const polygon = turf.polygon([coordinates]);

      return polygon.geometry.coordinates;

    case "polygon":
      if (coordsList.length < 3) {
        console.log("Error - A closed polygon must have at least 4 points", shape, bufferSize, coords);
        return null;
      } else if (coordsList.length >= 3) {
        // check to see if the first point is the same as the last point, if it is, return the coordsList as is

        if (coordsList.length === 3) {
          // we might be trying to draw a triangle, so first off:
          //  1. check that the first and last points are not the same - if they are, that's wrong and we return null
          if (firstAndLastAreSame(coordsList)) {
            console.log("Error - A triangle cannot have the same start and end point", shape, bufferSize, coords);
            return null;
          }
          //  2. check that the three points are not collinear - if they are, that's wrong and we return null
          const area =
            0.5 *
            Math.abs(
              coordsList[0][0] * (coordsList[1][1] - coordsList[2][1]) +
                coordsList[1][0] * (coordsList[2][1] - coordsList[0][1]) +
                coordsList[2][0] * (coordsList[0][1] - coordsList[1][1]),
            );
          if (area === 0) {
            console.log("Error - A triangle cannot have collinear points", shape, bufferSize, coords);
            return null;
          }

          // if we have three valid points, we need to close the polygon by adding the first point to the end of the list
          return [[...coordsList, coordsList[0]]];
        }

        // if we have more than 3 points, check if the first and last points are the same
        if (firstAndLastAreSame(coordsList)) {
          // if they are the same, return the coordsList as is because this should be a valid polygon
          return [coordsList];
        } else {
          // if not, add the first point to the end of the list to close the polygon
          return [[...coordsList, coordsList[0]]];
        }
      }
    default:
      return null;
  }
}

export function firstAndLastAreSame(coords: Position[]) {
  return coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];
}

export function isConvectiveSigmet(header: string): boolean {
  return header.includes("WSUS3");
}

export async function generateDbConnection<
  TSchema extends Record<string, MySqlTableWithColumns<any> | Relations<any, any>>,
>(dbName: string, dbSchema: TSchema) {
  const connectionPool = getDbConnectionPool(dbName);

  if (!connectionPool) {
    console.error(`[${dbName.toUpperCase()}] Database credentials are not set.`);
    return undefined;
  }

  const db = drizzle(connectionPool, { mode: "default", schema: dbSchema });

  const isConnected = await testDbConnection(db, dbName);

  if (isConnected) return db;
  else return undefined;
}

export function getDbConnectionPool(dbName: string) {
  const userName = process.env.AM_I_A_SERVER ? `${dbName}user` : "root";
  const password = process.env.DB_PASSWORD;
  if (!password) {
    console.error("DB_PASSWORD environment variable is not set");
    return undefined;
  }

  const connection = createPool({
    host: "localhost",
    port: 3306,
    user: userName,
    password: password,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return connection;
}

export async function testDbConnection<TSchema extends Record<string, unknown>>(
  db: MySql2Database<TSchema> & {
    $client: Pool;
  },
  dbName: string,
) {
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
    const arrayBuffer = await fetch(url, { headers: DEFAULT_REMOTE_HEADERS }).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      return res.arrayBuffer();
    });
    const compressedData = Buffer.from(arrayBuffer);

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

  return { parser };
}

/**
 *
 * @param dir - a string representing a cardinal direction, such as "N" or "SSW", or a "-"" for no direction
 * @returns a number representing the direction in degrees, such as 0 or 202.5
 */
export function cardinalToDegrees(dir: WmoDirection): number {
  const directionMap: { [key: string]: number } = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
    "-": 0,
  };

  // Return the degree corresponding to the given direction
  return directionMap[dir.toUpperCase()];
}

/**
 * limits query results to a specific number of the most recent entries per unique key value
 *
 * @param queryResult - the array of results to be limited
 * @param limit - the maximum number of entries to keep per unique key value
 * @param uniqueKey - a function that extracts the unique identifier from each item or a key name; the key name must be a string
 * @returns a new array with limited results
 */
export function limitResultsByKeys<T>(
  queryResult: T[],
  limit: number,
  uniqueKey: ((item: T) => string) | keyof T | (keyof T)[],
): T[] {
  // ff limit is zero or negative, return the original results
  if (limit <= 0) {
    return queryResult;
  }

  // create a function to extract the key, whether uniqueKey is a function or a property name
  const getKey =
    typeof uniqueKey === "function"
      ? uniqueKey
      : Array.isArray(uniqueKey)
        ? (item: T) => uniqueKey.map((key) => String(item[key])).join("|") // Combine multiple keys into a composite key
        : (item: T) => String(item[uniqueKey]);

  // get the unique keys
  const uniqueKeys = [...new Set(queryResult.map(getKey))];

  // initialize result array
  let limitedResult: T[] = [];

  // for each unique key, get the latest 'limit' number of entries
  uniqueKeys.forEach((key) => {
    const filteredItems = queryResult.filter((item) => getKey(item) === key);
    limitedResult = [...limitedResult, ...filteredItems.slice(-limit)];
  });

  return limitedResult;
}

export function outlookHandler(product: string) {
  const outlookRootDir = process.env.OUTLOOK_DIR ?? "./images";

  if (!outlookRootDir) {
    throw new Error("OUTLOOK_DIR environment variable is not set");
  }

  const dirPath = path.join(outlookRootDir, product, "today");
  console.log("[API] Loading", product, "charts");
  if (!existsSync(dirPath)) {
    console.warn(`[API] ${product} directory does not exist at path: ${dirPath}`);
    return null;
  }

  const officeDir = readdirSync(dirPath, { withFileTypes: true, recursive: true });
  const result: OutlookData = {} as OutlookData;
  for (const entry of officeDir) {
    if (!entry.isFile()) continue;

    const [, office, region, validPeriod] =
      entry.name.match(/([a-zA-Z]+)(?:-)([0-9a-zA-z_-]+)(?:-)([0-9a-zA-z_]+)/) || [];

    // use zod to validate our office and region values, and to transform them into the correct format if necessary (lowercasing them and comparing them against the lookups in our config)
    const { data: officeKey, success: officeParsed } = outlookOfficeSchema.safeParse(office);

    if (!officeParsed) {
      console.warn(`[API] Skipping file with invalid office: ${entry.name}`);
      continue;
    }

    const { data: regionKey, success: regionParsed } = outlookRegionSchema.safeParse(region);

    if (!regionParsed) {
      console.warn(`[API] Skipping file with invalid region: ${region}`);
      continue;
    }

    if (regionKey === undefined || officeKey === undefined) {
      console.warn(`[API] Skipping file with undefined office or region: ${entry.name}`);
      continue;
    }

    console.log(
      `[API] Processing file: ${entry.name} (Office: ${officeKey}, Region: ${regionKey}, Valid: ${validPeriod})`,
    );

    if (office && region && validPeriod) {
      const stats = statSync(path.join(entry.parentPath, entry.name));

      // Create the panel object
      const panel: Panel = {
        id: entry.name,
        name: OFFICE_REGION_MAP[regionKey as keyof typeof OFFICE_REGION_MAP],
        date: stats.mtime.toUTCString(),
        product,
        office: officeKey,
        region: regionKey,
        validPeriod,
        url: `/images/${product}/today/${officeKey}/${entry.name}`,
      };

      // Initialize office if it doesn't exist
      if (!result[officeKey]) result[officeKey] = {};

      // Add or update region data
      const existingRegionData = result[officeKey][region];

      if (existingRegionData) {
        existingRegionData.panels.push(panel);
      } else {
        const regionData: RegionData = {
          office: officeKey,
          id: region,
          name: OFFICE_REGION_MAP[regionKey as keyof typeof OFFICE_REGION_MAP],
          panels: [panel],
        };

        result[officeKey][region] = regionData;
      }
    }
  }

  // add an explicit check to see if we have valid date, otherwise return explicitly undefined
  return Object.keys(result).length > 0 ? result : null;
}
