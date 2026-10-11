import type { Feature, FeatureCollection, LineString, Point, Polygon, Position } from "geojson";
import * as turf from "@turf/turf";
import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";
import { etagCheckin } from "../lib/etag.js";
import { cacheClient } from "../services/redis.js";
import { HURRICANE_CACHE_KEY } from "../config/cache-keys.config.js";
import type { DataProcessResult } from "../lib/types.js";

type NhcBasin = "EP" | "AL" | "CP";

type NhcTrackLineProps = {
  stylstyleUrl: string;
  styleHash: string;
  description: string;
  stroke: string;
  "stroke-opacity": number;
  "stroke-width": number;
  fill: string;
  "fill-opacity": number;
  timezone: string;
  stormType: Uppercase<StormType>;
  basin: NhcBasin;
  fcstpd: string;
  storm: string;
  atcfid: string;
  advisoryNum: string;
  stormNum: string;
  stormName: string;
  pubAdvTime: string;
  TCInitLocation: string;
  maxWindKnots: string;
  maxWindMPH: string;
  maxGustKnots: string;
  maxGustMPH: string;
  stormMovement: string;
  minimumPressure: string;
};

type NhcTrackPointProps = {
  styleUrl: string;
  styleHash: string;
  icon: string;
  description: string;
};

type NhcConePolygonProps = {
  styleUrl: string;
  styleHash: string;
  stroke: string;
  "stroke-opacity": number;
  "stroke-width": number;
  fill: string;
  "fill-opacity": number;
  timezone: string;
  stormType: Uppercase<StormType>;
  advisoryDate: string;
  basin: NhcBasin;
  fcstpd: string;
  storm: string;
  atcfid: string;
  advisoryNum: string;
  stormNum: string;
  stormName: string;
};

type StormType = "POST-TROPICAL" | "DEPRESSION" | "STORM" | "HURRICANE" | "REMNANT";

type ParsedTrackPointProps = {
  metobject: { sub_type: StormType; max_wind: { value: number } };
  storm_name: string;
  category: number | undefined;
  forecast_datetime: Date;
  type: "cyclone";
};

function getStormClass(
  stormCode: string,
  text: string,
  windSpeed: number,
): { name: string | undefined; stormType: StormType | undefined; category: number | undefined } {
  const name = text.replace(`(${stormCode})`, "").trim().split(" ").pop()?.toUpperCase();

  if (!name) return { name: undefined, stormType: undefined, category: undefined };

  if (windSpeed < 35) {
    return {
      name,
      stormType: "DEPRESSION",
      category: undefined,
    };
  }
  if (windSpeed >= 35 && windSpeed < 64) {
    return {
      name,
      stormType: text.includes("Post-Tropical Cyclone") ? "POST-TROPICAL" : "STORM",
      category: undefined,
    };
  }

  if (windSpeed >= 64)
    return {
      name,
      stormType: "HURRICANE",
      category: windSpeed < 82 ? 1 : windSpeed < 95 ? 2 : windSpeed < 112 ? 3 : windSpeed < 136 ? 4 : 5,
    };

  return { name, stormType: "REMNANT", category: undefined };
}

function ensure2DPosition(coordinates: Position) {
  return [coordinates[0], coordinates[1]];
}

