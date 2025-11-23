import { Layer, Source } from "react-map-gl/maplibre";

import type { FeatureCollection, Point } from "geojson";
import { CLUSTERED, LIGHTNING_DISPLAY, UNCLUSTERED } from "@/config/vectorData";
import { MINUTE } from "@shared/lib/constants";
import { GEOMET_ATTRIBUTION } from "@/config/rasterData";
import { useShowLightning } from "@/stateStores/map/vectorData";
import { useDisplayTime } from "@/hooks/useDisplayTime";
import { api } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";

interface Props {
  belowLayer?: string;
  timeRange?: number;
}

export const LightningDataLayer = ({ belowLayer, timeRange = 15 }: Props) => {
  const enabled = useShowLightning();

  const displayTime = useDisplayTime();

  const { data } = useQuery(
    api.lightning.lightning.queryOptions(undefined, {
      enabled,
      refetchInterval: MINUTE,
      trpc: { context: { skipBatch: true } },
    }),
  );

  if (!enabled || !data) return;

  const filteredData: FeatureCollection = {
    type: "FeatureCollection",
    features: data.reduce((acc: FeatureCollection<Point, { validTime: number }>["features"], feature) => {
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
