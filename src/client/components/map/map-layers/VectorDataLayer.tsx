import { Layer, Source } from "react-map-gl/maplibre";

import { LightningData, OverlayOptions } from "@/lib/types";
import { FeatureCollection } from "geojson";
import { VECTOR_DISPLAY_CONFIGS } from "@/config/vectorData";
import { useEndTime, useFrame, useStartTime } from "@/stateStores/map/animation";
import { HOUR, MINUTE } from "@/lib/utils";

interface Props {
  id: string;
  data: FeatureCollection;
  overlayType: "circle" | "line" | "fill" | "symbol";
  overlayOptions?: OverlayOptions;
  belowLayer?: string;
}

const VectorDataLayer = ({ id, overlayType, data, overlayOptions, belowLayer }: Props) => {
  const displayOptions = VECTOR_DISPLAY_CONFIGS.lightning;
  const paint = displayOptions?.paint ?? {};

  const startTime = useStartTime();
  const frame = useFrame();

  const displayTime = startTime + frame * 10 * MINUTE;

  const lightningData = data as LightningData;

  const filteredData = lightningData.features.filter(
    (feature) => feature.properties.validTime >= displayTime - HOUR / 2 && feature.properties.validTime <= displayTime
  );

  return (
    <>
      <Source type="geojson" data={{ type: "FeatureCollection", features: filteredData } as FeatureCollection}>
        <Layer type={overlayType} id={id} beforeId={belowLayer} paint={paint} />
      </Source>
    </>
  );
};

export default VectorDataLayer;
