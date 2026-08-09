import { useShowIsotherms } from "@/stateStores/map/vectorData";
import type { FilterSpecification } from "maplibre-gl";
import { Layer } from "react-map-gl/maplibre";

interface Props {
  displayTime: number;
}

export const Isotherms = ({ displayTime }: Props) => {
  const enabled = useShowIsotherms();

  const filter: FilterSpecification = [
    "all",
    ["<=", ["get", "start_time"], ["to-number", displayTime]],
    [">", ["get", "expiry_time"], ["to-number", displayTime]],
  ];

  if (!enabled) return null;

  return (
    <>
      <Layer
        id="layer-sfc-obs-isotherms"
        type="line"
        source="vector-tile-source"
        source-layer="tt"
        filter={filter}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
        paint={{
          "line-color": [
            "case",
            ["==", ["get", "value"], 0],
            "#f0f",
            ["case", ["<", ["get", "value"], 0], "#00f", "#f00"],
          ],
          "line-width": ["case", ["==", ["get", "value"], 0], 3, 1.5],
        }}
      />
      <Layer
        id="layer-sfc-obs-isotherms-labels"
        type="symbol"
        source="vector-tile-source"
        source-layer="tt"
        filter={filter}
        layout={{
          "symbol-placement": "line",
          "symbol-spacing": 800,
          "text-field": ["to-string", ["round", ["get", "value"]]],
          "text-font": ["Metropolis-Regular"],
          "text-size": 14,
          "text-rotation-alignment": "viewport",
          "text-allow-overlap": true,
        }}
        paint={{
          "text-color": [
            "case",
            ["==", ["get", "value"], 0],
            "#f0f",
            ["case", ["<", ["get", "value"], 0], "#00f", "#f00"],
          ],
          "text-halo-color": "#000",
          "text-halo-width": 12,
        }}
      />
    </>
  );
};
