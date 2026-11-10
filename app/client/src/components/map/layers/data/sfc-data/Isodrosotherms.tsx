import { useShowIsodrosotherms } from "@/stateStores/map/vectorData";
import type { FilterSpecification } from "maplibre-gl";
import { Layer } from "react-map-gl/maplibre";

export const Isodrosotherms = () => {
  const enabled = useShowIsodrosotherms();

  const filter: FilterSpecification = [
    "all",
    ["<=", ["get", "start_time"], ["global-state", "time"]],
    [">", ["get", "expiry_time"], ["global-state", "time"]],
    [">", ["get", "value"], 0],
  ];

  if (!enabled) return null;

  return (
    <>
      <Layer
        id="layer-sfc-obs-isodrosotherms"
        type="line"
        source="vector-tile-source"
        source-layer="td"
        filter={filter}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
        paint={{
          "line-color": "#0f0",
          "line-layer-opacity": 0.8,
          "line-width": 2,
        }}
      />
      <Layer
        id="layer-sfc-obs-isodrosotherms-labels"
        type="symbol"
        source="vector-tile-source"
        source-layer="td"
        filter={filter}
        layout={{
          "icon-image": "icons:label-badge",
          "icon-text-fit": "both",
          "icon-text-fit-padding": [6, 12, 0, 12],
          "icon-rotation-alignment": "viewport",
          "icon-allow-overlap": true,
          "symbol-placement": "line",
          "symbol-spacing": 800,
          "text-field": ["to-string", ["round", ["get", "value"]]],
          "text-font": ["Metropolis-Regular"],
          "text-size": 12,
          "text-rotation-alignment": "viewport",
          "text-allow-overlap": true,
        }}
        paint={{
          "text-color": "#0f0",
          "icon-color": "black",
        }}
      />
    </>
  );
};
