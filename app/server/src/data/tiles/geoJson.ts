import type { Categories, PlotData, TiledSurfacePlotData, Wind } from "./types.js";

import type { fetchSurfaceData } from "../vector-tiles.js";

// export function generatePirepGeoJson(data: Prettify<InferSelectModel<typeof pireps>>[]): Feature[] {
//   const output = data.map((pirep) => {
//     const { lon, lat, issueTime, validTime, aircraftType, flightLevel, turbulence, icing, ws, ...pirepProps } = pirep;
//     const validTimeObject = validTime ? new Date(validTime) : null;

//     const iTime = issueTime ? new Date(issueTime).getTime() : null;
//     const vTime = validTimeObject ? validTimeObject.getTime() : null;
//     const startTime = vTime !== null ? Math.floor(vTime / (10 * MINUTE)) * 10 * MINUTE : null;
//     const expiryTime = vTime !== null ? vTime + 1.5 * HOUR : null;
//     const wakeTurbClass = getWakeTurbulenceClass(aircraftType);

//     const severity = calculateSeverity(
//       turbulence as Uppercase<PirepSeverity> | null,
//       icing as Uppercase<PirepSeverity> | null,
//       ws ?? false,
//     );
//     const SEVERITY_RANK: Record<PirepSeverity, number> = {
//       none: 0,
//       lgt: 1,
//       mod: 2,
//       sev: 3,
//     };

//     return {
//       type: "Feature",
//       geometry: {
//         coordinates: [lon, lat],
//         type: "Point",
//       },
//       properties: {
//         ...pirepProps,
//         flightLevel: flightLevel !== null ? flightLevel.toString().padStart(3, "0") : "999",
//         issueTime: iTime,
//         validTime: vTime,
//         startTime,
//         timeString: validTimeObject
//           ? `${validTimeObject.getUTCHours().toString().padStart(2, "0")}:${validTimeObject.getUTCMinutes().toString().padStart(2, "0")}`
//           : null,
//         expiryTime,
//         wakeTurbClass,
//         severity,
//         severityRank: SEVERITY_RANK[severity] ?? 0,
//         dataType: "pirep",
//       },
//     } as Feature<Point>;
//   });

//   return output;
// }

export function generateTimeseriesGeoJson(data: Awaited<ReturnType<typeof fetchSurfaceData>>): TiledSurfacePlotData[] {
  const output = data
    .map((ob) => {
      if (!ob.siteId || ob.lat === null || ob.lon === null) {
        console.warn(`Skipping observation with missing siteId or coordinates: ${JSON.stringify(ob)}`);
        return null; // Skip this observation
      }

      const cat = ob.category;
      const wind: Wind = formatWind(ob.windDir, ob.windSpd, ob.windGst);

      const timeString = `${new Date(ob.validTime).getUTCHours().toString().padStart(2, "0")}:${new Date(ob.validTime).getUTCMinutes().toString().padStart(2, "0")}`;

      // wind speed = 0 then set to zero
      // wind speed > 0 and <= 5 then set to 5
      // wind speed > 5 then round to nearest 5

      const binnedWindSpd =
        wind.speed !== null ? (wind.speed === 0 ? 0 : wind.speed <= 5 ? 5 : Math.round(wind.speed / 5) * 5) : null;
      const binnedWindDir =
        wind.dir !== null
          ? binnedWindSpd !== null && binnedWindSpd !== 0
            ? Math.round(wind.dir / 10) * 10
            : binnedWindSpd === 0
              ? 0
              : null
          : null;

      const parsedMetar: PlotData = {
        windDir: wind.dir,
        binnedWindDir: binnedWindDir === 360 ? 0 : binnedWindDir,
        windSpd: wind.speed,
        binnedWindSpd,
        windGst: wind.gust,
        cat: (cat as Categories | null) ?? "none",
        vis: ob.vis,
        wx: ob.wxString ?? "",
        tt: ob.tt,
        td: ob.td,
        mslp: ob.mslp,
        timeString,
        validTime: new Date(ob.validTime).getTime(),
      };

      const newFeature: TiledSurfacePlotData = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [ob.lon, ob.lat],
        },
        properties: {
          siteId: ob.siteId,

          ...parsedMetar,
        },
      };

      return newFeature;
    })
    .filter((feature): feature is TiledSurfacePlotData => feature !== null);

  return output;
}

