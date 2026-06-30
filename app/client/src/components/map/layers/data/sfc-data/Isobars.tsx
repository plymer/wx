import { useFrameCount } from "@/stateStores/map/animation";
import { useShowIsobars } from "@/stateStores/map/vectorData";
import { api } from "@/lib/trpc";
import { MINUTE } from "@shared/lib/constants";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { Layer, Source } from "react-map-gl/maplibre";
import { useMemo } from "react";

interface Props {
  currentFrame: number;
  displayTime: number;
}

export const Isobars = ({ currentFrame, displayTime }: Props) => {
  const enabled = useShowIsobars();
  const frameCount = useFrameCount();
  const { data: slotMetadata } = useQuery(
    api.wxmap.wxmapIsolineSlots.queryOptions(undefined, {
      enabled,
      refetchInterval: MINUTE,
      placeholderData: keepPreviousData,
      trpc: { context: { skipBatch: true } },
    }),
  );

  const frameIndex = useMemo(() => {
    if (!slotMetadata?.length) {
      return currentFrame;
    }

    const closestFrame = slotMetadata.reduce<{ frameIndex: number; diff: number } | null>(
      (best, { slot, generatedAt }) => {
        const currentDiff = Math.abs(generatedAt - displayTime);

        if (!best) {
          return { frameIndex: slot, diff: currentDiff };
        }

        if (currentDiff < best.diff) {
          return { frameIndex: slot, diff: currentDiff };
        }

        return best;
      },
      null,
    );

    return closestFrame?.frameIndex ?? currentFrame;
  }, [slotMetadata, displayTime, currentFrame]);

  if (!enabled) return null;

  return (
    <>
      {Array.from({ length: frameCount }, (_, t) => (
        <Source
          key={`sfc-obs-isobars-${t}`}
          id={`sfc-obs-isobars-${t}`}
          type="vector"
          tiles={[
            `${import.meta.env.DEV ? "http://localhost:8080" : window.location.origin}/tiles/isolines/${t}/{z}/{x}/{y}.pbf`,
          ]}
        >
          <Layer
            id={`layer-sfc-obs-isobars-${t}`}
            source-layer="mslp"
            type="line"
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
            paint={{
              "line-color": "#111",
              "line-width": ["case", ["==", ["%", ["-", ["to-number", ["get", "value"]], 1000], 24], 0], 6, 3],
              "line-opacity": t === frameIndex ? 1 : 0,
              "line-opacity-transition": { duration: 0 },
            }}
          />
          <Layer
            id={`layer-sfc-obs-isobars-labels-${t}`}
            source-layer="mslp"
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
              "text-opacity": t === frameIndex ? 1 : 0,
              "text-opacity-transition": { duration: 0 },
            }}
          />
          <Layer
            id={`layer-sfc-obs-mslp-extrema-value-${t}`}
            source-layer="mslp"
            type="symbol"
            filter={["has", "kind"]}
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
              "text-opacity": t === frameIndex ? 1 : 0,
              "text-opacity-transition": { duration: 0 },
            }}
          />
          <Layer
            id={`layer-sfc-obs-mslp-extrema-marker-${t}`}
            source-layer="mslp"
            type="symbol"
            filter={["has", "kind"]}
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
              "text-opacity": t === frameIndex ? 1 : 0,
              "text-opacity-transition": { duration: 0 },
            }}
          />
        </Source>
      ))}
    </>
  );
};
