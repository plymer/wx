import "dotenv/config";
import { DEFAULT_REMOTE_HEADERS, HOUR } from "../lib/constants.js";
import type { WxOAlertMetadataProperties, WxOAlertFeatureProperties, TextDirection } from "../lib/types.js";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import * as turf from "@turf/turf";
import { cardinalToDegrees } from "../lib/utils.js";
import { pgDb as db } from "../services/database.js";

import { publicAlerts } from "../db/schemas.drizzle.js";
import { and, gt, inArray, lt, notInArray, type InferInsertModel } from "drizzle-orm";

type AlertsGeoJsonResponse = {
  type: "FeatureCollection";
  uuid: string;
  alerts: Record<string, WxOAlertMetadataProperties>;
  features: Feature<MultiPolygon, WxOAlertFeatureProperties>[];
};

export async function getPublicAlerts() {
  if (!db) {
    throw new Error("[METAR] Database connection failed.");
  }

  const sourceUrl = "https://weather.gc.ca/data/dms/alert_geojson_2_0/alerts.public.en.geojson";

  try {
    const response = await fetch(sourceUrl, {
      headers: DEFAULT_REMOTE_HEADERS,
    });
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

    // we also need to keep track of which alerts are still 'active' so we can update the expiry time of the alerts in the database that are no longer active
    const alertIdsInPayload = new Set<string>();

    // loop over every 'feature' in the feature collection
    alertsGeoJSON.features.forEach((feature) => {
      // get the alerts associated with this feature
      const alertArray = feature.properties.alerts;

      // for every active alert in the current feature, create a new feature with the same geometry but with the properties of the alert
      alertArray.forEach((alertObject) => {
        // extract the alert data from the alerts lookup by the alertRef (the key of the object in the json resposne)
        const alertData = alerts[alertObject.alertRef];

        // add the alert id to the set of alert ids in the payload
        alertIdsInPayload.add(alertData.id);

        // the new polygon text contains hex codes (\u00A0) in it (lmao wtf) so we need to remove them,
        // otherwise the client will throw an error when trying to render the text
        const text = alertData.text.replace(/[\u00A0\u202F]/g, " ");

        // we also need to parse the string to extract the motion vector from the text if the alert type is a 'freeform'

        let direction: number | null = null;
        let speed: number | null = null;

        if (alertData.zoneType === "freeform") {
          const motionVectorRegex = /moving\s+([a-z]+)\s+at\s+(\d{1,3})\s+km\/h/i;
          const match = text.match(motionVectorRegex);
          if (match) {
            const directionStr = match[1].toUpperCase() as TextDirection;
            speed = Number(match[2]); // convert speed to number

            direction = cardinalToDegrees(directionStr);
          }
        }

        const newFeature: Feature<MultiPolygon, WxOAlertMetadataProperties> = {
          type: "Feature",
          geometry: feature.geometry,
          properties: {
            ...alertData,
            text,
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
        const dissolved = turf.dissolve(featureCollection, {
          propertyName: "id",
        });

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
    const simplified = turf.simplify(dataCollection, {
      tolerance: 0.001,
      highQuality: false,
      mutate: true,
    });

    const output: InferInsertModel<typeof publicAlerts>[] = simplified.features.map((feature) => ({
      alertCode: feature.properties.alertCode,
      type: feature.properties.type,
      zoneType: feature.properties.zoneType,
      alertName: feature.properties.alertName,
      alertNameShort: feature.properties.alertNameShort,
      program: feature.properties.program,
      issueTime: new Date(feature.properties.issueTime),
      expiry: new Date(feature.properties.expiry),
      timezone: feature.properties.timezone,
      issueTimeText: feature.properties.issueTimeText,
      issuingOfficeTZ: feature.properties.issuingOfficeTZ,
      id: String(feature.properties.id),
      text: feature.properties.text,
      bannerText: feature.properties.bannerText,
      headerText: feature.properties.headerText,
      colour: feature.properties.colour,
      impact: feature.properties.impact,
      confidence: feature.properties.confidence,
      level: feature.properties.level,
      direction: feature.properties.direction,
      speed: feature.properties.speed,
      coords: JSON.stringify(feature.geometry),
    }));

    // dedupe by the same composite key used in onConflictDoUpdate to avoid
    // "cannot affect row a second time" when multiple rows share one key in a single batch
    const dedupedOutput = [
      ...new Map(
        output.map((row) => {
          const issueTimeKey = row.issueTime instanceof Date ? row.issueTime.toISOString() : String(row.issueTime);
          const expiryKey = row.expiry instanceof Date ? row.expiry.toISOString() : String(row.expiry);
          return [`${String(row.id)}|${issueTimeKey}|${expiryKey}`, row] as const;
        }),
      ).values(),
    ];

    const now = new Date();

    // now that we have the simplified, compacted features, let's write them to the database
    await db.transaction(async (tx) => {
      if (dedupedOutput.length > 0) {
        await tx.insert(publicAlerts).values(dedupedOutput).onConflictDoNothing();
      }

      // extract alert ids from the database that are no longer present in the payload and have not yet expired
      // we will need to force-expire them so they are no longer displayed on the map
      const staleAlerts = alertIdsInPayload.size
        ? await tx
            .select({ id: publicAlerts.id })
            .from(publicAlerts)
            .where(and(notInArray(publicAlerts.id, [...alertIdsInPayload]), gt(publicAlerts.expiry, now)))
        : await tx.select({ id: publicAlerts.id }).from(publicAlerts).where(gt(publicAlerts.expiry, now));

      const staleAlertIds = [...new Set(staleAlerts.map((alert) => alert.id))];

      console.log(`[WXO] [ALERTS] Found ${staleAlertIds.length} stale alerts to update.`);

      if (staleAlertIds.length === 0) return;

      // end any stale alerts by updating their expiry time to now
      await tx.update(publicAlerts).set({ expiry: now }).where(inArray(publicAlerts.id, staleAlertIds));
    });

    // finally, let's purge the database of alerts that are older than 24 hours
    await db.delete(publicAlerts).where(lt(publicAlerts.issueTime, new Date(now.getTime() - 24 * HOUR)));
  } catch (error) {
    throw new Error(`[WXO] [ALERTS] Error fetching public alerts: ${error}`);
  }
}
