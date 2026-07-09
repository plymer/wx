import { Layer } from "react-map-gl/maplibre";
import { LIGHTNING_DISPLAY } from "@/config/vectorData";
import { useShowLightning } from "@/stateStores/map/vectorData";
import { useDisplayTime } from "@/hooks/useDisplayTime";

interface Props {
  belowLayer?: string;
}

export const LightningDataLayer = ({ belowLayer }: Props) => {
  const enabled = useShowLightning();

  const displayTime = useDisplayTime();

  if (!enabled) return;

  return (
    <Layer
      {...LIGHTNING_DISPLAY}
      source="vector-tile-source"
      source-layer="lightning"
      key="lightning-data"
      beforeId={belowLayer}
      filter={[
        "all",
        ["<=", ["get", "startTime"], ["to-number", displayTime]],
        [">", ["get", "expiryTime"], ["to-number", displayTime]],
      ]}
    />
  );
};
