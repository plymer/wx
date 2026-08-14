import type { Feature, FeatureCollection, MultiPolygon, Point } from "geojson";
import { TRPCError } from "@trpc/server";
import "dotenv/config";
import * as turf from "@turf/turf";

import type { AlertColour, AlertType, StationPlotPopupData, WxOAlertMapProperties } from "../lib/types.js";
import { HOUR } from "../lib/constants.js";
import { limitResultsByKeys } from "../lib/utils.js";

import { publicProcedure, router } from "../services/trpc.js";
import { pgDb as db } from "../services/database.js";
import { cacheClient } from "../services/redis.js";

export const wxmapRouter = router({
  wxmapPopupData: publicProcedure.query(async (): Promise<FeatureCollection<Point, StationPlotPopupData>> => {
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No avwx connection available",
      });
    }

    const cachedData = await cacheClient.get("wxmap:popupData");

    if (cachedData) {
      console.log("[API] Cache HIT for wxmap popup data");
      return JSON.parse(cachedData) as FeatureCollection<Point, StationPlotPopupData>;
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
      .then((results) => limitResultsByKeys(results, 3, "siteId"));

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

    const popupData = metarsQuery.reduce<Feature<Point, StationPlotPopupData>[]>((acc, m) => {
      if (!m.rawText || !m.stations) return acc;

      const siteId = m.siteId;

      const { lat, lon, name: siteName, country: siteCountry, state: siteState } = m.stations;

      const currentTaf = tafsQuery.find((t) => t.siteId === siteId);

      const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

      if (existingFeature) {
        return acc;
      } else {
        const newFeature: Feature<Point, StationPlotPopupData> = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          properties: {
            siteId,
            siteName,
            siteCountry,
            siteState,
            metars: metarList[siteId] || [],
            taf: currentTaf ? currentTaf.rawText : null,
            dataType: "site",
          },
        };
        acc.push(newFeature);
        return acc;
      }
    }, []);

    const output = turf.featureCollection(popupData);

    await cacheClient.setEx("wxmap:popupData", 60 * 10, JSON.stringify(output));

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

      try {
        const alerts = await db.query.publicAlerts.findMany({
          where: { issueTime: { gt: new Date(Date.now() - 12 * HOUR) } },
        });

        const features: Feature<MultiPolygon, WxOAlertMapProperties>[] = alerts
          .filter((alert) => alert.coords !== null && alert.colour !== undefined)
          .map((alert) => {
            const { coords, ...properties } = alert;
            const geometry = JSON.parse(coords!) as MultiPolygon;

            return {
              type: "Feature",
              geometry,
              properties: {
                ...properties,
                dataType: "publicAlert",
                alertType: properties.type as AlertType,
                startTime: new Date(properties.issueTime).getTime(),
                expiryTime: new Date(properties.expiry).getTime(),
                colour: properties.colour as AlertColour,
                impact: properties.impact ?? "",
                confidence: properties.confidence ?? "",
                level: properties.level ?? 0,
              },
            };
          });

        const featureCollection: FeatureCollection<MultiPolygon, WxOAlertMapProperties> = {
          type: "FeatureCollection",
          features,
        };

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
});
