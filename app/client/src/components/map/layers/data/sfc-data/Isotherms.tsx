import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { useShowIsotherms } from "@/stateStores/map/vectorData";
import { MINUTE } from "@shared/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  currentFrame: number;
}

export const Isotherms = ({ currentFrame }: Props) => {
  const enabled = useShowIsotherms();

  const { data: isothermData, isFetching: isothermFetching } = useQuery(
    api.wxmap.wxmapIsolines.queryOptions(
      { type: "tt" },
      {
        enabled,
        refetchInterval: 10 * MINUTE,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  useMapLoadingState("sfc-isotherms", isothermFetching);

  const isotherms = useMemo(() => isothermData?.[currentFrame], [isothermData, currentFrame]);

  if (!enabled) return null;

  return (
    <Source id="sfc-obs-isotherms" type="geojson" data={isotherms ?? { type: "FeatureCollection", features: [] }}>
      <Layer
        id="layer-sfc-obs-isotherms"
        type="line"
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
