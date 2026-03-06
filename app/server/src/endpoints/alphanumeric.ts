import { and, asc, desc, eq, gt, gte } from "drizzle-orm";
import suncalc, { type GetTimesResult } from "suncalc";
import type { Feature, MultiPolygon } from "geojson";
import { TRPCError } from "@trpc/server";

import {
  metarSchema,
  publicBulletinSchema,
  publicPointSchema,
  singleSiteSchema,
  xmetSchema,
} from "../validationSchemas/alphanumeric.zod.js";
import type { HubDiscussion, XmetEventData } from "../lib/alphanumeric.types.js";
import { isConvectiveSigmet, leadZero, processCoordinates } from "../lib/utils.js";

import { metars, sigmets, stations, tafs } from "../db/tables/avwx.drizzle.js";
import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";

import { avwxDb } from "../main.js";
import { publicProcedure, router } from "../lib/trpc.js";
import type { HubData, WxOAPIResponse, XmetGeoJSON } from "../lib/types.js";

const HubSites: Record<string, string> = {
  CYYZ: "Toronto Pearson Int'l Airport",
  CYUL: "Montreal Trudeau Int'l Airport",
  CYYC: "Calgary Int'l Airport",
  CYVR: "Vancouver Int'l Airport",
  CYOW: "Ottawa MacDonald Int'l Airport",
  CYHZ: "Halifax Stanfield Airport",
};

