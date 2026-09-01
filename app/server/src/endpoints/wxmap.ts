import type { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { TRPCError } from "@trpc/server";
import "dotenv/config";

import type { AlertColour, AlertType, StationPlotPopupData, WxOAlertMapProperties } from "../lib/types.js";
import { HOUR } from "../lib/constants.js";
import { limitResultsByKeys } from "../lib/utils.js";

import { publicProcedure, router } from "../services/trpc.js";
import { pgDb as db } from "../services/database.js";
import { cacheClient } from "../services/redis.js";
import { sql } from "drizzle-orm";
import { POPUP_DATA_CACHE_KEY, PUBLIC_ALERTS_CACHE_KEY } from "../config/cache-keys.config.js";
import path from "path";
import * as fs from "fs/promises";

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
          .execute(sql<LeadAlertRow>`
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
          `)
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
  hurricanes: publicProcedure.query(async () => {
    if (!process.env.STATIC_DATA_DIR) {
      throw new Error("STATIC_DATA_DIR environment variable is not set");
    }

    console.log("[API] Fetching Hurricane data from directory:", process.env.STATIC_DATA_DIR);

    const hurricanesDir = path.join(process.env.STATIC_DATA_DIR, "hurricanes");
    const messageFiles = await fs.readdir(hurricanesDir);

    const featureCollections: FeatureCollection[] = [];
    for (const file of messageFiles) {
      const filePath = path.join(hurricanesDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      try {
        const featureCollection = JSON.parse(content) as FeatureCollection;
        featureCollections.push(featureCollection);
      } catch (e) {
        console.error(`Error parsing hurricane file ${file}:`, e);
      }
    }

    // Merge all feature collections into one
    const mergedFeatureCollection: FeatureCollection = {
      type: "FeatureCollection",
      features: featureCollections.flatMap((fc) => fc.features),
    };

    return mergedFeatureCollection;
  }),
});
