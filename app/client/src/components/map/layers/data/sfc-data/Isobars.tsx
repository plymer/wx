import { useRealtimeTilesUrl } from "@/hooks/useRealtimeTilesUrl";
import { useShowIsobars } from "@/stateStores/map/vectorData";
import type { FilterSpecification } from "maplibre-gl";
import { Layer, Source } from "react-map-gl/maplibre";

export const Isobars = ({ frameTime }: { frameTime: number }) => {
  const enabled = useShowIsobars();
  const tileUrl = useRealtimeTilesUrl();

  const lineFilter: FilterSpecification = [
    "all",
    ["<", ["get", "startTime"], ["to-number", frameTime]],
    [">=", ["get", "expiryTime"], ["to-number", frameTime]],
  ];

  const extremaFilter: FilterSpecification = [
    "all",
    ["<", ["get", "startTime"], ["to-number", frameTime]],
    [">=", ["get", "expiryTime"], ["to-number", frameTime]],
    ["has", "kind"],
  ];

  if (!enabled) return null;

  return (
    <>
      <Source key={`sfc-obs-isobars`} id={`sfc-obs-isobars`} type="vector" tiles={[tileUrl]} maxzoom={9} minzoom={2}>
        <Layer
          id={`layer-sfc-obs-isobars`}
          source-layer="isobar"
          type="line"
          filter={lineFilter}
          layout={{
            "line-join": "round",
            "line-cap": "round",
          }}
          paint={{
            "line-color": "#111",
            "line-width": ["case", ["==", ["%", ["-", ["to-number", ["get", "value"]], 1000], 24], 0], 6, 3],
          }}
        />
        <Layer
          id={`layer-sfc-obs-isobars-labels`}
          source-layer="isobar"
          type="symbol"
          filter={lineFilter}
          layout={{
            "symbol-placement": "line",
            "symbol-spacing": 600,
            "text-field": ["to-string", ["round", ["get", "value"]]],
            "text-font": ["Metropolis-Regular"],

            "text-size": 16,
            "text-rotation-alignment": "viewport",
            "text-allow-overlap": true,
          }}
          paint={{
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 1.5,
          }}
        />
        <Layer
          id={`layer-sfc-obs-mslp-extrema-value`}
          source-layer="isobar"
          type="symbol"
          filter={extremaFilter}
          layout={{
            "text-field": ["get", "value"],
            "text-allow-overlap": true,
            "text-anchor": "center",
            "text-offset": [0, 0.25],
            "text-font": ["Metropolis-Regular"],
          }}
          paint={{
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 2,
          }}
        />
        <Layer
          id={`layer-sfc-obs-mslp-extrema-marker`}
          source-layer="isobar"
          type="symbol"
          filter={extremaFilter}
          layout={{
            "text-field": ["match", ["get", "kind"], "max", "H", "min", "L", ""],
            "text-allow-overlap": true,
            "text-anchor": "bottom",
            "text-size": 48,
            "text-font": ["Open-Sans-Italic"],
          }}
          paint={{
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 2,
          }}
        />
      </Source>
    </>
  );
};
