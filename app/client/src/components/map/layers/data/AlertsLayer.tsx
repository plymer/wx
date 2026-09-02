import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { usePublicAlertsFilterLevel, useShowPublicAlerts } from "@/stateStores/map/vectorData";
import { useQuery } from "@tanstack/react-query";
import type { FilterSpecification } from "maplibre-gl";
import { Source, Layer } from "react-map-gl/maplibre";

import { useDisplayTime } from "@/hooks/useDisplayTime";

interface Props {
  override?: boolean;
}

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
      ? [
          "all",
          ["in", ["get", "alertCode"], ["literal", ["STV", "STW", "TRW", "TRV"]]],
          ["<=", ["get", "startTime"], ["to-number", displayTime]],
          [">", ["get", "expiryTime"], ["to-number", displayTime]],
        ]
      : [
          "all",
          ["<=", ["get", "startTime"], ["to-number", displayTime]],
          [">", ["get", "expiryTime"], ["to-number", displayTime]],
        ];

  if (!override && !enabled) return null;

  return (
    <Source id="wxo-alerts-source" type="geojson" data={{ type: "FeatureCollection", features: data?.features ?? [] }}>
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
            ["match", ["get", "alertType"], "warning", 0.35, 0.175],
            7,
            0.05,
          ],
        }}
      />
      <Layer
        key="layer-wxo-alerts-outline-casing"
        id="layer-wxo-alerts-outline-casing"
        beforeId="place_state"
        filter={filter}
        type="line"
        paint={{
          "line-color": ["case", ["!=", ["get", "alertType"], "warning"], "black", ["get", "colour"]],
          "line-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            ["case", ["!=", ["get", "alertType"], "warning"], 1, 0],
            7,
            ["case", ["!=", ["get", "alertType"], "warning"], 1, 0.5],
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 2, 4, 8, 8],
          "line-offset": ["case", ["!=", ["get", "alertType"], "warning"], 1, 5],
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
          "line-opacity": ["match", ["get", "alertType"], "warning", 0.8, 1], // line-layer-opacity isn't supported in iOS safari???
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            ["match", ["get", "alertType"], "warning", 2, 1],
            8,
            ["match", ["get", "alertType"], "warning", 6, 2],
          ],
          "line-offset": ["match", ["get", "alertType"], "warning", 1.5, 1],
          "line-dasharray": ["match", ["get", "alertType"], "warning", ["literal", [1, 0]], ["literal", [3, 1]]],
        }}
      />

      <Layer
        key="layer-wxo-alerts-labels"
        id="layer-wxo-alerts-labels"
        beforeId="place_state"
        filter={filter}
        type="symbol"
        minzoom={3.8}
        paint={{
          "text-color": ["match", ["get", "alertType"], "statement", "white", ["get", "colour"]],
          "text-halo-color": "black",
          "text-halo-width": 2,
        }}
        layout={{
          "symbol-placement": ["step", ["zoom"], "point", 8, "line"],
          "symbol-spacing": 250,
          "text-field": ["step", ["zoom"], ["get", "alertNameShort"], 6, ["get", "bannerText"]],
          "text-size": 12,
          "text-allow-overlap": ["step", ["zoom"], true, 8, false],
          "text-variable-anchor": [
            "top",
            "bottom",
            "center",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "left",
            "right",
          ],
          "text-justify": "auto",
          "text-radial-offset": 0.5,
          "text-padding": 1,
          "text-font": ["Open-Sans-Italic"],
          "symbol-sort-key": ["get", "startTime"],
        }}
      />
    </Source>
  );
};
