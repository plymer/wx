import { ZOOM_THRESHOLDS } from "@/config/map";

import { useRealtimeTilesUrl } from "@/hooks/useRealtimeTilesUrl";

import { useShowObs } from "@/stateStores/map/vectorData";

import { Layer, Source } from "react-map-gl/maplibre";

interface Props {
  zoom: number;
}

export const Popups = ({ zoom }: Props) => {
  const enabled = useShowObs();

  const tileUrl = useRealtimeTilesUrl();

  if (!enabled) return null;

  return (
    <Source id="sfc-obs-interactive-target" type="vector" tiles={[tileUrl]}>
      {/* Interactive target (invisible circles for click detection) */}
      <Layer
        id="layer-sfc-obs-target"
        type="circle"
        source-layer="popup"
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
        source-layer="popup"
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
