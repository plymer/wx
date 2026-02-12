import suncalc, { type GetTimesResult } from "suncalc";
import * as turf from "@turf/turf";
import type { Position } from "geojson";

import type { LatLon, SunTimes } from "./common.types.js";
import type { XmetShapes } from "./alphanumeric.types.js";
import { MINUTE } from "./constants.js";

import { Relations } from "drizzle-orm";
import type { MySqlTableWithColumns } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm/sql";
import { createGunzip } from "zlib";
import { XMLParser } from "fast-xml-parser";
import type { Panel, RegionData, WmoDirection } from "./types.js";
import { OFFICE_REGION_MAP, OUTLOOK_NAV_DIR, OUTLOOK_ROOT_DIR } from "../config/charts.config.js";
import path from "path";
import { existsSync, readdirSync, statSync } from "fs";

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

  let output;

  switch (shape) {
    case "point":
      if (!bufferSize) return null;
      // buffer our point to create a circle
      const circle = turf.circle(coordsList[0], bufferSize, { steps: 24, units: "nauticalmiles" });

      // return the coordinates of the circle polygon
      output = circle.geometry.coordinates;
      break;
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

      output = polygon.geometry.coordinates;

      break;
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
          output = [[...coordsList, coordsList[0]]];
          break;
        }

        // if we have more than 3 points, check if the first and last points are the same
        if (firstAndLastAreSame(coordsList)) {
          // if they are the same, return the coordsList as is because this should be a valid polygon
          output = [coordsList];
        } else {
          // if not, add the first point to the end of the list to close the polygon
          output = [[...coordsList, coordsList[0]]];
        }
      }
      break;
  }

  return output as Position[][];
}

export function firstAndLastAreSame(coords: Position[]) {
  return coords[0][0] === coords[coords.length - 1][0] && coords[0][1] === coords[coords.length - 1][1];
}

export function computeCoordinates(
  shape: string,
  bufferSize: number | undefined,
  coordinates?: LatLon[] | undefined,
): LatLon[] | undefined {
  // console.log("computing coordinates for", shape, bufferSize, coordinateTimes);

  if (shape === "Canceled") return undefined;

  if (shape !== "Canceled" && !coordinates) return undefined;

  // convert bufferSize from NM into decimal degrees
  // 60 NM = 1 degree of latitude
  // we can also use a more complicated conversion involving longitude but for now this is fine
  const buffer = (bufferSize && bufferSize / 60) || 1;

  switch (shape) {
    case "circle":
      // use turf to calculate points on a circle depending on its radius and a default precision
      break;
    case "line_corridor":
      // a line_corridor has a minimum of 2 points, up to a maximum of 9(?)
      // calculate the normals for the line, and use that to calculate the outline of the polygon
      // check the tangent at the point and then calculate the normal of the tangent itself

      const output: LatLon[] = [];

      if (coordinates) {
        coordinates.forEach((point, index) => {
          const current = point; // the current point we're working with
          const next = coordinates[(index + 1) % coordinates.length]; // the next point in the sequence, or the first point

          let normal: LatLon;

          // the first and last points will calculate their normals based on the current and next/previous points
          //   but if we have three or more points, we have to calculate the tangent
          if (index === 0) {
            normal = computeNormalVector(current, next);
          } else if (index === coordinates.length - 1) {
            normal = computeNormalVector(next, current);
          } else {
            const tangent = computeTangentVector(coordinates[index - 1], current, next);
            normal = { lat: -tangent.lon, lon: tangent.lat };
          }

          output.push(
            { lat: current.lat + normal.lat * buffer, lon: current.lon + normal.lon * buffer },
            { lat: current.lat - normal.lat * buffer, lon: current.lon - normal.lon * buffer },
          );
        });
      }
      return output;
  }
}

// given two points, calculate the normal (perpendicular) to the line segment
function computeNormalVector(p1: LatLon, p2: LatLon): LatLon {
  // calculate the slope of the line between the two points
  const dLon = p2.lon - p1.lon;
  const dLat = p2.lat - p1.lat;

  // channel your inner pythagoras
  const length = Math.sqrt(dLon * dLon + dLat * dLat);

  return { lat: -dLon / length, lon: dLat / length };
}

// given three points, calculate the tangent at the second point
function computeTangentVector(p1: LatLon, p2: LatLon, p3: LatLon): LatLon {
  // calculate the vector from p1-p2, and p2-p3
  const v1 = { lat: p2.lat - p1.lat, lon: p2.lon - p1.lon };
  const v2 = { lat: p3.lat - p2.lat, lon: p3.lon - p2.lon };

  // normalize our tangent vectors (pythagoras part 2, electric boogaloo)
  const l1 = Math.sqrt(v1.lat * v1.lat + v1.lon * v1.lon);
  const l2 = Math.sqrt(v2.lat * v2.lat + v2.lon * v2.lon);

  const v1n = { lat: v1.lat / l1, lon: v1.lon / l1 };
  const v2n = { lat: v2.lat / l2, lon: v2.lon / l2 };

  // use the average of the two tangents to calculate our final point to output
  const tangent = { lat: (v1n.lat + v2n.lat) / 2, lon: (v1n.lon + v2n.lon) / 2 };
  const length = Math.sqrt(tangent.lat * tangent.lat + tangent.lon * tangent.lon);

  // return the length-normalized tangent
  return { lat: tangent.lat / length, lon: tangent.lon / length };
}

export function isConvectiveSigmet(header: string): boolean {
  return header.includes("WSUS3");
}

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
    const arrayBuffer = await fetch(url).then((res) => {
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

export function outlookHandler(product: string): Record<string, Record<string, RegionData>> | null {
  const result: Record<string, Record<string, RegionData>> = {};
  const dirPath = path.join(OUTLOOK_ROOT_DIR, product, "today");
  console.log("[API] Loading", product, "charts");

  if (!existsSync(dirPath)) {
    console.warn(`[API] ${product} directory does not exist at path: ${dirPath}`);
    return {};
  }

  const officeDir = readdirSync(dirPath, { withFileTypes: true, recursive: true });
  for (const entry of officeDir) {
    if (entry.isFile()) {
      const [, office, region, valid] =
        entry.name.match(/([a-zA-Z]+)(?:\-)([0-9a-zA-z\_]+)(?:\-)([0-9a-zA-z\_]+)/) || [];
      const officeKey = office.toLowerCase() as keyof typeof OFFICE_REGION_MAP;
      const regionKey = region.toLowerCase() as keyof (typeof OFFICE_REGION_MAP)[typeof officeKey];

      if (office && region && valid) {
        const stats = statSync(path.join(entry.parentPath, entry.name));
        // Create the panel object
        const panel: Panel = {
          id: entry.name,
          name: OFFICE_REGION_MAP[officeKey][regionKey] || region,
          date: stats.mtime.toUTCString(),
          product: product,
          office,
          region,
          valid,
          url: `${OUTLOOK_NAV_DIR}/swo/today/${office}/${entry.name}`,
        };

        // Initialize office if it doesn't exist
        if (!result[office]) {
          result[office] = {};
        }

        // Add or update region data
        if (result[office][region]) {
          result[office][region].panels.push(panel);
        } else {
          result[office][region] = {
            office,
            id: region,
            name: OFFICE_REGION_MAP[officeKey][regionKey] || region,
            panels: [panel],
          };
        }
      }
    }
  }
  return result;
}
