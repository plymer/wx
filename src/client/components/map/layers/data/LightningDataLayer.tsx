import { Layer, Source } from "react-map-gl/maplibre";

import { LightningData } from "@/lib/types";
import { FeatureCollection, Point } from "geojson";
import { CLUSTERED, LIGHTNING_DISPLAY, UNCLUSTERED } from "@/config/vectorData";
import { useFrame, useStartTime } from "@/stateStores/map/animation";
import { MINUTE } from "@shared/lib/constants";
import { GEOMET_ATTRIBUTION } from "@/config/rasterData";
import useAPI from "@/hooks/useAPI";
import { useShowLightning } from "@/stateStores/map/vectorData";

interface Props {
  belowLayer?: string;
  timeRange?: number;
}

export const LightningDataLayer = ({ belowLayer, timeRange = 15 }: Props) => {
  const enabled = useShowLightning();

  const startTime = useStartTime();
  const frame = useFrame();

  const displayTime = startTime + frame * 10 * MINUTE;

  const { data: lightningData } = useAPI<LightningData>(
    "/lightning",
    {},
    {
      queryName: "lightning",
      enabled,
      interval: 1,
    },
  );

  if (!lightningData || lightningData.status !== "success" || !lightningData.data.features.length) return;

  const features = lightningData?.data.features;

  const filteredData: FeatureCollection = {
    type: "FeatureCollection",
    features: features.reduce((acc: FeatureCollection<Point, { validTime: number }>["features"], feature) => {
      if (
        feature.properties.validTime >= displayTime - timeRange * MINUTE &&
        feature.properties.validTime <= displayTime
      ) {
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
    }, []),
  };

  return (
    <>
      <Source
        type="geojson"
        attribution={GEOMET_ATTRIBUTION["en"]}
        key="lightning-data-source"
        data={filteredData}
        id="lightning-data"
        cluster={true}
        clusterMaxZoom={12}
        clusterRadius={4}
      >
        <Layer {...LIGHTNING_DISPLAY} key="lightning-data" filter={UNCLUSTERED} beforeId={belowLayer} />
        <Layer
          {...LIGHTNING_DISPLAY}
          key="lightning-data-cluster"
          id="lightning-data-cluster"
          filter={CLUSTERED}
          beforeId="lightning-data"
        />
      </Source>
    </>
  );
};
