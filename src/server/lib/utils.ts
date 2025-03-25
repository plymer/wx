import suncalc, { GetTimesResult } from "suncalc";
import * as turf from "@turf/turf";
import { LatLon, SunTimes } from "./common.types.js";

export const FEET_PER_METRE = 3.28084;
export const HOUR = 3_600_000;
export const MINUTE = 60_000;

export function injectViteDevServer(fileContents: string): string {
  var output = fileContents.replace(
    "<head>",
    `
  <script type="module">
import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>

  <script type="module" src="/@vite/client"></script>
  `
  );
  return output;
}

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
export function transformName(name: string) {
  // if we don't have a dash, return the name as is
  if (!name.includes("-") || !name.includes("#")) return name;

  // otherwise, lets find the location of the dash and then capitalize the letter after it, and then strip out the dash
  const index = name.indexOf("-") || name.indexOf("#");
  const output = name.slice(0, index) + name.charAt(index + 1).toUpperCase() + name.slice(index + 2);

  // call this recursively to handle multiple dashes
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
 * @param dir a string representing a cardinal direction, such as "N" or "SSW", or a "-"" for no direction
 * @returns a number representing the direction in degrees, such as 0 or 202.5
 */
export function cardinalToDegrees(dir: string): number {
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
 *
 * @param shape the string representing the type of shape defined in the database
 * @param bufferSize the size of the resulting feature, as a radius or width from a central point or line
 * @param coords the input coordinates in the format of [[lon, lat], [lon, lat], ...]
 * @returns a Position object that contains the coordinates of the resulting shape, formatted for injection into a GeoJSON object
 */
export function processCoordinates(shape: string, bufferSize: number, coords: number[][]) {
  if (shape === "Canceled") return undefined;

  let output;

  switch (shape) {
    case "circle":
      // buffer our point to create a circle
      const circle = turf.circle(coords[0], bufferSize, { steps: 24, units: "nauticalmiles" });

      // return the coordinates of the circle polygon
      output = circle.geometry.coordinates;
      break;
    case "line_corridor":
      // we need to build two line offsets from the original line, and then weld them back together into a polygon
      // there should end up being 2n + 1 points in the output polygon, where n is the number of points in the input line
      const offsetA = turf.lineOffset(turf.lineString(coords), bufferSize, { units: "nauticalmiles" });
      const offsetB = turf.lineOffset(turf.lineString(coords), -bufferSize, { units: "nauticalmiles" });

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
    case "closed_polygon":
      if (coords.length < 4) {
        throw new Error("A closed polygon must have at least 4 points");
      } else {
        output = [coords];
      }
      break;
  }

  return output;
}

export function computeCoordinates(
  shape: string,
  bufferSize: number | undefined,
  coordinates?: LatLon[] | undefined
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

      let output: LatLon[] = [];

      coordinates &&
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
            { lat: current.lat - normal.lat * buffer, lon: current.lon - normal.lon * buffer }
          );
        });
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
