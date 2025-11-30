import { and, asc, eq, gt, inArray } from "drizzle-orm";
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from "geojson";
import { TRPCError } from "@trpc/server";

import type {
  MetarElements,
  MetarWithStation,
  StationPlotData,
  StationPlotPopupData,
  WarningProperties,
  WxOAlert,
  WxOPolygonAlert,
  WxOPolygonProperties,
} from "../lib/types.js";
import { metars, stations, tafs } from "../db/tables/avwx.drizzle.js";
import { HOUR } from "../lib/constants.js";
import { wxmapMetarSchema } from "../validationSchemas/wxmap.zod.js";

import { avwxDb } from "../main.js";
import { publicProcedure, router } from "../lib/trpc.js";
import * as turf from "@turf/turf";
import { limitResultsByKeys } from "../lib/utils.js";

// Generic function to convert METAR query results to GeoJSON features
function buildMetarFeatures(queryResult: MetarWithStation[]): Feature<Point, StationPlotData>[] {
  return queryResult.reduce<Feature<Point, StationPlotData>[]>((acc, metar) => {
    const { siteId, category, td, tt, vis, validTime, wxString, windDir, windGst, windSpd, stations } = metar;

    if (!stations?.lat || !stations?.lon) {
      return acc;
    }

    const { lat, lon } = stations;
    const existingFeature = acc.find((feature) => feature.properties.siteId === siteId);

    const metarData: MetarElements = {
      category,
      td,
      tt,
      vis,
      validTime,
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
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const queryResult = (await avwxDb.query.metars.findMany({
      where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
      with: { stations: { columns: { lat: true, lon: true } } },
    })) as MetarWithStation[];

    const metarFeatures = turf.featureCollection(buildMetarFeatures(queryResult));

    return metarFeatures;
  }),

  wxmapPopupData: publicProcedure.query(async () => {
    if (!avwxDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No avwx connection available" });
    }

    const metarsQuery = await avwxDb.query.metars
      .findMany({
        where: gt(metars.validTime, new Date(Date.now() - 4 * HOUR)),
        with: { stations: { columns: { lat: true, lon: true, country: true, name: true, state: true } } },
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

    const tafsQuery = await avwxDb.query.tafs
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

    return turf.featureCollection(popupData);
  }),

  wxmapPublicWarnings: publicProcedure.query(async (): Promise<FeatureCollection<MultiPolygon, WarningProperties>> => {
    const metaDataSourceUrl = "https://weather.gc.ca/data/dms/alert_geojson_v2/alerts.public.en.geojson";

    const response = await fetch(metaDataSourceUrl, { headers: { "User-Agent": "PrairieWxApi/1.0" } });
    if (!response.ok) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch public warnings: ${response.statusText}`,
      });
    }

    const data = (await response.json()) as {
      type: "FeatureCollection";
      uuid: string;
      alerts: WxOPolygonAlert;
      features: Feature<MultiPolygon, WxOPolygonProperties>[];
    };

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
            colour: alertData.colour,
            impact: alertData.impact,
            confidence: alertData.confidence,
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
    return turf.simplify(dataCollection, { tolerance: 0.001, highQuality: false, mutate: true });
  }),
});
