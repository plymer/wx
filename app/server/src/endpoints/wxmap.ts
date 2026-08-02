import type { Feature, FeatureCollection, LineString, MultiPolygon, Point } from "geojson";
import { TRPCError } from "@trpc/server";

import "dotenv/config";
import * as turf from "@turf/turf";

import type { StationPlotPopupData, WarningProperties } from "../lib/types.js";

import { HOUR } from "../lib/constants.js";

import { limitResultsByKeys } from "../lib/utils.js";
import { wxmapIsolinesSchema } from "../validationSchemas/wxmap.zod.js";
import { PUBLIC_ALERTS_CACHE_KEY } from "../config/cache-keys.config.js";

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

  wxmapIsolines: publicProcedure
    .input(wxmapIsolinesSchema)
    .query(
      async ({
        input,
      }): Promise<
        FeatureCollection<Point | LineString, { value: number } | { kind: "max" | "min"; value: number }>[]
      > => {
        const { type } = input;

        const cachedData = await cacheClient.lRange(`wxmap:isolines:${type}`, 0, -1);

        if (cachedData.length > 0) {
          console.log(`[API] Cache HIT for WxMap Isolines - ${type} (${cachedData.length} items)`);

          return cachedData.flatMap((item) => JSON.parse(item)) as FeatureCollection<
            Point | LineString,
            { value: number } | { kind: "max" | "min"; value: number }
          >[];
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No cache client available for isolines",
          });
        }
      },
    ),

  // deprecated
  wxmapPublicWarnings: publicProcedure
    .meta({ deprecated: true })
    .query(async (): Promise<FeatureCollection<MultiPolygon, WarningProperties> | null> => {
      const cachedData = await cacheClient.get(PUBLIC_ALERTS_CACHE_KEY);

      if (cachedData) {
        console.log("[API] Cache HIT for WxMap Public Warnings");
        return JSON.parse(cachedData) as FeatureCollection<MultiPolygon, WarningProperties>;
      }

      console.error("[API] [ERROR] Cache MISS for WxMap Public Warnings - no cache data found.");
      return null;
    }),

  wxmapPublicAlerts: publicProcedure.query(
    async (): Promise<FeatureCollection<MultiPolygon, WarningProperties> | null> => {
      const cachedData = await cacheClient.get(PUBLIC_ALERTS_CACHE_KEY);

      if (cachedData) {
        console.log("[API] Cache HIT for WxMap Public Alerts");
        return JSON.parse(cachedData) as FeatureCollection<MultiPolygon, WarningProperties>;
      }

      console.error("[API] [ERROR] Cache MISS for WxMap Public Alerts - no cache data found.");
      return null;
    },
  ),
});
