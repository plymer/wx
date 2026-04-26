import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { useShowIsobars } from "@/stateStores/map/vectorData";
import { MINUTE } from "@shared/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  currentFrame: number;
}

export const Isobars = ({ currentFrame }: Props) => {
  const enabled = useShowIsobars();

  const { data: isobarData, isFetching: isobarFetching } = useQuery(
    api.wxmap.wxmapIsolines.queryOptions(
      { type: "mslp" },
      {
        enabled,
        refetchInterval: 10 * MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  useMapLoadingState("sfc-isobars", isobarFetching);

  const isobars = useMemo(() => isobarData?.[currentFrame], [isobarData, currentFrame]);

  if (!enabled) return null;

  return (
    <Source id="sfc-obs-isobars" type="geojson" data={isobars ?? { type: "FeatureCollection", features: [] }}>
      <Layer
        id="layer-sfc-obs-isobars"
        type="line"
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
        id="layer-sfc-obs-isobars-labels"
        type="symbol"
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
        id="layer-sfc-obs-mslp-extrema-value"
        type="symbol"
        filter={["has", "kind"]}
        layout={{
          "text-field": ["get", "value"],
          "text-allow-overlap": true,
          "text-anchor": "center",
          "text-offset": [0, 0.25],
          "text-font": ["Metropolis-Regular"],
        }}
        paint={{ "text-color": "#000", "text-halo-color": "#fff", "text-halo-width": 2 }}
      />
      <Layer
        id="layer-sfc-obs-mslp-extrema-marker"
        type="symbol"
        filter={["has", "kind"]}
        layout={{
          "text-field": ["match", ["get", "kind"], "max", "H", "min", "L", ""],
          "text-allow-overlap": true,
          "text-anchor": "bottom",
          "text-size": 48,
          "text-font": ["Open-Sans-Italic"],
        }}
        paint={{ "text-color": "#000", "text-halo-color": "#fff", "text-halo-width": 2 }}
      />
    </Source>
  );
};
