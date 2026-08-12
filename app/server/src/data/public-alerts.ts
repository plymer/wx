import "dotenv/config";
import { DEFAULT_REMOTE_HEADERS } from "../lib/constants.js";
import type { WxOAlertMetadataProperties, WxOAlertFeatureProperties, TextDirection } from "../lib/types.js";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import * as turf from "@turf/turf";
import { cacheClient } from "../services/redis.js";
import { PUBLIC_ALERTS_CACHE_KEY } from "../config/cache-keys.config.js";
import { cardinalToDegrees } from "../lib/utils.js";

type AlertsGeoJsonResponse = {
  type: "FeatureCollection";
  uuid: string;
  alerts: Record<string, WxOAlertMetadataProperties>;
  features: Feature<MultiPolygon, WxOAlertFeatureProperties>[];
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

    const alerts = Object.entries(alertsGeoJSON.alerts).reduce<Record<string, WxOAlertMetadataProperties>>(
      (acc, [alertRef, alert]) => {
        acc[alertRef] = alert;
        return acc;
      },
      {},
    );

    // create new features based on the alerts that are presently active
    // each feature may have multiple alerts associated with it, so we need to create multiple features (with the same geometry) for each alert

    const extractedFeatures: Feature<MultiPolygon, WxOAlertMetadataProperties>[] = [];

    // loop over every 'feature' in the feature collection
    alertsGeoJSON.features.forEach((feature) => {
      // get the alerts associated with this feature
      const alertArray = feature.properties.alerts;

      // for every active alert in the current feature, create a new feature with the same geometry but with the properties of the alert
      alertArray.forEach((alertObject) => {
        // extract the alert data from the alerts lookup by the alertRef (the key of the object in the json resposne)
        const alertData = alerts[alertObject.alertRef];

        // the new polygon text contains hex codes (\u00A0) in it (lmao wtf) so we need to remove them,
        // otherwise the client will throw an error when trying to render the text
        const text = alertData.text.replace(/[\u00A0\u202F]/g, " ");

        // we also need to parse the string to extract the motion vector from the text if the alert type is a 'freeform'

        let direction: number | null = null;
        let speed: number | null = null;

        if (alertData.zoneType === "freeform") {
          console.log(`[WXO] [ALERTS] Parsing motion vector from text: ${text}`);

          const motionVectorRegex = /moving\s+([a-z]+)\s+at\s+(\d{1,3})\s+km\/h/i;
          const match = text.match(motionVectorRegex);
          if (match) {
            console.log(`[WXO] [ALERTS] Motion vector found: ${match[1]} at ${match[2]} km/h`);
            const directionStr = match[1].toUpperCase() as TextDirection;
            speed = Number(match[2]); // convert speed to number

            direction = cardinalToDegrees(directionStr);
          } else {
            console.log(`[WXO] [ALERTS] No motion vector found in text`);
          }

          console.log("-------", direction, speed);
        }

        const newFeature: Feature<MultiPolygon, WxOAlertMetadataProperties> = {
          type: "Feature",
          geometry: feature.geometry,
          properties: {
            ...alertData,
            text: alertData.text.replace(/[\u00A0\u202F]/g, " "), // the new polygon text contains hex codes (\u00A0) in it (lmao wtf) so we need to remove them, otherwise the client will throw an error when trying to render the text
            weighting: String(alertData.weighting),
            direction,
            speed,
            dataType: "publicAlert",
          },
        };

        extractedFeatures.push(newFeature);
      });
    });

    // now we want to dissolve all feature polygons of the same alert code into single features
    // group features by alertCode and flatten MultiPolygons to Polygons
    const groupedAlerts = extractedFeatures.reduce<Record<string, Feature<Polygon, WxOAlertMetadataProperties>[]>>(
      (acc, feature) => {
        const alertId = feature.properties.id;

        if (!acc[alertId]) {
          acc[alertId] = [];
        }

        // flatten MultiPolygon to individual Polygons
        const flattened = turf.flatten(feature);
        flattened.features.forEach((f) => {
          acc[alertId].push({
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
    const dissolvedFeatures: Feature<MultiPolygon, WxOAlertMetadataProperties>[] = [];

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
        const dissolved = turf.dissolve(featureCollection, { propertyName: "id" });

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

    const dataCollection: FeatureCollection<MultiPolygon, WxOAlertMetadataProperties> = {
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
