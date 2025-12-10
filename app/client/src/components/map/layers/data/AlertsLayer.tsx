import { api } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { Source, Layer } from "react-map-gl/maplibre";

export const AlertsLayer = () => {
  const { data } = useQuery(
    api.wxmap.wxmapPublicWarnings.queryOptions(undefined, { trpc: { context: { skipBatch: true } } }),
  );

  return (
    <Source id="wxo-alerts-source" type="geojson" data={data ?? { type: "FeatureCollection", features: [] }}>
      <Layer
        id="wxo-alerts-layer"
        beforeId="tunnel_motorway_casing"
        type="fill"
        paint={{
          "fill-color": ["match", ["get", "type"], "warning", "#ff0000", "watch", "#ffff00", "#808080"],
          "fill-opacity": 0.45,
        }}
      />
      <Layer
        id="wxo-alerts-layer-labels"
        type="symbol"
        paint={{ "text-color": "white", "text-halo-color": "black", "text-halo-width": 2 }}
        layout={{ "text-field": ["get", "alertNameShort"], "text-size": 12, "text-allow-overlap": true }}
      />
      <Layer
        id="wxo-alerts-layer-outline"
        beforeId="wxo-alerts-layer-labels"
        type="line"
        paint={{
          "line-color": ["match", ["get", "type"], "warning", "#ff0000", "watch", "#ffff00", "#808080"],
          "line-opacity": 0.85,
        }}
      />
    </Source>
  );
};
