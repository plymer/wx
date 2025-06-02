import { Layer, Source } from "react-map-gl/maplibre";

import { LightningData } from "@/lib/types";
import { FeatureCollection } from "geojson";
import { LIGHTNING_ALT, VECTOR_DISPLAY_CONFIGS } from "@/config/vectorData";
import { useFrame, useStartTime } from "@/stateStores/map/animation";
import { HOUR, MINUTE } from "@/lib/utils";

interface Props {
  data: FeatureCollection;
  belowLayer?: string;
}

const LightningDataLayer = ({ data, belowLayer }: Props) => {
  const displayOptions = LIGHTNING_ALT;
  const paintConfig = displayOptions.paint;

  const startTime = useStartTime();
  const frame = useFrame();

  const displayTime = startTime + frame * 10 * MINUTE;

  const lightningData = data as LightningData;

  const filteredData: FeatureCollection = {
    type: "FeatureCollection",
    features: lightningData.features.filter(
      (feature) => feature.properties.validTime >= displayTime - HOUR / 2 && feature.properties.validTime <= displayTime
    ),
  };

  return (
    <>
      <Source type="geojson" data={filteredData} id="lightning-data">
        <Layer
          type="symbol"
          id="lightning-data"
          beforeId={belowLayer}
          paint={paintConfig}
          layout={displayOptions.layout}
        />
      </Source>
    </>
  );
};

export default LightningDataLayer;
