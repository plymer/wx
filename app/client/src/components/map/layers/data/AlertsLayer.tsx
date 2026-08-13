import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { usePublicAlertsFilterLevel, useShowPublicAlerts } from "@/stateStores/map/vectorData";
import { HOUR } from "@shared/lib/constants";
import { useQuery } from "@tanstack/react-query";
import type { FilterSpecification } from "maplibre-gl";
import { Source, Layer } from "react-map-gl/maplibre";
import * as turf from "@turf/turf";
import type { Feature, MultiPolygon } from "geojson";
import type { WxOAlertMetadataProperties } from "@shared/lib/types";
import { useDisplayTime } from "@/hooks/useDisplayTime";

interface Props {
  override?: boolean;
}

const applyMotionVector = (
  displayTime: number,
  startTime: number,
  feature: Feature<MultiPolygon, WxOAlertMetadataProperties>,
) => {
  // if we have no motion vector, our object is stationary so bail out
  if (!feature || !feature.properties || !feature.properties.speed || !feature.properties.direction) return feature;

  // calculate the elapsed time in milliseconds
  const elapsedTime = (displayTime - startTime) / HOUR;

  // speed is in knots
  const spd = feature.properties.speed;

  // direction is in degrees, or can be null for STNR Xmets
  const direction = feature.properties.direction ?? 0;

  // nautical miles traveled in the elapsed time
  const distance = spd * elapsedTime;

  const translated = turf.transformTranslate(turf.multiPolygon(feature.geometry.coordinates), distance, direction, {
    units: "kilometres",
  });

  return { ...translated, properties: feature.properties };
};

export const AlertsLayer = ({ override }: Props) => {
  const displayTime = useDisplayTime();
  const enabled = useShowPublicAlerts();
  const filterAlertLevel = usePublicAlertsFilterLevel();

  const { data, isFetching } = useQuery(
    api.wxmap.wxmapPublicAlerts.queryOptions(undefined, { trpc: { context: { skipBatch: true } } }),
  );

  useMapLoadingState("alerts", isFetching);

  const filter: FilterSpecification =
    filterAlertLevel === "convective"
      ? ["all", ["in", ["get", "alertCode"], ["literal", ["STV", "STW", "TRW", "TRV"]]]]
      : ["all"];

  const nonWarningCasingFilter: FilterSpecification =
    filterAlertLevel === "convective"
      ? [
          "all",
          ["in", ["get", "alertCode"], ["literal", ["STV", "STW", "TRW", "TRV"]]],
          ["!=", ["get", "type"], "warning"],
        ]
      : ["all", ["!=", ["get", "type"], "warning"]];

  if (!override && !enabled) return null;

  const features = data?.features
    .filter((f) => {
      if (f.properties.zoneType === "freeform") {
        return new Date(f.properties.issueTime).getTime() < displayTime;
      }
      return true;
    })
    .map((f) => applyMotionVector(displayTime, new Date(f.properties.issueTime).getTime(), f));

  return (
    <Source id="wxo-alerts-source" type="geojson" data={{ type: "FeatureCollection", features: features ?? [] }}>
      <Layer
        key="layer-wxo-alerts"
        id="layer-wxo-alerts"
        beforeId="tunnel_motorway_casing"
        filter={filter}
        type="fill"
        paint={{
          "fill-color": ["case", ["has", "colour"], ["get", "colour"], "grey"],
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            ["match", ["get", "type"], "warning", 0.35, 0.175],
            7,
            0.05,
          ],
        }}
      />
      <Layer
        key="layer-wxo-alerts-outline-casing"
        id="layer-wxo-alerts-outline-casing"
        beforeId="place_state"
        filter={nonWarningCasingFilter}
        type="line"
        paint={{
          "line-color": "black",
          "line-opacity": 1,
          "line-width": ["interpolate", ["linear"], ["zoom"], 2, 4, 8, 8],
          "line-offset": 1,
        }}
      />
      <Layer
        key="layer-wxo-alerts-outline"
        id="layer-wxo-alerts-outline"
        beforeId="place_state"
        filter={filter}
        type="line"
        paint={{
          "line-color": ["case", ["has", "colour"], ["get", "colour"], "grey"],
          "line-opacity": ["match", ["get", "type"], "warning", 0.8, 1], // line-layer-opacity isn't supported in iOS safari???
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            ["match", ["get", "type"], "warning", 2, 1],
            8,
            ["match", ["get", "type"], "warning", 6, 2],
          ],
          "line-offset": ["match", ["get", "type"], "warning", 1.5, 1],
          "line-dasharray": ["match", ["get", "type"], "warning", ["literal", [1, 0]], ["literal", [3, 1]]],
        }}
      />

      <Layer
        key="layer-wxo-alerts-labels"
        id="layer-wxo-alerts-labels"
        beforeId="place_state"
        filter={filter}
        type="symbol"
        minzoom={4.75}
        paint={{
          "text-color": ["match", ["get", "type"], "statement", "white", ["get", "colour"]],
          "text-halo-color": "black",
          "text-halo-width": 2,
        }}
        layout={{
          "symbol-placement": ["step", ["zoom"], "point", 8, "line"],
          "symbol-spacing": 250,
          "text-field": ["get", "bannerText"],
          "text-size": 12,
          "text-allow-overlap": true,
          "text-offset": ["step", ["zoom"], ["literal", [0, 0]], 8, ["literal", [0, 1]]],
          "text-font": ["Open-Sans-Italic"],
        }}
      />
    </Source>
  );
};
