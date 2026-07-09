import { Layer, Source } from "react-map-gl/maplibre";

import { LIGHTNING_DISPLAY } from "@/config/vectorData";

import { GEOMET_ATTRIBUTION } from "@/config/rasterData";
import { useShowLightning } from "@/stateStores/map/vectorData";
import { useDisplayTime } from "@/hooks/useDisplayTime";

import { useTileUrl } from "@/hooks/useTileUrl";

interface Props {
  belowLayer?: string;
}

export const LightningDataLayer = ({ belowLayer }: Props) => {
  const enabled = useShowLightning();

  const displayTime = useDisplayTime();
  const tileUrl = useTileUrl(displayTime);

  if (!enabled) return;

  return (
    <>
      <Source
        type="vector"
        attribution={GEOMET_ATTRIBUTION}
        key="lightning-data-source"
        tiles={[tileUrl]}
        id="lightning-data"
      >
        <Layer
          {...LIGHTNING_DISPLAY}
          source-layer="lightning"
          key="lightning-data"
          beforeId={belowLayer}
          filter={[
            "all",
            ["<=", ["get", "startTime"], ["to-number", displayTime]],
            [">", ["get", "expiryTime"], ["to-number", displayTime]],
          ]}
        />
      </Source>
    </>
  );
};
