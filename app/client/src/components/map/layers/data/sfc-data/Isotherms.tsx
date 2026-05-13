import { useRealtimeTilesUrl } from "@/hooks/useRealtimeTilesUrl";
import { useShowIsotherms } from "@/stateStores/map/vectorData";
import type { FilterSpecification } from "maplibre-gl";
import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  frameTime: number;
}

export const Isotherms = ({ frameTime }: Props) => {
  const enabled = useShowIsotherms();
  const tileUrl = useRealtimeTilesUrl();

  const lineFilter: FilterSpecification = [
    "all",
    ["<", ["get", "startTime"], ["to-number", frameTime]],
    [">=", ["get", "expiryTime"], ["to-number", frameTime]],
  ];

  if (!enabled) return null;

  return (
    <Source id="sfc-obs-isotherms" type="vector" tiles={[tileUrl]} maxzoom={9} minzoom={2}>
      <Layer
        id="layer-sfc-obs-isotherms"
        type="line"
        source-layer="isotherm"
        filter={lineFilter}
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
        source-layer="isotherm"
        filter={lineFilter}
        layout={{
          "symbol-placement": "line",
          "symbol-spacing": 800,
          "text-field": ["to-string", ["round", ["get", "value"]]],
          "text-font": ["Consolas-Regular"],
          "text-size": 18,
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
          "text-halo-color": "#fff",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
};
