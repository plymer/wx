import type { Feature, FeatureCollection, LineString, Point, Polygon, Position } from "geojson";
import * as turf from "@turf/turf";
import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";
import { etagCheckin } from "../lib/etag.js";

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

type StormType = "ptc" | "td" | "ts" | "hu";

type ParsedTrackPointProps = { name: string; type: StormType; validTime: Date; maxWindKt: number };

function getStormClass(stormCode: string, text: string): { name: string; type: StormType | undefined } {
  if (text.includes("Tropical Depression")) {
    return { name: text.replace("Tropical Depression", "").replace(`(${stormCode})`, "").trim(), type: "td" };
  }
  if (text.includes("Hurricane")) {
    return { name: text.replace("Hurricane", "").replace(`(${stormCode})`, "").trim(), type: "hu" };
  }
  if (text.includes("Post-Tropical Cyclone"))
    return { name: text.replace("Post-Tropical Cyclone", "").replace(`(${stormCode})`, "").trim(), type: "ptc" };
  if (text.includes("Tropical Storm"))
    return { name: text.replace("Tropical Storm", "").replace(`(${stormCode})`, "").trim(), type: "ts" };

  return { name: "", type: undefined };
}

function ensure2DPosition(coordinates: Position) {
  return [coordinates[0], coordinates[1]];
}

export async function getHurricaneData() {
  // first, get all of the current storms that have data that was updated within the last 12 hours

  const baseUrl = "https://www.nhc.noaa.gov/storm_graphics";
  const url = `${baseUrl}/?C=M;O=D`;

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
          (r): r is { storm: string; updated: Date } => r !== undefined && r.updated.getTime() + 12 * HOUR > Date.now(),
        )
    : [];

  // our rows now contain which storms we can get data for

  const filesToGet = {
    track: "_TRACK_latest.geojson",
    error_cone: "_CONE_latest.geojson",
    wind_radii: "_initialradii_latest.geojson",
  };

  console.log("Checking in on data for", rows.length, "storms:");

  const DEVING = true;

  for (const row of rows) {
    // for atlantic storms (AT) we're going to continue to use the ECCC API as the source since
    // idk how the NHC handles Canadian-lead storms

    if (row.storm.includes("AT")) continue;

    const stormNumber = row.storm.includes("AT") ? row.storm.replace("T", "L") : row.storm;
    const year = row.updated.getUTCFullYear();
    const stormCode = `${stormNumber}${year}`;
    const trackUrl = `${baseUrl}/${row.storm}/${stormCode}${filesToGet.track}`;
    const coneUrl = `${baseUrl}/${row.storm}/${stormCode}${filesToGet.error_cone}`;
    const windUrl = `${baseUrl}/${row.storm}/${stormCode}${filesToGet.wind_radii}`;

    const shouldUpdateTrack = DEVING ?? (await etagCheckin(trackUrl, `${stormCode}-track`));
    const shouldUpdateCone = DEVING ?? (await etagCheckin(coneUrl, `${stormCode}-cone`));
    const shouldUpdateWind = DEVING ?? (await etagCheckin(windUrl, `${stormCode}-wind`));

    const trackData: FeatureCollection = { type: "FeatureCollection", features: [] };
    const coneData: FeatureCollection = { type: "FeatureCollection", features: [] };
    const windData: FeatureCollection = { type: "FeatureCollection", features: [] };

    if (shouldUpdateTrack) {
      const trackFeatures = (await fetch(trackUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
        res.json(),
      )) as FeatureCollection<LineString | Point>;

      // we want the 120-hour forecast track
      const trackLine = (
        trackFeatures.features.filter((f) => f.geometry.type === "LineString") as Feature<
          LineString,
          NhcTrackLineProps
        >[]
      ).find((f) => f.properties.fcstpd === "120");

      if (trackLine) {
        trackLine.geometry.coordinates = trackLine.geometry.coordinates
          .map(ensure2DPosition)
          .filter((p): p is number[] => p !== null || p !== undefined);
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
          const { name, type } = getStormClass(
            stormCode,
            baseDescription[2].replace("</b></font>", "").split("<b>")[1].trim(),
          );
          const validTime = new Date(baseDescription[6].split("Valid at:")[1].trim());
          const maxWindKt = parseInt(baseDescription[8].split("Maximum Wind:")[1].trim().split(" ")[0]);

          return {
            ...feature,
            properties: { name, type, validTime, maxWindKt },
            geometry: {
              ...feature.geometry,
              coordinates: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
            },
          };
        })
        .filter(
          (f): f is Feature<Point, ParsedTrackPointProps> =>
            f.properties.name !== "" && f.properties.validTime.toString() !== "Invalid Date",
        );

      if (trackLine) trackData.features.push(...[...trackPoints, trackLine]);
    }

    if (shouldUpdateCone) {
      const coneFeatures = (await fetch(coneUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
        res.json(),
      )) as FeatureCollection<Polygon, NhcConePolygonProps>;

      // each feature has a 3D position tuple for some reason so let's remove the z-coordinate
      const cone120HourPolygon = coneFeatures.features.find((f) => f.properties.fcstpd === "120");

      const conePolygon: Feature<Polygon> | undefined = cone120HourPolygon
        ? {
            ...cone120HourPolygon,
            geometry: {
              ...cone120HourPolygon.geometry,
              coordinates: [cone120HourPolygon.geometry.coordinates[0].map(ensure2DPosition)],
            },
          }
        : undefined;

      if (conePolygon) coneData.features.push(conePolygon);
    }

    turf.simplify(coneData, { tolerance: 0.005, mutate: true });
    turf.simplify(trackData, { tolerance: 0.005, mutate: true });
    console.log(JSON.stringify({ trackData, coneData, windData }, null, 2));
  }
}

getHurricaneData();
