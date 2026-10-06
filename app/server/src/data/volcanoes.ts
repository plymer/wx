import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";
import { type InferInsertModel, sql } from "drizzle-orm";
import { pgDb } from "../services/database.js";
import { volcanoCodes, volcanoFVMessageGeometries, volcanoFVMessages } from "../db/schemas.drizzle.js";
import type { DataProcessResult } from "../lib/types.js";
import { fixAntimeridianCrossings, lonLatToWebMercator } from "../lib/utils.js";
import type { FeatureCollection } from "geojson";

type VolcanoColorCodes = "UNASSIGNED" | "GREEN" | "YELLOW" | "ORANGE" | "RED";
type VolcanoAlertCodes = "UNASSIGNED" | "NORMAL" | "ADVISORY" | "WATCH" | "WARNING";

type DomesticVolcano = {
  id: string;
  img: string;
  desc: string;
  name: string;
  color: VolcanoColorCodes;
  alert: VolcanoAlertCodes;
  lat: string;
  lng: string;
  ft: number;
  m: null;
  webicorders: string[];
  curact?: string;
};

type InternationalVolcano = {
  id: string;
  name: string;
  lat: string;
  lng: string;
  color: VolcanoColorCodes;
  url?: string;
};

type VolcanoJsonResponse = {
  unmonitored: DomesticVolcano[];
  monitored: DomesticVolcano[];
  kuriles: InternationalVolcano[];
  russian: InternationalVolcano[];
};

type VolcanoData = InferInsertModel<typeof volcanoCodes>;

type ApiVolcanoResponseProps = {
  identifier: string;
  datetime: string;
  type: "FV";
  ttaaii: string;
  issuer_code: string;
  issuer_name: null;
  issuer_country: null;
  issuing_office: string;
  url: string;
};

function parseCloudText(text: string | undefined) {
  if (text === undefined || text === "NO VA EXP" || text.includes("NOT")) return undefined;

  const levelString = text.match(/(SFC|\d{2,3})\/FL\d{2,3}/g)?.[0];
  if (!levelString) return undefined;
  const levels = levelString?.split("/");

  const levelStringIndex = text.indexOf(levelString);
  const timeString = levelStringIndex === 0 ? undefined : text.slice(0, levelStringIndex).trim();

  const points = text
    .slice(levelStringIndex)
    .replace(/.+(SFC|\d{2,3})\/FL\d{2,3}\s/g, "")
    .replace("\\n", " ")
    .trim()
    .split(/\\n-\s|\s-\s|\s-\\n/g);

  if (!points) return undefined;

  const decimalDegreeCoords = points
    .map((p) => {
      const [latString, lngString] = p
        .replace(/[\n\\n]/g, " ")
        .split(" ")
        .filter((t) => t.match(/[NSEW]\d{4,5}/g));

      if (!latString || !lngString) return undefined;

      const lngDecimal = parseInt(lngString.slice(1, 4)) + parseInt(lngString.slice(4)) / 60;
      const latDecimal = parseInt(latString.slice(1, 3)) + parseInt(latString.slice(3)) / 60;

      const lng = lngString[0] === "E" ? lngDecimal : -1 * lngDecimal;
      const lat = latString[0] === "N" ? latDecimal : -1 * latDecimal;

      return [lng, lat];
    })
    .filter((coord): coord is [number, number] => coord !== undefined);

  const coordinates = fixAntimeridianCrossings(decimalDegreeCoords).map((p) => {
    const [lng, lat] = p;

    const { x, y } = lonLatToWebMercator(lng, lat);

    return `${x} ${y}`;
  });

  if (coordinates.length < 3) return undefined;
  if (coordinates[0] !== coordinates[coordinates.length - 1]) coordinates.push(coordinates[0]);

  // we need to ensure that any antimeridian-crossing is handled by making things 'superwest' (making their east-coords become west aka less than -180)

  const pointsWkt = `POLYGON((${coordinates.join(", ")}))`;

  return { bottom: levels?.[0], top: levels?.[1], pointsWkt, timeString };
}

function parseClouds({
  obsCld,
  t6Cld,
  t12Cld,
  t18Cld,
}: {
  obsCld: string | undefined;
  t6Cld: string | undefined;
  t12Cld: string | undefined;
  t18Cld: string | undefined;
}) {
  return {
    obs: parseCloudText(obsCld),
    t6: parseCloudText(t6Cld),
    t12: parseCloudText(t12Cld),
    t18: parseCloudText(t18Cld),
  };
}

