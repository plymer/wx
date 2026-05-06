#!/usr/bin/node
import type { FeatureCollection, Point } from "geojson";
import * as turf from "@turf/turf";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCache, updateStationCache } from "./redis.js";
import { STATION_PRIORITY_MED, STATION_PRIORITY_MIN } from "../../config/tiles/stationPlots.js";

/**
 * Filters out points that are too close to each other
 * @param input A GeoJSON FeatureCollection of Points
 * @param minDistance Minimum allowed spacing between points (in nautical miles)
 * @param seedIds An array of site IDs to prioritize
 * @returns An array of strings (values of the given property from spaced points)
 */
function filterSpacedPoints(
  input: FeatureCollection<Point> | undefined,
  minDistance: number,
  seedIds: string[],
): string[] {
  if (!input) {
    console.warn("No input data for filterSpacedPoints, returning seedIds only.");
    return seedIds;
  }
  const retained: FeatureCollection<Point> = turf.featureCollection([]);
  const selected: string[] = [];
  const excludedIds = new Set(seedIds);

  // Seed retained points with already-prioritized stations so they win spacing checks.
  if (excludedIds.size > 0) {
    for (const feature of input.features) {
      const featureId = feature.properties?.["siteId"];
      if (typeof featureId === "string" && excludedIds.has(featureId)) {
        retained.features.push(feature);
      }
    }
  }

  for (const candidate of input.features) {
    const candidateId = candidate.properties?.["siteId"];
    if (typeof candidateId !== "string") continue;

    if (excludedIds.has(candidateId)) continue;

    const isTooClose = retained.features.some((existing) =>
      minDistance === 0 ? false : turf.distance(existing, candidate, { units: "nauticalmiles" }) < minDistance,
    );

    if (!isTooClose) {
      retained.features.push(candidate);
      excludedIds.add(candidateId);
      selected.push(candidateId);
    }
  }

  return selected;
}

export async function updateStationList() {
  console.log("Updating station list cache...");

  const { lastUpdatedTime, data } = await getCache("popup");

  const dataset = data as FeatureCollection<Point> | undefined;

  const stationFilterRadius = { min: 200, med: 100, max: 0 };

  const minStations = STATION_PRIORITY_MIN;
  const medStations = [
    ...STATION_PRIORITY_MED,
    ...filterSpacedPoints(dataset, stationFilterRadius.med, STATION_PRIORITY_MED),
  ];

  const stationList = {
    min: minStations,
    med: medStations,
    max: [...medStations, ...filterSpacedPoints(dataset, stationFilterRadius.max, medStations)],
  };

  const stationSetByZoom = {
    min: Array.from(new Set(stationList.min)),
    med: Array.from(new Set(stationList.med)),
    max: Array.from(new Set(stationList.max)),
  };

  console.log(
    `Station counts by zoom: min=${stationSetByZoom.min.length} med=${stationSetByZoom.med.length} max=${stationSetByZoom.max.length}`,
  );

  await updateStationCache({ data: stationSetByZoom, lastUpdatedTime });
  console.log("Station list cache updated.");
}

const isDirectExecution = (() => {
  const executedFile = process.argv[1];

  if (!executedFile) {
    return false;
  }

  return path.resolve(executedFile) === fileURLToPath(import.meta.url);
})();

if (isDirectExecution) {
  await updateStationList();
}
