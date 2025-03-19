import axios from "axios";
import { Hono } from "hono";
import suncalc, { GetTimesResult } from "suncalc";
import { validateParams } from "../lib/zod-validator.js";
import { metarSchema, publicBulletinSchema, singleSiteSchema } from "../validationSchemas/alphanumeric.zod.js";
import { HubDiscussion, MetarObject, StationObject, TafObject } from "../lib/alphanumeric.types.js";
import { FEET_PER_METRE, leadZero } from "../lib/utils.js";

const route = new Hono();

route.get("/metars", validateParams("query", metarSchema, {}), async (c) => {
  try {
    // we might need to mutate the site variable
    let { site, hrs } = c.req.valid("query");

    // do a conversion for CYEU -> CWEU
    site.toString().toUpperCase() === "CYEU" ? (site = "CWEU") : "";

    // begin data retrieval
    const url = `http://aviationweather.gov/api/data/metar?ids=${site}&hours=${hrs}&format=json`;
    console.log("requesting metars from:", url);
    const metarObjects: MetarObject[] | string = await axios.get(url).then((metars) => metars.data);

    // check for the presence of valid data, otherwise return an error message
    if (metarObjects.length === 0 || metarObjects === "error retrieving data") {
      // we do not have any METARs that we can return, so send an empty response
      return c.json(
        {
          status: "error",
          error: `no METARs found for '${site?.toString().toUpperCase()}'`,
        },
        200
      );
    }

    // if our returned value is an object, we know we have valid output
    if (typeof metarObjects === "object") {
      const output = metarObjects.reverse().map((m: MetarObject) => m.rawOb);
      return c.json({ status: "success", data: { metars: output } }, 200);
    }
  } catch (error) {
    return c.json({ status: "error", error: error }, 400);
  }
});

route.get("/sitedata", validateParams("query", singleSiteSchema, {}), async (c) => {
  // we might need to mutate the site variable
  let { site } = c.req.valid("query");
  try {
    // do a conversion for CWEU -> CYEU
    site.toString().toUpperCase() === "CWEU" ? (site = "CYEU") : "";

    const url = `http://aviationweather.gov/api/data/stationinfo?ids=${site}&format=json`;
    console.log("requesting station info from:", url);
    const siteData: StationObject[] = await axios.get(url).then((site) => site.data);

    // check for the presence of valid data, otherwise return an error message
    if (siteData.length === 0) {
      // we do not have any site data that we can return, so send an empty response
      return c.json(
        {
          status: "error",
          error: `no Site Data found for '${site?.toString().toUpperCase()}'`,
        },
        200
      );
    }

    if (typeof siteData === "object") {
      // create a suncalc time object
      const times: GetTimesResult = suncalc.getTimes(new Date(), siteData[0].lat, siteData[0].lon);

      // set sunrise and sunset times to "---" when the sun doesn't rise or set today
      const riseString: string =
        times.sunrise.getUTCHours().toString() !== "NaN"
          ? leadZero(times.sunrise.getUTCHours(), 2) + ":" + leadZero(times.sunrise.getUTCMinutes(), 2) + "Z"
          : "---";
      const setString: string =
        times.sunsetStart.getUTCHours().toString() !== "NaN"
          ? leadZero(times.sunsetStart.getUTCHours(), 2) + ":" + leadZero(times.sunsetStart.getUTCMinutes(), 2) + "Z"
          : "---";

      // return the site data object
      return c.json(
        {
          status: "success",
          data: {
            icaoId: siteData[0].icaoId,
            location: siteData[0].site + ", " + siteData[0].state,
            lat:
              siteData[0].lat > 0
                ? (Math.round(siteData[0].lat * 10) / 10).toString() + "°N"
                : Math.abs(Math.round(siteData[0].lat * 10) / 10).toString() + "°S",
            lon:
              siteData[0].lon > 0
                ? (Math.round(siteData[0].lon * 10) / 10).toString() + "°E"
                : Math.abs(Math.round(siteData[0].lon * 10) / 10).toString() + "°W",
            elev_f: Math.floor(siteData[0].elev * FEET_PER_METRE) + " ft",
            elev_m: siteData[0].elev + " m",
            sunrise: riseString,
            sunset: setString,
          },
        },
        200
      );
    }
  } catch (error) {
    return c.json({ status: "error", error: error }, 400);
  }
});