export async function getHurricaneData(): Promise<DataProcessResult> {
  const cacheKey = `${HURRICANE_CACHE_KEY}:pacific:all`;
  const expiryTime = 60 * 60 * 6; // 6 hours

  // first, get all of the current storms that have data that was updated within the last 12 hours

  const baseUrl = "https://www.nhc.noaa.gov/storm_graphics";
  const url = `${baseUrl}/?C=M;O=D`;

  try {
    const hurricaneDataArchive = await fetch(url).then((res) => res.text());

    const table = hurricaneDataArchive
      .replace(/\s{2,}/g, " ")
      .replace(/\n/g, " ")
      .replace(/>\s</g, "><")
      .match(/(<table>.*<\/table>)/g);

    const rows = table
      ? table[0]
          .split("<tr>")
          .map((row, idx) => {
            if (idx >= 3) {
              const cols = row.replace("</tr>", "").split("</td>");

              if (cols && cols[1] !== undefined && cols[2] !== undefined) {
                const [_, stormNumber, lastUpdated] = cols;

                const storm = stormNumber.match(/\w{2}\d{2}/);
                const updated = lastUpdated.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/);

                if (storm && updated)
                  return { storm: storm[0], updated: new Date(`${updated[0].replace(" ", "T")}:00.000Z`) };
              }
            }
            6;
          })
          .filter(
            (r): r is { storm: string; updated: Date } =>
              r !== undefined && r.updated.getTime() + 12 * HOUR > Date.now(),
          )
      : [];

    // our rows now contain which storms we can get data for

    const filesToGet = {
      track: "_TRACK_latest.geojson",
      error_cone: "_CONE_latest.geojson",
      // wind_radii: "_initialradii_latest.geojson",
    };

    const outputData: FeatureCollection = { type: "FeatureCollection", features: [] };

    for (const row of rows) {
      // for atlantic storms (AT) we're going to continue to use the ECCC API as the source since
      // idk how the NHC handles Canadian-lead storms

      if (row.storm.includes("AT")) continue;

      const stormNumber = row.storm.includes("AT") ? row.storm.replace("T", "L") : row.storm;
      const year = row.updated.getUTCFullYear();
      const stormCode = `${stormNumber}${year}`;
      const trackUrl = `${baseUrl}/${row.storm}/${stormCode}${filesToGet.track}`;
      const coneUrl = `${baseUrl}/${row.storm}/${stormCode}${filesToGet.error_cone}`;
      // const windUrl = `${baseUrl}/${row.storm}/${stormCode}${filesToGet.wind_radii}`;

      const shouldUpdateTrack = await etagCheckin(trackUrl, `${stormCode}-track`);
      const shouldUpdateCone = await etagCheckin(coneUrl, `${stormCode}-cone`);
      // const shouldUpdateWind = (await etagCheckin(windUrl, `${stormCode}-wind`));

      if (shouldUpdateTrack || shouldUpdateCone) {
        const trackFeatures = (await fetch(trackUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
          res.json(),
        )) as FeatureCollection<LineString | Point>;

        // we want the 120-hour forecast track
        const trackLine = (
          trackFeatures.features.filter(
            (f) => f.geometry.type === "LineString" && f.geometry.coordinates.length > 1,
          ) as Feature<LineString, NhcTrackLineProps>[]
        ).find((f) => f.properties.fcstpd === "120") as
          Feature<LineString, { type: "track"; storm_name: string }> | undefined; // we're going to overwrite the properties

        if (trackLine) {
          trackLine.geometry.coordinates = trackLine.geometry.coordinates
            .map(ensure2DPosition)
            .filter((p): p is number[] => p !== null || p !== undefined);
          trackLine.properties = { type: "track", storm_name: "" };
        }

        const trackPoints: Feature<Point, ParsedTrackPointProps>[] = (
          trackFeatures.features.filter((f) => f.geometry.type === "Point") as Feature<Point, NhcTrackPointProps>[]
        )
          .map((f) => {
            const { properties, ...feature } = f;
            const baseDescription = properties.description
              .replaceAll("<table>", "")
              .replaceAll("</td></tr>", "")
              .split("\n");

            // i hate how fragile this is, but all of the metadata is stored in an html string
            const speed = parseInt(baseDescription[8].split("Maximum Wind:")[1].trim().split(" ")[0]);
            const { name, stormType, category } = getStormClass(
              stormCode,
              baseDescription[2].replace("</b></font>", "").split("<b>")[1].trim(),
              speed,
            );

            if (trackLine && name !== undefined) trackLine.properties.storm_name = name;

            const validTime = new Date(baseDescription[6].split("Valid at:")[1].trim());

            return {
              ...feature,
              properties: {
                type: "cyclone",
                metobject: { sub_type: stormType || "DEPRESSION", max_wind: { value: speed } },
                storm_name: name,
                category,
                forecast_datetime: validTime,
              },
              geometry: {
                ...feature.geometry,
                coordinates: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
              },
            };
          })
          .filter(
            (f): f is Feature<Point, ParsedTrackPointProps> =>
              f.properties.storm_name !== "" && f.properties.forecast_datetime.toString() !== "Invalid Date",
          );

        const stormNamePoint = trackLine ? turf.centerOfMass(trackLine) : undefined;

        if (stormNamePoint) {
          stormNamePoint.properties = { type: "name_point", storm_name: trackLine?.properties.storm_name };
        }

        if (trackLine)
          outputData.features.push(...[...trackPoints, trackLine, stormNamePoint].filter((f) => f !== undefined));

        const coneFeatures = (await fetch(coneUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
          res.json(),
        )) as FeatureCollection<Polygon, NhcConePolygonProps>;

        // each feature has a 3D position tuple for some reason so let's remove the z-coordinate
        const cone120HourPolygon = coneFeatures.features.find((f) => f.properties.fcstpd === "120");

        const conePolygon: Feature<Polygon, { type: "error_cone"; storm_name: string }> | undefined = cone120HourPolygon
          ? {
              ...cone120HourPolygon,
              geometry: {
                ...cone120HourPolygon.geometry,
                coordinates: [cone120HourPolygon.geometry.coordinates[0].map(ensure2DPosition)],
              },
              properties: { type: "error_cone", storm_name: cone120HourPolygon.properties.stormName },
            }
          : undefined;

        if (trackLine && conePolygon) outputData.features.push(conePolygon);
      } else {
        return { result: "skipped" };
      }
    }
    turf.simplify(outputData, { tolerance: 0.005, mutate: true });

    cacheClient.setEx(cacheKey, expiryTime, JSON.stringify(outputData));
    return { result: "success" };
  } catch (error) {
    console.error("Error updating Pacific Hurricane data:", (error as Error).stack);
    return { result: "error" };
  }
}
