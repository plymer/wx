import { Layer } from "react-map-gl/maplibre";

import { useShowLightning } from "@/stateStores/map/vectorData";
import { useDisplayTime } from "@/hooks/useDisplayTime";
import { MINUTE } from "@shared/lib/constants";

interface Props {
  belowLayer?: string;
}

export const LightningDataLayer = ({ belowLayer }: Props) => {
  const enabled = useShowLightning();

  const displayTime = useDisplayTime();

  if (!enabled) return;

  return (
    <Layer
      source="vector-tile-source"
      source-layer="lightning"
      key="lightning-data"
      beforeId={belowLayer}
      filter={[
        "all",
        ["<=", ["get", "start_time"], ["to-number", displayTime]],
        [">", ["get", "expiry_time"], ["to-number", displayTime - 24 * MINUTE]],
      ]}
      type="symbol"
      id="lightning-data"
      layout={{
        "text-field": "X",
        "text-overlap": "always",
        "text-size": 18,
        "text-font": ["Metropolis-Regular"],
      }}
      paint={{
        "text-color": "rgb(255,0,155)",
        "text-halo-color": "rgb(255,255,255)",
        "text-halo-width": 1,
        "text-opacity": ["case", ["<", ["get", "expiry_time"], ["to-number", displayTime - 12 * MINUTE]], 0.5, 1],
      }}
    />
  );
};
