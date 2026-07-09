import { asc, gt } from "drizzle-orm";
import type { Feature, FeatureCollection, LineString, MultiPolygon, Point } from "geojson";
import { TRPCError } from "@trpc/server";
import * as fs from "fs/promises";
import path from "path";
import "dotenv/config";
import * as turf from "@turf/turf";

import type { StationPlotPopupData, WarningProperties, WxmapIsolineSlotMetadata } from "../lib/types.js";
import { metars, tafs } from "../db/schemas.drizzle.js";
import { HOUR } from "../lib/constants.js";

import { cacheClient, db } from "../main.js";
import { publicProcedure, router } from "../services/trpc.js";

import { limitResultsByKeys } from "../lib/utils.js";

// import { SITE_IGNORES } from "../config/alphanumeric.config.js";
import { wxmapIsolinesSchema } from "../validationSchemas/wxmap.zod.js";
import { PUBLIC_ALERTS_CACHE_KEY } from "../config/cache-keys.config.js";

// Generic function to convert METAR query results to GeoJSON features
// function buildMetarFeatures(queryResult: MetarWithStation[]): Feature<Point, StationPlotData>[] {
//   return queryResult.reduce<Feature<Point, StationPlotData>[]>((acc, metar) => {
//     const {
//       siteId,
//       category,
//       td,
//       tt,
//       vis,
//       validTime,
//       wxString,
//       windDir,
//       windGst,
//       windSpd,
//       stations,
//       mslp,
//       timeString,
//     } = metar;

//     if (!stations?.lat || !stations?.lon || SITE_IGNORES.includes(siteId)) {
//       return acc;
//     }

//     const { lat, lon } = stations;
//     const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

//     const metarData: Omit<MetarElements, "createdAt" | "stationPriority" | "stationType" | "obType" | "ceiling"> = {
//       category,
//       td,
//       tt,
//       vis,
//       mslp,
//       validTime,
//       timeString,
//       wxString,
//       windDir,
//       windGst,
//       windSpd,
//     };

//     if (existingFeature) {
//       existingFeature.properties.metars.push(metarData);
//     } else {
//       const newFeature: Feature<Point, StationPlotData> = {
//         type: "Feature",
//         geometry: {
//           type: "Point",
//           coordinates: [lon, lat],
//         },
//         properties: {
//           siteId,
//           stationPriority: siteId.startsWith("CY") ? 1 : siteId.startsWith("C") ? 2 : 3,
//           metars: [metarData],
//         },
//       };
//       acc.push(newFeature);
//     }

//     return acc;
//   }, []);
// }

export const wxmapRouter = router({
  //   wxmapMetars: publicProcedure.query(async (): Promise<FeatureCollection<Point, StationPlotData>> => {
  //     if (!db) {
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "No avwx connection available",
  //       });
  //     }

  //     const cachedData = await cacheClient.get("wxmap:metars");

  //     if (cachedData) {
  //       console.log("[API] Cache HIT for wxmap metars");
  //       return JSON.parse(cachedData) as FeatureCollection<Point, StationPlotData>;
  //     }

  //     console.log("[API] Cache MISS for wxmap metars. Fetching from source...");

  //     const queryResult = (await db.query.metars.findMany({
  //       where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
  //       with: { stations: { columns: { lat: true, lon: true } } },
  //     })) as MetarWithStation[];

  //     const output = turf.featureCollection(buildMetarFeatures(queryResult));

  //     await cacheClient.setEx("wxmap:metars", 60 * 15, JSON.stringify(output));

  //     return output;
  //   }),

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
        where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
        with: {
          stations: { columns: { lat: true, lon: true, country: true, name: true, state: true } },
        },
        orderBy: [asc(metars.validTime)],
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
        where: gt(tafs.validTime, new Date(Date.now() - 8 * HOUR)),
        orderBy: [asc(tafs.validTime)],
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

  wxmapIsolineSlots: publicProcedure.query(async (): Promise<WxmapIsolineSlotMetadata[]> => {
    const tilesRootDir = process.env.TILES_DIR
      ? path.resolve(process.env.TILES_DIR, "isolines")
      : path.resolve(process.cwd(), "tiles", "isolines");

    const entries = await fs.readdir(tilesRootDir, { withFileTypes: true }).catch(() => []);

    const slotDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const slot = Number.parseInt(entry.name, 10);
        if (Number.isNaN(slot) || slot < 0) {
          return null;
        }

        return { slot, name: entry.name };
      })
      .filter((entry): entry is { slot: number; name: string } => entry !== null)
      .sort((a, b) => a.slot - b.slot);

    const metadataResults = await Promise.all(
      slotDirs.map(async (slotDir) => {
        const metadataPath = path.join(tilesRootDir, slotDir.name, "metadata.json");
        const metadata = await fs
          .readFile(metadataPath, "utf-8")
          .then((data) => JSON.parse(data) as Omit<WxmapIsolineSlotMetadata, "slot">)
          .catch(() => null);

        if (!metadata) {
          return null;
        }

        return {
          slot: slotDir.slot,
          ...metadata,
        };
      }),
    );

    return metadataResults.filter((item): item is WxmapIsolineSlotMetadata => item !== null);
  }),

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
