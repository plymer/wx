import { api } from "@/lib/trpc";
import { useShowPublicAlerts } from "@/stateStores/map/vectorData";
import { useQuery } from "@tanstack/react-query";
import { Source, Layer } from "react-map-gl/maplibre";

interface Props {
  override?: boolean;
}

export const AlertsLayer = ({ override }: Props) => {
  const enabled = useShowPublicAlerts();

  const { data } = useQuery(
    api.wxmap.wxmapPublicWarnings.queryOptions(undefined, { trpc: { context: { skipBatch: true } } }),
  );

  if (!override && !enabled) return null;

  return (
    <Source id="wxo-alerts-source" type="geojson" data={data ?? { type: "FeatureCollection", features: [] }}>
      <Layer
        key="layer-wxo-alerts"
        id="layer-wxo-alerts"
        beforeId="tunnel_motorway_casing"
        type="fill"
        paint={{
          "fill-color": ["match", ["get", "type"], "warning", "#ff0000", "watch", "#ffff00", "#808080"],
          "fill-opacity": 0.45,
        }}
      />
      <Layer
        key="layer-wxo-alerts-outline"
        id="layer-wxo-alerts-outline"
        beforeId="place_state"
        type="line"
        minzoom={4}
        paint={{
          "line-color": ["match", ["get", "type"], "warning", "#ff0000", "watch", "#ffff00", "#808080"],
          "line-opacity": 0.85,
          "line-width": 5,
        }}
      />
      <Layer
        key="layer-wxo-alerts-labels"
        id="layer-wxo-alerts-labels"
        beforeId="place_state"
        type="symbol"
        minzoom={4.75}
        paint={{ "text-color": "white", "text-halo-color": "black", "text-halo-width": 2 }}
        layout={{ "text-field": ["get", "alertBannerText"], "text-size": 12, "text-allow-overlap": true }}
      />
    </Source>
  );
};
