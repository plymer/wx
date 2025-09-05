import { Hono } from "hono";
import { and, asc, desc, eq, gt, gte } from "drizzle-orm";
import axios from "axios";
import suncalc, { GetTimesResult } from "suncalc";

import { validateParams } from "../lib/zod-validator.js";
import {
  metarSchema,
  publicBulletinSchema,
  singleSiteSchema,
  xmetSchema,
} from "../validationSchemas/alphanumeric.zod.js";
import { HubDiscussion, XmetEventData } from "../lib/alphanumeric.types.js";
import { errorResponse, isConvectiveSigmet, jsonResponse, leadZero, processCoordinates } from "../lib/utils.js";
import { avwx } from "../main.js";
import { metars, sigmets, stations, tafs } from "../../shared/db/tables/avwx.drizzle.js";
import { HOUR } from "../../shared/lib/constants.js";
import { Feature, MultiPolygon } from "geojson";

const route = new Hono();

route.get("/metars", validateParams("query", metarSchema), async (c) => {
  const { site, hrs } = c.req.valid("query");

  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }

  // do a conversion for CYEU -> CWEU
  const searchSite = site === "CYEU" ? "CWEU" : site;

  console.log("[API] Requesting METARs for:", searchSite, "for the last", hrs, "hours");

  try {
    // retrieve the data from the avwx database
    const metarData = await avwx.query.metars.findMany({
      columns: { rawText: true },
      where: and(eq(metars.siteId, searchSite), gte(metars.validTime, new Date(Date.now() - hrs * HOUR))),
      orderBy: asc(metars.validTime),
    });

    if (!metarData || metarData.length === 0) {
      // we do not have any METARs that we can return, so send a 'noData' response
      return c.json({ status: "noData" }, 200);
    }

    const output = metarData.map((m) => m.rawText);

    return jsonResponse(c, output);
  } catch (error) {
    return errorResponse(c, error);
  }
});

route.get("/sitedata", validateParams("query", singleSiteSchema), async (c) => {
  const { site } = c.req.valid("query");

  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }

  // do a conversion for CWEU -> CYEU
  const searchSite = site === "CWEU" ? "CYEU" : site;

  console.log("[API] Requesting site data for:", searchSite);

  try {
    const stationData = await avwx.query.stations.findFirst({
      where: eq(stations.siteId, searchSite),
    });

    // if we don't have any data for this station, return a noData response
    if (!stationData) {
      return c.json({ status: "noData" }, 200);
    }

    const { siteId, name, lat, lon, elev_f, elev_m, country, state } = stationData;

    // create a suncalc time object
    const times: GetTimesResult = suncalc.getTimes(new Date(), lat, lon);

    // set sunrise and sunset times to "---" when the sun doesn't rise or set today
    const sunrise: string =
      times.sunrise.getUTCHours().toString() !== "NaN"
        ? leadZero(times.sunrise.getUTCHours(), 2) + ":" + leadZero(times.sunrise.getUTCMinutes(), 2) + "Z"
        : "---";
    const sunset: string =
      times.sunsetStart.getUTCHours().toString() !== "NaN"
        ? leadZero(times.sunsetStart.getUTCHours(), 2) + ":" + leadZero(times.sunsetStart.getUTCMinutes(), 2) + "Z"
        : "---";

    const output = {
      siteId,
      name,
      lat:
        lat > 0 ? (Math.round(lat * 10) / 10).toString() + "°N" : Math.abs(Math.round(lat * 10) / 10).toString() + "°S",
      lon:
        lon > 0 ? (Math.round(lon * 10) / 10).toString() + "°E" : Math.abs(Math.round(lon * 10) / 10).toString() + "°W",
      elev_f,
      elev_m,
      country,
      state,
      sunrise,
      sunset,
    };

    // return the site data object
    return jsonResponse(c, output);
  } catch (error) {
    return errorResponse(c, error);
  }
});

route.get("/taf", validateParams("query", singleSiteSchema), async (c) => {
  const { site } = c.req.valid("query");

  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }

  // do a conversion for CWEU -> CYEU
  const searchSite = site === "CWEU" ? "CYEU" : site;

  console.log("[API] Requesting TAF for:", searchSite);

  try {
    // retrieve the data from the avwx database
    const tafData = await avwx.query.tafs.findMany({
      columns: { rawText: true },
      where: eq(tafs.siteId, searchSite),
      orderBy: desc(tafs.validTime),
    });

    if (!tafData || tafData.length === 0) {
      // we do not have any TAFs that we can return, so send a 'noData' response
      return c.json({ status: "noData" }, 200);
    }

    const output = tafData[0].rawText;

    return jsonResponse(c, output);
  } catch (error) {
    return errorResponse(c, error);
  }
});

