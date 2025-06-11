import { Layer, Source } from "react-map-gl/maplibre";

import { AqData } from "@/lib/types";
import { FeatureCollection } from "geojson";
import { AQ_DISPLAY, AQ_VALUE_DISPLAY } from "@/config/vectorData";
import { useFrame, useStartTime } from "@/stateStores/map/animation";
import { MINUTE } from "@/lib/utils";

interface Props {
  data: AqData;
  belowLayer?: string;
}

const AirQualityLayer = ({ data, belowLayer }: Props) => {
  const displayOptions = AQ_DISPLAY;
  const textOptions = AQ_VALUE_DISPLAY;

  const startTime = useStartTime();
  const frame = useFrame();

  const displayTime = startTime + frame * 10 * MINUTE;

  const filteredData: FeatureCollection = {
    type: "FeatureCollection",
    features: data.features.filter((feature) => {
      // filter out features that don't have a validTime property
      if (!feature.properties.validTime) return false;

      // otherwise, filter based on the validTime property
      const validTime = feature.properties.validTime;
      const lastTimeStep = new Date(displayTime - 15 * MINUTE).toISOString() as unknown as Date;
      const displayTimeDate = new Date(displayTime).toISOString() as unknown as Date;

      return validTime < displayTimeDate && validTime >= lastTimeStep;
    }),
  };

  return (
    <>
      <Source
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
          layout={textOptions.layout}
          paint={{ "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1 }}
        />
        <Layer // non-clustered layer for circles
          type="circle"
          id="aq-data"
          filter={["!", ["has", "point_count"]]}
          beforeId={"aq-data-values"}
          paint={{
            "circle-radius": 10,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
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
          layout={displayOptions.layout}
        />
        <Layer // cluster layer for text values
          type="symbol"
          id="aq-data-values-clusters"
          filter={["has", "point_count"]}
          beforeId={"aq-data"}
          layout={{
            "text-field": "{max_pm25}",
            "text-size": [
              "step",
              ["get", "point_count"],
              10, // size when point_count < 10
              10,
              12, // size when point_count >= 10
              25,
              18, // size when point_count >= 25
              50,
              20, // size when point_count >= 50
              100,
              22, // size when point_count >= 100
            ],
            "text-allow-overlap": true,
          }}
          paint={{ "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1 }}
        />

        <Layer // cluster layer for circles
          type="circle"
          id="aq-data-clusters"
          filter={["has", "point_count"]}
          beforeId={"aq-data-values-clusters"}
          paint={{
            "circle-radius": [
              "step",
              ["get", "point_count"],
              10, // radius when point_count < 10
              10,
              12, // radius when point_count >= 10
              25,
              18, // radius when point_count >= 25
              50,
              20, // radius when point_count >= 50
              100,
              22, // radius when point_count >= 100
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff",
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
          layout={displayOptions.layout}
        />
      </Source>
    </>
  );
};

export default AirQualityLayer;