export function calculateFlightCategory(vis: number | undefined | null, cig: number | undefined | null): Categories {
  const ceiling = cig !== null && cig !== undefined ? cig : null;
  const visibility = vis !== null && vis !== undefined ? vis : null;

  const thresholds = { lifr: { vis: 0.5, cig: 400 }, ifr: { vis: 3, cig: 1000 }, mvfr: { vis: 6, cig: 2500 } };

  if (visibility === null && ceiling !== null) {
    if (ceiling < thresholds.lifr.cig) return "lifr";
    else if (ceiling < thresholds.ifr.cig) return "ifr";
    else if (ceiling < thresholds.mvfr.cig) return "mvfr";
    else return "vfr";
  } else if (ceiling === null && visibility !== null) {
    if (visibility < thresholds.lifr.vis) return "lifr";
    else if (visibility < thresholds.ifr.vis) return "ifr";
    else if (visibility < thresholds.mvfr.vis) return "mvfr";
    else return "vfr";
  } else if (visibility !== null && ceiling !== null) {
    if (visibility < thresholds.lifr.vis || ceiling < thresholds.lifr.cig) return "lifr";
    else if (visibility < thresholds.ifr.vis || ceiling < thresholds.ifr.cig) return "ifr";
    else if (visibility < thresholds.mvfr.vis || ceiling < thresholds.mvfr.cig) return "mvfr";
    else return "vfr";
  } else {
    return "none";
  }
}

export function formatWind(windDir: number | null, windSpd: number | null, windGst: number | null): Wind {
  const nullWind: Wind = {
    raw: null,
    dir: null,
    speed: null,
    gust: null,
  };
  const output: Wind = { ...nullWind };

  Object.assign(output, { dir: windDir === 0 && windSpd !== 0 ? 360 : windDir });
  Object.assign(output, { speed: windSpd });

  // Make sure at least one of dir or speed is not null
  if (output.dir === null && output.speed === null) return nullWind;

  Object.assign(output, { gust: windGst });

  let speedStr: string | null = null;
  let gustStr: string | null = null;

  // Format speed and gust
  if (output.speed !== null)
    speedStr = output.speed > 99 ? output.speed.toString() : output.speed.toString().padStart(2, "0"); // Special 3 digit format if > 99kts otherwise 2 digit
  if (output.gust !== null)
    gustStr = output.gust > 99 ? output.gust.toString() : output.gust.toString().padStart(2, "0");

  const raw = `${output.dir === null ? "///" : output.dir === 999 ? "VRB" : output.dir.toString().padStart(3, "0")}${speedStr === null ? "//" : speedStr}${gustStr === null ? "KT" : `G${gustStr}KT`}`;

  Object.assign(output, { raw });

  return output;
}

export function isConvectiveSigmet(header: string): boolean {
  return header.includes("WSUS3");
}

// export function getWakeTurbulenceClass(aircraftType: string | null | undefined): WakeTurbClass | "UNKN" {
//   if (!aircraftType) return "UNKN";

//   const type = aircraftType.toLowerCase().trim();

//   if (SUPER_AIRCRAFT_TYPES.includes(type)) return "J";
//   if (HEAVY_AIRCRAFT_TYPES.includes(type)) return "H";
//   if (MEDIUM_AIRCRAFT_TYPES.includes(type)) return "M";
//   if (LIGHT_AIRCRAFT_TYPES.includes(type)) return "L";
//   return "UNKN";
// }

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
