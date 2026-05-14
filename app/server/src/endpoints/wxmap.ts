import { gt } from "drizzle-orm";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";
import { TRPCError } from "@trpc/server";
import * as fs from "fs/promises";
import path from "path";
import "dotenv/config";
import * as turf from "@turf/turf";

import type {
  MetarElements,
  MetarWithStation,
  StationPlotData,
  WarningProperties,
  WxOAlert,
  WxOPolygonAlert,
  WxOPolygonProperties,
} from "../lib/types.js";
import { metars } from "../db/tables/data.drizzle.js";
import { HOUR } from "../lib/constants.js";

import { cacheClient, db } from "../main.js";
import { publicProcedure, router } from "../lib/trpc.js";

import { SITE_IGNORES } from "../config/alphanumeric.config.js";

// Generic function to convert METAR query results to GeoJSON features
function buildMetarFeatures(queryResult: MetarWithStation[]): Feature<Point, StationPlotData>[] {
  return queryResult.reduce<Feature<Point, StationPlotData>[]>((acc, metar) => {
    const { siteId, category, td, tt, vis, validTime, wxString, windDir, windGst, windSpd, stations, mslp } = metar;

    if (!stations?.lat || !stations?.lon || SITE_IGNORES.includes(siteId)) {
      return acc;
    }

    const { lat, lon } = stations;
    const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

    const metarData: Omit<MetarElements, "createdAt"> = {
      category,
      td,
      tt,
      vis,
      mslp,
      validTime,
      validTimeString: validTime.toISOString().replace("T", " ").slice(11, -8),
      wxString,
      windDir,
      windGst,
      windSpd,
    };

    if (existingFeature) {
      existingFeature.properties.metars.push(metarData);
    } else {
      const newFeature: Feature<Point, StationPlotData> = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties: {
          siteId,
          stationPriority: siteId.startsWith("CY") ? 1 : siteId.startsWith("C") ? 2 : 3,
          metars: [metarData],
        },
      };
      acc.push(newFeature);
    }

    return acc;
  }, []);
}

export const wxmapRouter = router({
  wxmapMetars: publicProcedure.query(async (): Promise<FeatureCollection<Point, StationPlotData>> => {
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const cachedData = await cacheClient.get("wxmap:metars");

    if (cachedData) {
      console.log("[API] Cache HIT for wxmap metars");
      return JSON.parse(cachedData) as FeatureCollection<Point, StationPlotData>;
    }

    console.log("[API] Cache MISS for wxmap metars. Fetching from source...");

    const queryResult = (await db.query.metars.findMany({
      where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
      with: { stations: { columns: { lat: true, lon: true } } },
    })) as MetarWithStation[];

    const output = turf.featureCollection(buildMetarFeatures(queryResult));

    await cacheClient.setEx("wxmap:metars", 60 * 15, JSON.stringify(output));

    return output;
  }),

  wxmapPublicWarnings: publicProcedure.query(async (): Promise<FeatureCollection<MultiPolygon, WarningProperties>> => {
    const cachedData = await cacheClient.get("wxmap:publicWarnings");

    if (cachedData) {
      console.log("[API] Cache HIT for WxMap Public Warnings");
      return JSON.parse(cachedData) as FeatureCollection<MultiPolygon, WarningProperties>;
    }

    console.log("[API] Cache MISS for WxMap Public Warnings. Fetching from source...");

    const fileName = "public-alerts.json";

    const fileLocation = process.env.STATIC_DATA_DIR
      ? path.join(process.env.STATIC_DATA_DIR, fileName)
      : path.resolve("../../static-data", fileName);

    const data = await fs
      .readFile(fileLocation)
      .then(
        (data) =>
          JSON.parse(data.toString()) as {
            type: "FeatureCollection";
            uuid: string;
            alerts: WxOPolygonAlert;
            features: Feature<MultiPolygon, WxOPolygonProperties>[];
          },
      )
      .catch((error) => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to read Public Warnings from file: ${error.message}`,
        });
      });

    const alerts = Object.entries(data.alerts).reduce<Record<string, WxOAlert>>((acc, [alertRef, alert]) => {
      acc[alertRef] = alert;
      return acc;
    }, {});

    // create new features based on the alerts that are presently active
    // each feature may have multiple alerts associated with it, so we need to create multiple features (with the same geometry) for each alert

    const extractedFeatures: Feature<MultiPolygon, WarningProperties>[] = [];

    data.features.forEach((feature) => {
      const alertArray = feature.properties.alerts;

      alertArray.forEach((alertObject) => {
        const alertData = alerts[alertObject.alertRef];

        const newFeature: Feature<MultiPolygon, WarningProperties> = {
          type: "Feature",
          geometry: feature.geometry,
          properties: {
            alertCode: alertData.alertCode,
            type: alertData.type,
            issueTime: alertData.issueTime,
            alertNameShort: alertData.alertNameShort,
            bannerText: alertData.bannerText,
            eventEndTime: alertData.eventEndTime,
            eventOnsetTime: alertData.eventOnsetTime,
            colour: alertData.colour,
            impact: alertData.impact,
            confidence: alertData.confidence,
            dataType: "publicAlert",
          },
        };

        extractedFeatures.push(newFeature);
      });
    });

    // now we want to dissolve all feature polygons of the same alert code into single features
    // group features by alertCode and flatten MultiPolygons to Polygons
    const groupedByAlertCode = extractedFeatures.reduce<Record<string, Feature<Polygon, WarningProperties>[]>>(
      (acc, feature) => {
        const alertCode = feature.properties.alertCode;
        if (!acc[alertCode]) {
          acc[alertCode] = [];
        }

        // flatten MultiPolygon to individual Polygons
        const flattened = turf.flatten(feature);
        flattened.features.forEach((f) => {
          acc[alertCode].push({
            type: "Feature",
            geometry: f.geometry as Polygon,
            properties: feature.properties,
          });
        });

        return acc;
      },
      {},
    );

    // dissolve each group
    const dissolvedFeatures: Feature<MultiPolygon, WarningProperties>[] = [];

    Object.entries(groupedByAlertCode).forEach(([_, features]) => {
      const properties = features[0].properties;

      if (features.length === 1) {
        // only one polygon for this alert code, convert back to MultiPolygon
        dissolvedFeatures.push({
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: [features[0].geometry.coordinates],
          },
          properties,
        });
      } else {
        // combine all polygons with the same alert code
        const featureCollection = turf.featureCollection(features);
        const dissolved = turf.dissolve(featureCollection, { propertyName: "alertCode" });

        // convert dissolved Polygons back to MultiPolygons
        dissolved.features.forEach((dissolvedFeature) => {
          let geometry: MultiPolygon;

          if (dissolvedFeature.geometry.type === "Polygon") {
            geometry = {
              type: "MultiPolygon",
              coordinates: [dissolvedFeature.geometry.coordinates],
            };
          } else {
            // dissolve can sometimes return MultiPolygon if there are disjoint areas
            geometry = dissolvedFeature.geometry as unknown as MultiPolygon;
          }

          dissolvedFeatures.push({
            type: "Feature",
            geometry,
            properties,
          });
        });
      }
    });

    const dataCollection: FeatureCollection<MultiPolygon, WarningProperties> = {
      type: "FeatureCollection",
      features: dissolvedFeatures,
    };

    // simplify the polygons to reduce complexity, improve client performance, and reduce payload size
    const output = turf.simplify(dataCollection, { tolerance: 0.001, highQuality: false, mutate: true });
    await cacheClient.setEx("wxmap:publicWarnings", 60 * 10, JSON.stringify(output));

    return output;
  }),
});
