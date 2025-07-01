import { Layer, Source } from "react-map-gl/maplibre";

import { LightningData, APIResponse } from "@/lib/types";
import { FeatureCollection, Point } from "geojson";
import { LIGHTNING_ALT } from "@/config/vectorData";
import { useFrame, useStartTime } from "@/stateStores/map/animation";
import { HOUR, MINUTE } from "@/lib/utils";

interface Props {
  lightningData?: APIResponse<LightningData>;
  belowLayer?: string;
}

const LightningDataLayer = ({ lightningData, belowLayer }: Props) => {
  const displayOptions = LIGHTNING_ALT;
  const paintConfig = displayOptions.paint;

  const startTime = useStartTime();
  const frame = useFrame();

  const displayTime = startTime + frame * 10 * MINUTE;

  const isSuccess = lightningData?.status === "success";
  const features = isSuccess ? lightningData?.data.features : [];

  const filteredData: FeatureCollection = {
    type: "FeatureCollection",
    features: isSuccess
      ? features.reduce((acc: FeatureCollection<Point, { validTime: number }>["features"], feature) => {
          if (feature.properties.validTime >= displayTime - HOUR / 2 && feature.properties.validTime <= displayTime) {
            // convert MultiPoint to array of Point features to enable clustering
            if (feature.geometry.type === "MultiPoint") {
              feature.geometry.coordinates.forEach((coord) => {
                acc.push({
                  ...feature,
                  geometry: { type: "Point", coordinates: coord },
                });
              });
            }
          }
          return acc;
        }, [])
      : // Non-reducer case: flatten all MultiPoints to Points
        features,
  };

  return (
    <>
      <Source
        type="geojson"
        key="lightning-data-source"
        data={filteredData}
        id="lightning-data"
        cluster={true}
        clusterMaxZoom={12}
        clusterRadius={4}
      >
        <Layer
          type="symbol"
          id="lightning-data"
          key="lightning-data"
          filter={["!", ["has", "point_count"]]}
          beforeId={belowLayer}
          paint={paintConfig}
          layout={displayOptions.layout}
        />
        <Layer
          type="symbol"
          key="lightning-data-cluster"
          id="lightning-data-cluster"
          filter={["has", "point_count"]}
          beforeId="lightning-data"
          paint={paintConfig}
          layout={displayOptions.layout}
        />
      </Source>
    </>
  );
};

export default LightningDataLayer;
