import { Hono } from "hono";
import { and, asc, eq, gte } from "drizzle-orm";
import axios from "axios";
import suncalc, { GetTimesResult } from "suncalc";

import { validateParams } from "../lib/zod-validator.js";
import { metarSchema, publicBulletinSchema, singleSiteSchema } from "../validationSchemas/alphanumeric.zod.js";
import { HubDiscussion, TafObject } from "../lib/alphanumeric.types.js";
import { errorResponse, jsonResponse, leadZero } from "../lib/utils.js";
import { avwx } from "../main.js";
import { metars, stations } from "../../shared/db/tables/avwx.drizzle.js";
import { HOUR } from "../../shared/lib/constants.js";

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
      where: and(eq(metars.siteId, searchSite.toUpperCase()), gte(metars.validTime, new Date(Date.now() - hrs * HOUR))),
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
      where: eq(stations.siteId, searchSite.toUpperCase()),
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

  // do a conversion for CWEU -> CYEU
  const searchSite = site === "CWEU" ? "CYEU" : site;

  const url = `http://aviationweather.gov/api/data/taf?ids=${searchSite}&format=json`;
  console.log("[API] Requesting TAF from:", url);

  try {
    const tafObject: TafObject[] | string = await axios.get(url).then((taf) => taf.data);

    // no match for a taf site on avwx.gov returns zero-length array of json, or for an error
    // returns a string of "error retrieving data"
    if (tafObject.length === 0 || tafObject === "error retrieving data") {
      // we do not have a TAF that we can return, so send an empty response
      return c.json({ status: "noData" }, 200);
    }

    const output = (tafObject[0] as TafObject).rawTAF;

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
    if (!Object.hasOwn(hubs, site.toUpperCase())) {
      return c.json({ status: "noData" }, 200);
    }

    const siteName = HubSites[site.toUpperCase() as keyof typeof HubSites];

    const {
      strheaders: header,
      strdiscussion: discussion,
      stroutlook: outlook,
      strforecaster: forecaster,
      stroffice: office,
    } = hubs[site.toUpperCase() as keyof HubDiscussion];

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

export default route;
