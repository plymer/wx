import { Layer, Source } from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";

import { AQ_ATTRIBUTION, AQ_DISPLAY } from "@/config/vectorData";
import { useFrame, useFrameCount } from "@/stateStores/map/animation";
import { MINUTE } from "@shared/lib/constants";
import { useShowAQ } from "@/stateStores/map/vectorData";
import { useDisplayTime } from "@/hooks/useDisplayTime";
import { api } from "@/lib/trpc";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface Props {
  belowLayer?: string;
}

export const AirQualityLayer = ({ belowLayer }: Props) => {
  const enabled = useShowAQ();

  const frame = useFrame();
  const lastFrame = useFrameCount() - 1;
  const displayTime = useDisplayTime();

  const { data } = useQuery(
    api.aq.aq.queryOptions({ hours: 4 }, { enabled, placeholderData: keepPreviousData, refetchInterval: 10 * MINUTE }),
  );

  if (!enabled || !data) return;

  const filteredData: FeatureCollection = {
    type: "FeatureCollection",
    features: data.filter((feature) => {
      // filter out features that don't have a validTime property
      if (!feature.properties?.validTime) return false;

      // otherwise, filter based on the validTime property
      const validTime = feature.properties.validTime;
      // show twice as much data in the last frame to make sure it isn't blank
      const lastTimeStep = new Date(
        frame === lastFrame ? displayTime - 30 * MINUTE : displayTime - 15 * MINUTE,
      ).toISOString() as unknown as Date;
      const displayTimeDate = new Date(displayTime).toISOString() as unknown as Date;

      return validTime < displayTimeDate && validTime >= lastTimeStep;
    }),
  };

  return (
    <>
      <Source
        attribution={AQ_ATTRIBUTION["en"]}
        type="geojson"
        data={filteredData}
        id="aq-data-clusters"
        cluster={true}
        clusterRadius={50}
        clusterProperties={{
          max_pm25: ["max", ["get", "pm25"]],
        }}
      >
        <Layer // non-clustered layer for text values
          type="symbol"
          id="aq-data-values"
          filter={["!", ["has", "point_count"]]}
          beforeId={belowLayer}
          layout={{
            "text-field": ["to-string", ["round", ["get", "pm25"]]],
            "text-size": 12,
            "text-font": ["Consolas-Regular"],
            "text-anchor": "center",
            "text-allow-overlap": false,
            "symbol-sort-key": ["get", "validTime"],
          }}
          paint={{
            "text-color": ["step", ["get", "pm25"], "#000", 25, "#000", 50, "#fff", 75, "#fff", 100, "#fff"],
            "text-halo-color": ["step", ["get", "pm25"], "#fff", 25, "#fff", 50, "#000", 75, "#000", 100, "#000"],
            "text-halo-width": 1,
          }}
        />
        <Layer // non-clustered layer for circles
          {...AQ_DISPLAY}
          type="circle"
          id="aq-data"
          filter={["!", ["has", "point_count"]]}
          beforeId={"aq-data-values"}
          paint={{
            "circle-radius": 12,
            "circle-stroke-width": 1,
            "circle-stroke-color": ["step", ["get", "pm25"], "#000", 25, "#000", 50, "#fff", 75, "#fff", 100, "#fff"],
            "circle-color": [
              "step",
              ["get", "pm25"],
              "#00ff00",
              25,
              "#ffff00",
              50,
              "#ff9900",
              75,
              "#ff0000",
              100,
              "#990000",
            ],
          }}
        />
        <Layer // cluster layer for text values
          type="symbol"
          id="aq-data-values-clusters"
          filter={["has", "point_count"]}
          beforeId={"aq-data"}
          layout={{
            "text-field": ["to-string", ["round", ["get", "max_pm25"]]],
            "text-font": ["Consolas-Regular"],
            "text-offset": [0, 0],
            "text-anchor": "center",
            "text-size": [
              "step",
              ["get", "point_count"],
              12, // size when point_count < 10
              10,
              14, // size when point_count >= 10
              25,
              18, // size when point_count >= 25
              50,
              20, // size when point_count >= 50
              100,
              22, // size when point_count >= 100
            ],
            "text-allow-overlap": true,
          }}
          paint={{
            "text-color": ["step", ["get", "max_pm25"], "#000", 25, "#000", 50, "#fff", 75, "#fff", 100, "#fff"],
            "text-halo-color": ["step", ["get", "max_pm25"], "#fff", 25, "#fff", 50, "#000", 75, "#000", 100, "#000"],
            "text-halo-width": 1,
          }}
        />

        <Layer // cluster layer for circles
          {...AQ_DISPLAY}
          type="circle"
          id="aq-data-clusters"
          filter={["has", "point_count"]}
          beforeId={"aq-data-values-clusters"}
          paint={{
            "circle-radius": [
              "step",
              ["get", "point_count"],
              12, // radius when point_count < 10
              10,
              14, // radius when point_count >= 10
              25,
              18, // radius when point_count >= 25
              50,
              20, // radius when point_count >= 50
              100,
              22, // radius when point_count >= 100
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": [
              "step",
              ["get", "max_pm25"],
              "#000",
              25,
              "#000",
              50,
              "#fff",
              75,
              "#fff",
              100,
              "#fff",
            ],
            "circle-color": [
              "step",
              ["get", "max_pm25"],
              "#00ff00",
              25,
              "#ffff00",
              50,
              "#ff9900",
              75,
              "#ff0000",
              100,
              "#990000",
            ],
          }}
        />
      </Source>
    </>
  );
};