route.get("/taf", validateParams("query", singleSiteSchema, {}), async (c) => {
  // we may need to mutate the site variable
  let { site } = c.req.valid("query");
  try {
    // do a conversion for CWEU -> CYEU
    site.toString().toUpperCase() === "CWEU" ? (site = "CYEU") : "";

    const url = `http://aviationweather.gov/api/data/taf?ids=${site}&format=json`;
    console.log("requesting taf from:", url);
    const tafObject: TafObject[] | string = await axios.get(url).then((taf) => taf.data);

    // no match for a taf site on avwx.gov returns zero-length array of json, or for an error
    // returns a string of "error retrieving data"
    if (tafObject.length === 0 || tafObject === "error retrieving data") {
      // we do not have a TAF that we can return, so send an empty response
      return c.json({
        status: "error",
        error: `no TAF found for '${site?.toString().toUpperCase()}'`,
      });
    }

    if (typeof tafObject === "object") {
      return c.json(
        {
          status: "success",
          data: {
            taf: tafObject[0].rawTAF,
          },
        },
        200
      );
    }
  } catch (error) {
    return c.json({ status: "error", error: error }, 400);
  }
});

route.get("/hubs", validateParams("query", singleSiteSchema, {}), async (c) => {
  const { site } = c.req.valid("query");
  try {
    type SiteName = {
      [siteName: string]: string;
    };

    const HubSites: SiteName = {
      CYYZ: "Toronto Pearson Int'l Airport",
      CYUL: "Montreal Trudeau Int'l Airport",
      CYYC: "Calgary Int'l Airport",
      CYVR: "Vancouver Int'l Airport",
      CYOW: "Ottawa MacDonald Int'l Airport",
      CYHZ: "Halifax Stanfield Airport",
    };

    // get the data
    const url = "https://metaviation.ec.gc.ca/hubwx/scripts/getForecasterNotes.php";
    const hubs: HubDiscussion = await axios.get(url).then((hub) => hub.data);

    // check to see if the site id exists in the resulting json, return an error message if it doesnt
    if (!Object.hasOwn(hubs, site.toUpperCase())) {
      return c.json({ status: "error", error: `${site} does not currently have a forecast discussion` }, 200);
    }

    // ready our data to be returned
    const hubData = hubs[site.toUpperCase() as keyof HubDiscussion];

    return c.json(
      {
        status: "success",
        data: {
          siteName: HubSites[site],
          header: hubData.strheaders,
          discussion: hubData.strdiscussion,
          outlook: hubData.stroutlook,
          forecaster: hubData.strforecaster,
          office: hubData.stroffice,
        },
      },
      200
    );
  } catch (error) {
    return c.json({ status: "error", error: error }, 400);
  }
});

route.get("/public/bulletin", validateParams("query", publicBulletinSchema, {}), async (c) => {
  const { bulletin, office } = c.req.valid("query");

  let searchURL = `https://weather.gc.ca/forecast/public_bulletins_e.html?Bulletin=${bulletin}.${office}`;

  if (bulletin === "focn45" && office === "cwwg") {
    searchURL = "https://tgftp.nws.noaa.gov/data/raw/fo/focn45.cwwg..txt";
  }

  console.log("requesting bulletin from:", searchURL);

  try {
    let bulletinData: string = await axios.get(searchURL).then((bulletin) => bulletin.data);

    if (bulletinData.length === 0) {
      return c.json(
        {
          status: "error",
          error: `no bulletin found for '${bulletin.toUpperCase()} ${office.toUpperCase()}'`,
        },
        400
      );
    }

    if (bulletin !== "focn45") {
      // because we're returning HTML, we need to actually yoink out the text between the two pre tags
      const bulletinText = bulletinData.match(/<pre>[\s\S]*?<\/pre>/g);
      bulletinData = bulletinText ? bulletinText[0].replace(/<pre>/g, "").replace(/<\/pre>/g, "") : "";
    }

    return c.json(
      {
        status: "success",
        data: bulletinData,
      },
      200
    );
  } catch (error) {
    return c.json({ status: "error", error: error }, 400);
  }
});

export default route;
