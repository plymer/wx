import { ZOOM_THRESHOLDS } from "@/config/map";
import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { useShowIsodrosotherms } from "@/stateStores/map/vectorData";
import { MINUTE } from "@shared/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  currentFrame: number;
}

export const Isodrosotherms = ({ currentFrame }: Props) => {
  const enabled = useShowIsodrosotherms();

  const { data: isodrosothermData, isFetching: isodrosothermFetching } = useQuery(
    api.wxmap.wxmapIsolines.queryOptions(
      { type: "td" },
      {
        enabled,
        refetchInterval: 5 * MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  useMapLoadingState("sfc-isodrosotherms", isodrosothermFetching);

  const isodrosotherms = useMemo(() => isodrosothermData?.[currentFrame], [isodrosothermData, currentFrame]);

  if (!enabled) return null;

  return (
    <Source
      id="sfc-obs-isodrosotherms"
      type="geojson"
      data={isodrosotherms ?? { type: "FeatureCollection", features: [] }}
    >
      <Layer
        id="layer-sfc-obs-isodrosotherms"
        type="line"
        maxzoom={ZOOM_THRESHOLDS.maximum}
        filter={[">=", ["get", "value"], 5]}
        layout={{
          "line-join": "round",
          "line-cap": "round",
        }}
        paint={{
          "line-color": "#0f0",
          "line-width": 2,
        }}
      />
      <Layer
        id="layer-sfc-obs-isodrosotherms-labels"
        type="symbol"
        maxzoom={ZOOM_THRESHOLDS.maximum}
        filter={[">=", ["get", "value"], 5]}
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
          "text-color": "#0f0",
          "text-halo-color": "#000",
          "text-halo-width": 1.5,
        }}
      />
    </Source>
  );
};
