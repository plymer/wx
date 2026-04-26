import { ZOOM_THRESHOLDS } from "@/config/map";
import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { api } from "@/lib/trpc";
import { useShowObs } from "@/stateStores/map/vectorData";
import { useQuery } from "@tanstack/react-query";

import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  zoom: number;
}

export const Popups = ({ zoom }: Props) => {
  const enabled = useShowObs();
  const { data: popupData, isFetching: popupFetching } = useQuery(
    api.wxmap.wxmapPopupData.queryOptions(undefined, {
      enabled,
      trpc: { context: { skipBatch: true } },
    }),
  );
  useMapLoadingState("sfc-popup", popupFetching);

  if (!enabled) return null;

  return (
    <Source
      id="sfc-obs-interactive-target"
      type="geojson"
      data={popupData || { type: "FeatureCollection", features: [] }}
    >
      {/* Interactive target (invisible circles for click detection) */}
      <Layer
        id="layer-sfc-obs-target"
        type="circle"
        paint={{
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            ZOOM_THRESHOLDS.mini,
            zoom * 3, // was 1.5
            ZOOM_THRESHOLDS.reduced,
            12, // was 8
            ZOOM_THRESHOLDS.maximum,
            20, // was 10
          ],
          "circle-opacity": 0,
        }}
      />
      <Layer
        id="layer-sfc-obs-target-cross"
        beforeId="layer-sfc-obs-windbarb"
        type="symbol"
        paint={{
          "text-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            ZOOM_THRESHOLDS.mini + 1,
            0,
            ZOOM_THRESHOLDS.reduced,
            1,
          ],
        }}
        layout={{
          "text-field": "+",
          "text-allow-overlap": true,
          "text-font": ["Metropolis-Regular"],
        }}
      />
    </Source>
  );
};
