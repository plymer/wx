import { Layer } from "react-map-gl/maplibre";

export const VolcanoCodes = () => {
  return (
    <>
      <Layer
        source="vector-tile-source"
        source-layer="volcano_codes"
        key="layer-volcano-codes-data-icon"
        filter={["all", ["!=", ["get", "colour"], "green"], ["!=", ["get", "colour"], "unassigned"]]}
        type="symbol"
        id="layer-volcano-codes-data-icon"
        layout={{
          "icon-image": "icons:volcano",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 0, 0.4, 6, 0.8],
          "icon-allow-overlap": true,
        }}
        paint={{
          "icon-color": ["get", "colour"],
          "icon-halo-color": "black",
          "icon-halo-width": 2,
        }}
      />
      <Layer
        source="vector-tile-source"
        source-layer="volcano_codes"
        key="layer-volcano-codes-data-label"
        filter={["all", ["!=", ["get", "colour"], "green"], ["!=", ["get", "colour"], "unassigned"]]}
        type="symbol"
        minzoom={4}
        id="layer-volcano-codes-data-label"
        layout={{
          "text-field": ["get", "name"],
          "text-allow-overlap": true,
          "text-size": ["interpolate", ["linear"], ["zoom"], 0, 12, 6, 18],
          "text-max-width": 4,
          "text-font": ["Metropolis-Regular"],
          "text-offset": [1, 0.25],
          "text-anchor": "left",
          "text-justify": "left",
        }}
        paint={{
          "text-color": "white",
          "text-halo-color": "black",
          "text-halo-width": 1,
        }}
      />
    </>
  );
};
