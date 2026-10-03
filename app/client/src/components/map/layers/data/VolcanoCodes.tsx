import { useShowVolcanoes } from "@/stateStores/map/vectorData";
import { Layer } from "react-map-gl/maplibre";

export const VolcanoCodes = () => {
  const enabled = useShowVolcanoes();

  if (!enabled) return null;

  return (
    <>
      <Layer
        source="vector-tile-source"
        source-layer="volcano_codes"
        key="volcano-codes-data"
        filter={["all", ["!=", ["get", "colour"], "green"], ["!=", ["get", "colour"], "unassigned"]]}
        type="symbol"
        id="volcano-codes-data"
        layout={{
          "icon-image": "icons:volcano",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 0, 0.4, 6, 0.8],
          "icon-allow-overlap": true,
          "text-field": ["get", "name"],
          "text-allow-overlap": true,
          "text-size": ["interpolate", ["linear"], ["zoom"], 0, 12, 6, 18],
          "text-max-width": 4,
          "text-font": ["Metropolis-Regular"],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        }}
        paint={{
          "icon-color": ["get", "colour"],
          "icon-halo-color": "black",
          "icon-halo-width": 2,
          "text-color": "white",
          "text-halo-color": "black",
          "text-halo-width": 1,
        }}
      />
    </>
  );
};