route.get("/hubs", validateParams("query", singleSiteSchema), async (c) => {
  const { site } = c.req.valid("query");

  const HubSites: Record<string, string> = {
    CYYZ: "Toronto Pearson Int'l Airport",
    CYUL: "Montreal Trudeau Int'l Airport",
    CYYC: "Calgary Int'l Airport",
    CYVR: "Vancouver Int'l Airport",
    CYOW: "Ottawa MacDonald Int'l Airport",
    CYHZ: "Halifax Stanfield Airport",
  };

  const url = "https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php";

  try {
    // get the data
    const hubs: HubDiscussion = await axios.get(url).then((hub) => hub.data);

    // check to see if the site id exists in the resulting json, return an error message if it doesnt
    if (!Object.hasOwn(hubs, site)) {
      return c.json({ status: "noData" }, 200);
    }

    const siteName = HubSites[site as keyof typeof HubSites];

    const {
      strheaders: header,
      strdiscussion: discussion,
      stroutlook: outlook,
      strforecaster: forecaster,
      stroffice: office,
    } = hubs[site as keyof HubDiscussion];

    const output = {
      siteName,
      header,
      discussion,
      outlook,
      forecaster,
      office,
    };

    return jsonResponse(c, output);
  } catch (error) {
    return errorResponse(c, error);
  }
});

route.get("/public/bulletin", validateParams("query", publicBulletinSchema), async (c) => {
  const { bulletin, office } = c.req.valid("query");

  const searchUrl =
    bulletin === "focn45" && office === "cwwg"
      ? "https://tgftp.nws.noaa.gov/data/raw/fo/focn45.cwwg..txt"
      : `https://weather.gc.ca/forecast/public_bulletins_e.html?Bulletin=${bulletin}.${office}`;

  console.log("requesting bulletin from:", searchUrl);

  try {
    const bulletinData: string = await axios.get(searchUrl).then((bulletin) => bulletin.data);

    if (bulletinData.length === 0) {
      return c.json({ status: "noData" }, 200);
    }

    let output = bulletinData;

    if (bulletin !== "focn45") {
      // use this to remove any 'reference' sections from the bulletin
      const refPattern = /(\n[-]{2,})\n?((.+)\n){1,}([-]{2,})/g;
      // because we're returning HTML, we need to actually yoink out the text between the two pre tags
      const bulletinText = bulletinData.match(/<pre>[\s\S]*?<\/pre>/g);

      if (!bulletinText || bulletinText.length === 0) {
        return c.json({ status: "noData" }, 200);
      }

      // if we have output, remove the pre tags and the reference section
      output = bulletinText[0]
        .replace(/<pre>/g, "")
        .replace(/<\/pre>/g, "")
        .replace(refPattern, "");
    }

    return jsonResponse(c, output);
  } catch (error) {
    return errorResponse(c, error);
  }
});

route.get("/sigmets", validateParams("query", xmetSchema), async (c) => {
  // these endpoints are only added if the db connection is alive, so we assert that is not undefined
  if (!avwx) {
    console.error("[API] No avwx connection available.");
    return errorResponse(c, "No avwx connection available.");
  }

  try {
    const { hours } = c.req.valid("query");
    const queryResult = await avwx.query.sigmets.findMany({
      where: gt(sigmets.endTime, new Date(Date.now() - hours * HOUR)),
      orderBy: [desc(sigmets.endTime)],
    });

    const xmetList = queryResult.sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(), //should be desc order
    );

    const xmetEvents: XmetEventData[] = xmetList
      .map((xmet) => {
        // LatLons are stored in the db as space-delimited values in lat,lon format

        const issuer = xmet.issuer;
        const text = xmet.rawText;
        const domain = xmet.domain;
        const charCode = xmet.charCode;
        const numberCode = xmet.numberCode;
        const startTime = new Date(xmet.issueTime).getTime();
        const endTime = new Date(xmet.endTime).getTime();
        const motionVector = {
          direction: xmet.direction,
          speed: xmet.speed,
        };
        const header = xmet.header;

        const hazard = {
          type: xmet.hazard,
          trend: xmet.hazardTrend,
          top: xmet.hazardTop,
          bottom: xmet.hazardBottom,
        };

        const shape = xmet.initialShape;

        const coords = processCoordinates(shape, 0, xmet.initialCoords);

        // assign a sequenceId for non-convective sigmets and airmets so consumers can group them together
        const sequenceId = !isConvectiveSigmet(header) ? `${domain}${charCode}` : `conv`;

        return {
          issuer,
          text,
          domain,
          charCode,
          numberCode,
          sequenceId,
          startTime,
          endTime,
          motionVector,
          header,
          hazard,
          coords,
        };
      })
      .filter((xmet) => xmet !== undefined && xmet !== null);

    // create the output in the requested format
    const output: Feature<MultiPolygon, XmetEventData>[] | undefined = xmetEvents
      .map((xmet) => {
        const {
          issuer,
          text,
          domain,
          charCode,
          numberCode,
          sequenceId,
          startTime,
          endTime,
          motionVector,
          header,
          hazard,
          coords,
        } = xmet;

        if (!coords) return null;

        return {
          type: "Feature",
          geometry: {
            coordinates: [coords],
            type: "MultiPolygon",
          },
          properties: {
            issuer,
            header,
            domain,
            charCode,
            numberCode,
            sequenceId,
            startTime,
            endTime,
            hazard,
            motionVector,
            text,
          },
        };
      })
      .filter((f): f is Feature<MultiPolygon, XmetEventData> => f !== null && f !== undefined);

    return jsonResponse(c, output, "geojson");
  } catch (error) {
    return errorResponse(c, error);
  }
});

export default route;
