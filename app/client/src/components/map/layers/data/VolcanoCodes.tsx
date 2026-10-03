import { Layer } from "react-map-gl/maplibre";

export const VolcanoCodes = () => {
  return (
    <Layer
      source="vector-tile-source"
      source-layer="volcano_codes"
      key="volcano-codes-data"
      filter={["all", ["!=", ["get", "colour"], "green"], ["!=", ["get", "colour"], "unassigned"]]}
      type="symbol"
      id="volcano-codes-data"
      layout={{
        "text-field": ["get", "name"],
        "text-overlap": "always",
        "text-size": 18,
        "text-font": ["Metropolis-Regular"],
      }}
      paint={{
        "text-color": ["get", "colour"],
        "text-halo-color": "white",
        "text-halo-width": 1,
      }}
    />
  );
};
