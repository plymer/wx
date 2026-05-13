import { Layer, Source } from "react-map-gl/maplibre";

import { GEOMET_ATTRIBUTION } from "@/config/rasterData";
import { useShowLightning } from "@/stateStores/map/vectorData";
import { useDisplayTime } from "@/hooks/useDisplayTime";

import { useRealtimeTilesUrl } from "@/hooks/useRealtimeTilesUrl";
import type { FilterSpecification } from "maplibre-gl";

interface Props {
  belowLayer?: string;
}

export const LightningDataLayer = ({ belowLayer }: Props) => {
  const enabled = useShowLightning();
  const frameTime = useDisplayTime();

  const tileUrl = useRealtimeTilesUrl();

  const filter: FilterSpecification = [
    "all",
    ["<", ["get", "startTime"], ["to-number", frameTime]],
    [">=", ["get", "expiryTime"], ["to-number", frameTime]],
  ];

  if (!enabled) return;

  return (
    <>
      <Source
        type="vector"
        attribution={GEOMET_ATTRIBUTION}
        key="lightning-data-source"
        tiles={[tileUrl]}
        id="lightning-data"
        maxzoom={9}
        minzoom={2}
      >
        <Layer
          source-layer="lightning"
          key="lightning-data"
          filter={filter}
          beforeId={belowLayer}
          type="symbol"
          id="lightning-data"
          source="lightning-data"
          layout={{
            "text-field": "X",
            "text-overlap": "always",
            "symbol-sort-key": ["get", "validTime"],
            "text-size": 18,
            "text-font": ["Metropolis-Regular"],
          }}
          paint={{
            "text-color": "rgb(255,0,155)",
            "text-halo-color": "#fff",
            "text-halo-width": 1,
          }}
        />
      </Source>
    </>
  );
};