export const alphanumericRouter = router({
  metars: publicProcedure.input(metarSchema).query(async ({ input }) => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const { site, hrs } = input;
    const searchSite = site === "CYEU" ? "CWEU" : site;

    console.log("[API] Requesting METARs for:", searchSite, "for the last", hrs, "hours");

    try {
      const metarData = await avwxDb.query.metars.findMany({
        columns: { rawText: true },
        where: and(eq(metars.siteId, searchSite), gte(metars.validTime, new Date(Date.now() - hrs * HOUR))),
        orderBy: asc(metars.validTime),
      });

      if (!metarData || metarData.length === 0) {
        return undefined;
      }

      return metarData.map((m) => m.rawText).filter((m) => m !== null && m !== undefined);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  sitedata: publicProcedure.input(singleSiteSchema).query(async ({ input }) => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const { site } = input;
    const searchSite = site === "CWEU" ? "CYEU" : site;

    console.log("[API] Requesting site data for:", searchSite);

    try {
      const stationData = await avwxDb.query.stations.findFirst({
        where: eq(stations.siteId, searchSite),
      });

      if (!stationData) {
        return undefined;
      }

      const { siteId, name, lat, lon, elev_f, elev_m, country, state } = stationData;

      const times: GetTimesResult = suncalc.getTimes(new Date(), lat, lon);

      const sunrise: string =
        times.sunrise.getUTCHours().toString() !== "NaN"
          ? leadZero(times.sunrise.getUTCHours(), 2) + ":" + leadZero(times.sunrise.getUTCMinutes(), 2) + "Z"
          : "---";
      const sunset: string =
        times.sunsetStart.getUTCHours().toString() !== "NaN"
          ? leadZero(times.sunsetStart.getUTCHours(), 2) + ":" + leadZero(times.sunsetStart.getUTCMinutes(), 2) + "Z"
          : "---";

      return {
        siteId,
        name,
        lat:
          lat > 0
            ? (Math.round(lat * 10) / 10).toString() + "°N"
            : Math.abs(Math.round(lat * 10) / 10).toString() + "°S",
        lon:
          lon > 0
            ? (Math.round(lon * 10) / 10).toString() + "°E"
            : Math.abs(Math.round(lon * 10) / 10).toString() + "°W",
        elev_f,
        elev_m,
        country,
        state,
        sunrise,
        sunset,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  taf: publicProcedure.input(singleSiteSchema).query(async ({ input }) => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const { site } = input;
    const searchSite = site === "CWEU" ? "CYEU" : site;

    console.log("[API] Requesting TAF for:", searchSite);

    try {
      const tafData = await avwxDb.query.tafs.findMany({
        columns: { rawText: true },
        where: eq(tafs.siteId, searchSite),
        orderBy: desc(tafs.validTime),
      });

      if (!tafData || tafData.length === 0) {
        return undefined;
      }

      return tafData[0].rawText ? tafData[0].rawText : undefined;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  hubs: publicProcedure.input(singleSiteSchema).query(async ({ input }): Promise<HubData> => {
    const { site } = input;
    const url = "https://metaviation.az.ec.gc.ca/hubwx/scripts/getForecasterNotes.php";

    try {
      const hubs: HubDiscussion = await fetch(url, { headers: DEFAULT_REMOTE_HEADERS })
        .then((hub) => hub.json())
        .then((data) => data as HubDiscussion);

      const siteName = HubSites[site as keyof typeof HubSites];

      const {
        strheaders: header,
        strdiscussion: discussion,
        stroutlook: outlook,
        strforecaster: forecaster,
        stroffice: office,
      } = hubs[site as keyof HubDiscussion];

      return {
        siteName,
        header,
        discussion,
        outlook,
        forecaster,
        office,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  publicBulletin: publicProcedure.input(publicBulletinSchema).query(async ({ input }): Promise<string> => {
    const { bulletin, office } = input;

    const searchUrl =
      bulletin === "focn45" && office === "cwwg"
        ? "https://tgftp.nws.noaa.gov/data/raw/fo/focn45.cwwg..txt"
        : `https://weather.gc.ca/forecast/public_bulletins_e.html?Bulletin=${bulletin}.${office}`;

    console.log("requesting bulletin from:", searchUrl);

    try {
      const bulletinData: string = await fetch(searchUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((bulletin) =>
        bulletin.text(),
      );

      if (bulletinData.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bulletin data is empty" });
      }

      let output = bulletinData;

      if (bulletin !== "focn45") {
        const refPattern = /(\n[-]{2,})\n?((.+)\n){1,}([-]{2,})/g;
        const bulletinText = bulletinData.match(/<pre>[\s\S]*?<\/pre>/g);

        if (!bulletinText || bulletinText.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No bulletin content found in response" });
        }

        output = bulletinText[0]
          .replace(/<pre>/g, "")
          .replace(/<\/pre>/g, "")
          .replace(refPattern, "");
      }

      return output;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  pointForecast: publicProcedure.input(publicPointSchema).query(async ({ input }) => {
    const { lat, lon } = input;

    console.log("[API] Requesting point forecast for:", lat.toFixed(3), lon.toFixed(3));

    // https://weather.gc.ca/api/app/v3/en/Location/53.536,-113.494?type=city
    const apiUrl = `https://weather.gc.ca/api/app/v3/en/Location/${lat.toFixed(3)},${lon.toFixed(3)}?type=city`;

    try {
      const response = (await fetch(apiUrl, { headers: DEFAULT_REMOTE_HEADERS }).then((res) =>
        res.json(),
      )) as WxOAPIResponse[];

      if (!response) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No forecast data found for the provided coordinates" });
      }

      const data = response[0];
      // we want to extract and transform only the relevant parts that we want to show the client

      console.log(data.dailyFcst.daily);

      const alerts = data.alert.alerts
        ?.map((alert) => {
          if (alert.status === "ended") return undefined;

          return {
            type: alert.type,
            issueTime: alert.issueTime,
            timezone: alert.timezone,
            issueTimeText: alert.issueTimeText,
            expiryTime: alert.expiryTime,
            eventOnsetTime: alert.eventOnsetTime,
            eventEndTime: alert.eventEndTime,
            alertBannerText: alert.alertBannerText,
            text: alert.text,
          };
        })
        .filter((a) => a !== undefined);

      const ob = data.observation;
      const aq = data.aqhi;
      const aqFcst = data.aqhiFcst;

      const aqText = aq?.riskText ? aq.riskText.replace("Risk", "").trim() : undefined;

      const placeName = data.displayName;

      const currentConditions = {
        time: ob?.timeStamp,
        siteId: ob?.tcid,
        siteName: ob?.observedAt,
        iconCode: ob?.iconCode,
        weather: {
          condition: ob?.condition,
          tt: ob?.temperature?.metricUnrounded ?? ob?.temperature?.metric,
          td: ob?.dewpoint?.metricUnrounded ?? ob?.dewpoint?.metric,
          vis: ob?.visibility?.metric,
          mslp: ob?.pressure?.metric,
          humidity: ob?.humidity,
          wSpd: ob?.windSpeed?.metric,
          wDir: ob?.windDirection,
          wGust: ob?.windGust?.metric,
        },
        aqhi: { value: aq?.aqhiVal, time: aq?.epochTime, text: aqText },
      };

      const normals = {
        high: data.dailyFcst.regionalNormals.metric.highTemp,
        low: data.dailyFcst.regionalNormals.metric.lowTemp,
      };

      const dailyForecasts = data.dailyFcst.daily.map((period) => {
        return {
          date: period.date,
          id: period.periodID,
          label: period.periodLabel,
          text: period.text,
          iconCode: period.iconCode,
          tt: period.temperature.metric,
          aqhiVal: 9999,
        };
      });

      aqFcst?.daily?.forEach((aqhiPeriod, index) => {
        if (dailyForecasts[index]) {
          dailyForecasts[index].aqhiVal = aqhiPeriod.aqhiVal;
        }
      });

      const riseSet = { rise: data.riseSet.rise.time, set: data.riseSet.set.time };

      return { placeName, currentConditions, alerts, normals, dailyForecasts, riseSet };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),

  sigmets: publicProcedure.input(xmetSchema).query(async ({ input }) => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    try {
      const { hours } = input;
      const queryResult = await avwxDb.query.sigmets.findMany({
        where: gt(sigmets.endTime, new Date(Date.now() - hours * HOUR)),
        orderBy: [desc(sigmets.endTime)],
      });

      const xmetList = queryResult.sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

      const xmetEvents: XmetEventData[] = xmetList
        .map((xmet) => {
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

          const dataType: "sigmet" = "sigmet";

          const shape = xmet.initialShape;
          const coords = processCoordinates(shape, 0, xmet.initialCoords);
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
            dataType,
          };
        })
        .filter((xmet) => xmet !== undefined && xmet !== null);

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
            dataType,
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
              dataType,
            },
          };
        })
        .filter((f): f is Feature<MultiPolygon, XmetEventData> => f !== null && f !== undefined);

      return { type: "FeatureCollection", features: output } as unknown as XmetGeoJSON;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
});
