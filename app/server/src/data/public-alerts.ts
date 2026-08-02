import "dotenv/config";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";
import type { WarningProperties, WxOAlert, WxOPolygonAlert, WxOPolygonProperties } from "../lib/types.js";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import * as turf from "@turf/turf";
import { cacheClient } from "../services/redis.js";
import { PUBLIC_ALERTS_CACHE_KEY } from "../config/cache-keys.config.js";

type AlertsGeoJsonResponse = {
  type: "FeatureCollection";
  uuid: string;
  alerts: WxOPolygonAlert;
  features: Feature<MultiPolygon, WxOPolygonProperties>[];
};

export async function getPublicAlerts() {
  const sourceUrl = "https://weather.gc.ca/data/dms/alert_geojson_2_0/alerts.public.en.geojson";

  try {
    const response = await fetch(sourceUrl, { headers: DEFAULT_REMOTE_HEADERS });
    if (!response.ok) {
      throw new Error(`[WXO] [ALERTS] Failed to fetch public alerts: ${response.statusText}`);
    }

    // extract the GeoJSON from the response
    const alertsGeoJSON = (await response.json()) as AlertsGeoJsonResponse;

    const alerts = Object.entries(alertsGeoJSON.alerts).reduce<Record<string, WxOAlert>>((acc, [alertRef, alert]) => {
      acc[alertRef] = alert;
      return acc;
    }, {});

    // create new features based on the alerts that are presently active
    // each feature may have multiple alerts associated with it, so we need to create multiple features (with the same geometry) for each alert

    const extractedFeatures: Feature<MultiPolygon, WarningProperties>[] = [];

    // loop over every 'feature' in the feature collection
    alertsGeoJSON.features.forEach((feature) => {
      // get the alerts associated with this feature
      const alertArray = feature.properties.alerts;

      // for every active alert in the current feature, create a new feature with the same geometry but with the properties of the alert
      alertArray.forEach((alertObject) => {
        // extract the alert data from the alerts lookup by the alertRef (the key of the object in the json resposne)
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
    const groupedAlerts = extractedFeatures.reduce<Record<string, Feature<Polygon, WarningProperties>[]>>(
      (acc, feature) => {
        const alertCode = feature.properties.alertCode;
        const alertColor = feature.properties.colour;
        const key = `${alertCode}-${alertColor}`;
        if (!acc[key]) {
          acc[key] = [];
        }

        // flatten MultiPolygon to individual Polygons
        const flattened = turf.flatten(feature);
        flattened.features.forEach((f) => {
          acc[key].push({
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

    Object.entries(groupedAlerts).forEach(([_, features]) => {
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
    const output = turf.simplify(dataCollection, {
      tolerance: 0.001,
      highQuality: false,
      mutate: true,
    });

    // add to the cache
    await cacheClient.setEx(PUBLIC_ALERTS_CACHE_KEY, 60 * 10, JSON.stringify(output));
  } catch (error) {
    console.error(`[WXO] [ALERTS] Error fetching public alerts: ${error}`);
    return;
  }
}