export async function getVolcanoStatus(): Promise<DataProcessResult> {
  if (!pgDb) return { result: "error" };

  const vaacJsonUrl = "https://www.weather.gov/source/vaac/vaac.json";

  try {
    const response = (await fetch(vaacJsonUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
      res.json(),
    )) as VolcanoJsonResponse;

    const data: VolcanoData[] = [];

    Object.entries(response).forEach(([_, volcanoes]) => {
      volcanoes
        .filter((v) => v.name !== null)
        .forEach((v) => {
          if (Object.hasOwn(v, "ft")) {
            const volc = v as DomesticVolcano;
            const { lng, lat, name, alert, color } = volc;
            const { x, y } = lonLatToWebMercator(parseFloat(lng), parseFloat(lat));

            data.push({
              name: name,
              alertLevel: alert.toLowerCase() as Lowercase<VolcanoAlertCodes>,
              geometry: `POINT(${x} ${y})`,
              colour: color.toLowerCase() as Lowercase<VolcanoColorCodes>,
            });
          } else {
            const volc = v as InternationalVolcano;
            const { lng, lat, name, color } = volc;
            const { x, y } = lonLatToWebMercator(parseFloat(lng), parseFloat(lat));
            data.push({
              name: name,
              alertLevel: undefined,
              geometry: `POINT(${x} ${y})`,
              colour: color.toLowerCase() as Lowercase<VolcanoColorCodes>,
            });
          }
        });
    });

    // dedupe volcanoes
    const uniqueData = [...new Map(data.map((row) => [row.name, row])).values()];

    await pgDb
      .insert(volcanoCodes)
      .values(uniqueData)
      .onConflictDoUpdate({
        target: volcanoCodes.name,
        set: { alertLevel: sql`excluded.alert_level`, colour: sql`excluded.colour` },
      });

    return { result: "success" };
  } catch (error) {
    console.error(`Error updating volcano data: ${(error as Error).message}`);
    return { result: "error" };
  }
}

