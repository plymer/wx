import type { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import { TRPCError } from "@trpc/server";
import "dotenv/config";
import * as turf from "@turf/turf";
import { sql } from "drizzle-orm";

import type { AlertColour, AlertType, StationPlotPopupData, WxOAlertMapProperties } from "../lib/types.js";
import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";
import {
  ensure2DPosition,
  generateStormNamePoint,
  getStormClass,
  limitResultsByKeys,
  transformHurricaneMetobject,
} from "../lib/utils.js";

import { publicProcedure, router } from "../services/trpc.js";
import { pgDb as db } from "../services/database.js";
import { cacheClient } from "../services/redis.js";
import {
  HURRICANE_CACHE_KEY,
  POPUP_DATA_CACHE_KEY,
  PUBLIC_ALERTS_CACHE_KEY,
  TSO_CACHE_KEY,
} from "../config/cache-keys.config.js";
import type {
  HurricaneData,
  HurricaneDataResponse,
  HurricaneDataType,
  NhcConePolygonProps,
  NhcTrackLineProps,
  NhcTrackPointProps,
  ParsedTrackPointProps,
} from "../lib/hurricanes.types.js";
import type { TSOutlookFeatureProps } from "../lib/tso.types.js";

type LeadAlertRow = {
  id: string;
  alertCode: string;
  type: AlertType;
  zoneType: "fixed" | "freeform";
  alertName: string;
  alertNameShort: string;
  program: string;
  startTime: number;
  expiryTime: number;
  timezone: string;
  issueTimeText: string;
  issuingOfficeTZ: string;
  text: string;
  bannerText: string;
  headerText: string;
  colour: AlertColour;
  impact: string | null;
  confidence: string | null;
  level: number | null;
  direction: number | null;
  speed: number | null;
  coords: string | null;
};

export const wxmapRouter = router({
  wxmapPopupData: publicProcedure.query(async (): Promise<Record<string, StationPlotPopupData>> => {
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No avwx connection available",
      });
    }

    const cachedData = await cacheClient.get(POPUP_DATA_CACHE_KEY);

    if (cachedData) {
      console.log("[API] Cache HIT for wxmap popup data");
      return JSON.parse(cachedData) as Record<string, StationPlotPopupData>;
    }

    console.log("[API] Cache MISS for wxmap popup data. Fetching from source...");

    const metarsQuery = await db.query.metars
      .findMany({
        where: { validTime: { gt: new Date(Date.now() - 4 * HOUR) } },
        with: {
          stations: { columns: { lat: true, lon: true, country: true, name: true, state: true } },
        },
        orderBy: { validTime: "asc" },
      })
      .then((results) => limitResultsByKeys(results, 1, "siteId"));

    const metarList: Record<string, string[]> = {};
    metarsQuery.forEach((m) => {
      if (!m.rawText) return;

      if (metarList[m.siteId]) {
        metarList[m.siteId].push(m.rawText);
      } else {
        metarList[m.siteId] = [m.rawText];
      }
    });

    const tafsQuery = await db.query.tafs
      .findMany({
        where: { validTime: { gt: new Date(Date.now() - 8 * HOUR) } },
        orderBy: { validTime: "asc" },
      })
      .then((results) => limitResultsByKeys(results, 1, "siteId"));

    const output = metarsQuery.reduce<Record<string, StationPlotPopupData>>((acc, m) => {
      if (!m.rawText || !m.stations) return acc;

      const siteId = m.siteId;

      const { name: siteName, country: siteCountry, state: siteState } = m.stations;

      const currentTaf = tafsQuery.find((t) => t.siteId === siteId);

      const existingFeature = acc[siteId];

      if (existingFeature) {
        return acc;
      } else {
        acc[siteId] = {
          siteName,
          siteCountry,
          siteState,
          metars: metarList[siteId] || [],
          taf: currentTaf ? currentTaf.rawText : null,
        };

        return acc;
      }
    }, {});

    await cacheClient.setEx(POPUP_DATA_CACHE_KEY, 60 * 5, JSON.stringify(output));

    return output;
  }),

  wxmapPublicAlerts: publicProcedure.query(
    async (): Promise<FeatureCollection<MultiPolygon, WxOAlertMapProperties> | null> => {
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No database connection available",
        });
      }

      const cachedData = await cacheClient.get(PUBLIC_ALERTS_CACHE_KEY);

      if (cachedData) {
        console.log("[API] Cache HIT for Public Alerts data");
        return JSON.parse(cachedData) as FeatureCollection<MultiPolygon, WxOAlertMapProperties>;
      }

      console.log("[API] Cache MISS for Public Alerts data. Fetching from source...");

      try {
        // const alerts = await db.query.publicAlerts.findMany({
        //   where: { issueTime: { gt: new Date(Date.now() - 12 * HOUR) } },
        // });

        const leadAlerts = await db
          .execute(
            sql<LeadAlertRow>`
          SELECT
            id,
            alert_code as "alertCode",
            type,
            zone_type as "zoneType",
            alert_name as "alertName",
            alert_name_short as "alertNameShort",
            program,
            (EXTRACT(EPOCH FROM issue_time) * 1000)::double precision as "startTime",
            COALESCE(
              LEAD((EXTRACT(EPOCH FROM issue_time) * 1000)::double precision)
                OVER (
                  PARTITION BY id
                  ORDER BY issue_time
                ),
              (EXTRACT(EPOCH FROM expiry) * 1000)::double precision
            ) as "expiryTime",
            timezone,
            issue_time_text as "issueTimeText",
            issuing_office_tz as "issuingOfficeTZ",
            text,
            banner_text as "bannerText",
            header_text as "headerText",
            colour,
            impact,
            confidence,
            level,
            coords
          FROM public_alerts
          WHERE issue_time > NOW() - INTERVAL '24 hours'
          `,
          )
          .then((results) => results.rows);

        const features: Feature<MultiPolygon, WxOAlertMapProperties>[] = leadAlerts
          .filter((alert): alert is LeadAlertRow & { coords: string } => alert.coords !== null)
          .map((alert) => {
            const geometry = JSON.parse(alert.coords) as MultiPolygon;
            const alertNameShort = alert.alertNameShort
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return {
              type: "Feature",
              geometry,
              properties: {
                alertCode: alert.alertCode,
                zoneType: alert.zoneType,
                alertName: alert.alertName,
                alertNameShort,
                program: alert.program,
                timezone: alert.timezone,
                issueTimeText: alert.issueTimeText,
                issuingOfficeTZ: alert.issuingOfficeTZ,
                id: alert.id,
                text: alert.text,
                bannerText: alert.bannerText,
                headerText: alert.headerText,
                dataType: "publicAlert",
                alertType: alert.type,
                startTime: alert.startTime,
                expiryTime: alert.expiryTime,
                colour: alert.colour,
                impact: alert.impact ?? "",
                confidence: alert.confidence ?? "",
                level: alert.level ?? 0,
              },
            };
          });

        const featureCollection: FeatureCollection<MultiPolygon, WxOAlertMapProperties> = {
          type: "FeatureCollection",
          features,
        };

        await cacheClient.setEx(PUBLIC_ALERTS_CACHE_KEY, 60, JSON.stringify(featureCollection));

        return featureCollection;
      } catch (error) {
        console.error("Error fetching public alerts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch public alerts",
        });
      }
    },
  ),
  hurricanesAtlantic: publicProcedure.query(async () => {
    const DATA_TYPES: HurricaneDataType[] = ["track", "error_cone", "cyclone", "wind_radii"];

    const featureSets = await Promise.all(
      DATA_TYPES.map(async (type) => {
        const cacheKey = `${HURRICANE_CACHE_KEY}:atlantic:${type}`;
        const cachedData = await cacheClient.get(cacheKey);

        if (cachedData) {
          console.log(`[API] Cache HIT for Atlantic hurricane data type: ${type}`);

          return JSON.parse(cachedData) as Feature[];
        } else {
          console.log(`[API] Cache MISS for Atlantic hurricane data type: ${type}. Fetching from source...`);
          const url = `https://api.weather.gc.ca/collections/hurricanes-${type}-realtime/items?lang=en&sortby=latest_publication&latest_publication=true&active=true&f=json`;
          const response = (await fetch(url).then((res) => res.json())) as HurricaneDataResponse[typeof type];

          if (!response || !response.features) {
            console.error(`No features found for hurricane data type: ${type}`);
            return [] as Feature[];
          }

          const expiryTime = 60 * 30; // 30 minutes
          const now = new Date().getTime();

          // track the storms that have recently been updated and the current datatype's highest amendment value
          const activeStorms = new Map<string, number>();

          response.features.forEach((f) => {
            const isExpired = new Date(f.properties.publication_datetime).getTime() < now - 6 * HOUR;

            if (!isExpired) {
              // if we have the storm being tracked already, make sure we're using the highest value of amendment
              if (activeStorms.has(f.properties.storm_name)) {
                const maxAmendment = activeStorms.get(f.properties.storm_name);
                if (maxAmendment === undefined || f.properties.amendment > maxAmendment) {
                  activeStorms.set(f.properties.storm_name, f.properties.amendment);
                }
              } else {
                activeStorms.set(f.properties.storm_name, f.properties.amendment);
              }
            }
          });

          const validFeatures = response.features.filter(
            (f) =>
              activeStorms.has(f.properties.storm_name) &&
              f.properties.amendment === activeStorms.get(f.properties.storm_name),
          ) as HurricaneDataResponse[typeof type]["features"];

          const baseFeatures = transformHurricaneMetobject(type, validFeatures);
          const computedFeatures: Feature[] = [];

          if (validFeatures.length === 0) {
            await cacheClient.setEx(cacheKey, expiryTime, JSON.stringify(transformHurricaneMetobject(type, [])));
          } else {
            if (type === "track") {
              baseFeatures.forEach((bF) =>
                computedFeatures.push(generateStormNamePoint(bF as HurricaneData["track"]["features"][number])),
              );
            }

            await cacheClient.setEx(cacheKey, expiryTime, JSON.stringify([...baseFeatures, ...computedFeatures]));
          }
          return [...baseFeatures, ...computedFeatures] as Feature[];
        }
      }),
    );

    // Merge all feature collections into one
    const mergedFeatureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: featureSets.flat(),
    };

    return mergedFeatureCollection;
  }),

  hurricanesPacific: publicProcedure.query(async () => {
    const cacheKey = `${HURRICANE_CACHE_KEY}:pacific:all`;

    const cachedData = await cacheClient.get(cacheKey);

    if (cachedData) {
      console.log(`[API] Cache HIT for Pacific hurricane data`);

      return JSON.parse(cachedData) as FeatureCollection;
    } else {
      console.log(`[API] Cache MISS for Pacific hurricane data. Fetching from source...`);

      const expiryTime = 60 * 30; // 30 minutes

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
                  dataType: "hurricane",
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

          const conePolygon: Feature<Polygon, { type: "error_cone"; storm_name: string }> | undefined =
            cone120HourPolygon
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
        }
        turf.simplify(outputData, { tolerance: 0.005, mutate: true });

        cacheClient.setEx(cacheKey, expiryTime, JSON.stringify(outputData));

        return outputData;
      } catch (error) {
        console.error("[API] Error parsing Pacific Hurricane data:", (error as Error).stack);
      }
    }
  }),

  tso: publicProcedure.query(async () => {
    const cacheKey = `${TSO_CACHE_KEY}`;
    const cachedData = await cacheClient.get(cacheKey);

    if (cachedData) {
      console.log(`[API] Cache HIT for TSO data`);
      return JSON.parse(cachedData) as FeatureCollection<Polygon, TSOutlookFeatureProps>;
    } else {
      console.log(`[API] Cache MISS for TSO data. Fetching from source...`);
      const url = `https://api.weather.gc.ca/collections/thunderstorm_outlook/items?lang=en&f=json`;
      const response = (await fetch(url).then((res) => res.json())) as FeatureCollection<
        Polygon,
        TSOutlookFeatureProps
      >;

      if (!response || !response.features) {
        console.error(`No features found for TSO data`);
        return { type: "FeatureCollection", features: [] } as FeatureCollection<Polygon, TSOutlookFeatureProps>;
      }

      const expiryTime = 60 * 60 * 6; // 6 hours
      await cacheClient.setEx(cacheKey, expiryTime, JSON.stringify(response));

      return response;
    }
  }),
});