export async function getFVMessages(): Promise<DataProcessResult> {
  if (!pgDb) return { result: "error" };

  try {
    // check alaska, canada, japan, washington
    const vaacList = ["PAWU", "CWAO", "RJTD", "KNES"];

    const currentMessages = await pgDb.query.volcanoFVMessages.findMany().then((qr) => qr.map((r) => r.id));

    const bulletinUrls = new Set<string>();
    const payload: {
      messages: InferInsertModel<typeof volcanoFVMessages>[];
      geometries: InferInsertModel<typeof volcanoFVMessageGeometries>[];
    } = { messages: [], geometries: [] };

    // check in on the current list of bulletins
    for (const vaac of vaacList) {
      const url = `https://api.weather.gc.ca/collections/bulletins-realtime/items?lang=en&limit=10&offset=0&sortby=-datetime&type=FV&issuer_code=${vaac}&f=json`;

      const response = (await fetch(url, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
        res.json(),
      )) as FeatureCollection<null, ApiVolcanoResponseProps>;

      const filteredFeatures = response.features
        .map((f) => ({ id: f.properties.identifier, url: f.properties.url }))
        .filter((f) => {
          // id is like this: 20260909.FV.CWAO.14.FVCN01_CWAO_091418___5962 so grab the last part since that's what in the URL we're using as our source of id
          const normalizedId = f.id.split(".").pop();

          if (!normalizedId) return false;
          else return !currentMessages.includes(normalizedId);
        });

      filteredFeatures.forEach((f) => bulletinUrls.add(f.url));
    }

    // now grab the data from each of the bulletins that need to be added to the database
    for (const url of bulletinUrls) {
      // if (bulletinUrls.indexOf(url) !== bulletinUrls.length - 1) continue;
      const fvText = JSON.stringify(await fetch(url, { headers: DEFAULT_REMOTE_HEADERS }).then((res) => res.text()));

      const urlParts = url.split("/");
      const id = urlParts[urlParts.length - 1];

      const bulletin = fvText.slice(1, 7);

      const vaacName = fvText.match(/VAAC:\s[A-Z ]+/g)?.[0].replace("VAAC: ", "");

      const datetimeMatch = fvText
        .match(/DTG:\s\d{8}\/\d{4}Z/g)?.[0]
        .replace("DTG: ", "")
        .matchAll(/(\d{4})(\d{2})(\d{2})\/(\d{2})(\d{2})/g);

      const [_, year, month, day, hour, minute] = datetimeMatch?.next().value || [];

      const datetime = new Date(`${year}-${month}-${day}T${hour}:${minute}:00.000Z`);

      const volcano = fvText
        .match(/(VOLCANO:\s.+)/g)?.[0]
        .split("\\n")[0]
        .replace("VOLCANO: ", "");

      const volcanoName = volcano?.match(/[A-Z ()]+/g)?.[0].trim();
      const volcanoNumber = volcano?.match(/[0-9]+/g)?.[0].trim();

      if (volcanoName === undefined || volcanoNumber === undefined) {
        console.warn("No volcano Name/Number matched in string: '" + volcano + "'" + "\nURL: " + url);
        continue;
      }

      const area = fvText
        .match(/AREA:\s([A-Z ]+)/g)?.[0]
        .trim()
        .replace("AREA: ", "");

      const infoSource = fvText
        .match(/INFO SOURCE:\s[A-Z0-9\-\s.]+/g)?.[0]
        .replace("INFO SOURCE: ", "")
        .trim();

      const eruptionDetails = fvText
        .match(/ERUPTION DETAILS:\s[A-Z0-9/\s]+/g)?.[0]
        .replace("ERUPTION DETAILS: ", "")
        .trim();

      const obsDate = fvText
        .match(/(OBS|EST) VA DTG:\s(\d{2}\/\d{4}Z)/g)?.[0]
        .replace(/(OBS|EST) VA DTG:\s/, "")
        .trim();

      const obsCld = fvText
        .match(/(OBS|EST) VA CLD:\s[A-Z0-9/\s\\n-]+(MOV)?/g)?.[0]
        .replace(/(OBS|EST) VA CLD:\s/g, "")
        .replace(/\sMOV.+/g, "")
        .trim();

      const t6Cld = fvText
        .match(/FCST VA CLD \+6HR:\s[A-Z0-9/\s\\n-]+(MOV)?/g)?.[0]
        .replace(/FCST VA CLD \+6HR:\s/g, "")
        .replace(/\sMOV.+/g, "")
        .trim();
      const t12Cld = fvText
        .match(/FCST VA CLD \+12HR:\s[A-Z0-9/\s\\n-]+(MOV)?/g)?.[0]
        .replace(/FCST VA CLD \+12HR:\s/g, "")
        .replace(/\sMOV.+/g, "")
        .trim();

      const t18Cld = fvText
        .match(/FCST VA CLD \+18HR:\s[A-Z0-9/\s\\n-]+(MOV)?/g)?.[0]
        .replace(/FCST VA CLD \+18HR:\s/g, "")
        .replace(/\sMOV.+/g, "")
        .trim();

      const rmk = fvText
        .match(/RMK:\s[A-Z0-9\s.\\n\-+]+/g)?.[0]
        .split("\\nNXT")[0]
        .replace("RMK: ", "")
        .replaceAll("\\n", " ")
        .trim();

      const nextAdvisory = fvText.match(/NXT ADVISORY:\s[A-Z0-9\s/]+/g)?.[0].replace("NXT ADVISORY: ", "");

      const vaCloudData = parseClouds({ obsCld, t6Cld, t12Cld, t18Cld });

      payload.messages.push({
        bulletin,
        datetime,
        id,
        volcanoName,
        volcanoNumber: parseInt(volcanoNumber),
        area,
        eruptionDetails,
        nextAdvisory,
        infoSource,
        rmk,
        vaac: vaacName,
      });

      Object.values(vaCloudData).forEach((data) =>
        payload.geometries.push({
          datetime,
          id,
          volcanoName,
          volcanoNumber: parseInt(volcanoNumber),
          flBase: data?.bottom,
          flTop: data?.top,
          geometry: data?.pointsWkt,
          validTimeString: data?.timeString ? data.timeString : obsDate,
        }),
      );
    }

    // now insert our data as one transaction

    await pgDb.transaction(async (tx) => {
      if (payload.messages.length > 0)
        await tx.insert(volcanoFVMessages).values(payload.messages).onConflictDoNothing();
      if (payload.geometries.length > 0)
        await tx
          .insert(volcanoFVMessageGeometries)
          .values(payload.geometries.filter((g) => g.geometry))
          .onConflictDoNothing();
    });

    console.log("finished FV checkin");

    return { result: "success" };
  } catch (error) {
    const dbError = error as Error & {
      cause?: { code?: string; detail?: string; constraint?: string; table?: string };
    };
    console.error(
      `Error updating FV messages: ${dbError.message} code=${dbError.cause?.code ?? "unknown"} constraint=${dbError.cause?.constraint ?? "unknown"} table=${dbError.cause?.table ?? "unknown"} detail=${dbError.cause?.detail ?? "none"}`,
    );
    return { result: "error" };
  }
}

getFVMessages();
