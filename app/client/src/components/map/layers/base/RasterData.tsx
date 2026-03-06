import { Layer, type RasterSourceSpecification, Source, useMap } from "react-map-gl/maplibre";

import {
  useAnimationState,
  useDeltaTime,
  useFrame,
  useFrameCount,
  useStartTime,
  useIsStatic,
} from "@/stateStores/map/animation";
import { makeISOTimeStamp } from "@/lib/utils";
import {
  EUMETSAT_GETMAP,
  GEOMET_GETMAP,
  GOES_WEST_BOUNDS,
  GOES_EAST_BOUNDS,
  MAP_BOUNDS,
  EUMETSAT_BOUNDS,
  EUMETSAT_ATTRIBUTION,
  GEOMET_ATTRIBUTION,
} from "@/config/rasterData";
import type { WMSDomains, WMSLayer } from "@shared/lib/types";
import type { TransitionSpecification } from "maplibre-gl";

interface Props {
  belowLayer?: string;
  apiData?: WMSLayer;
}

const makeTileRequestString = (domain: WMSDomains, layerName: string, validTime: number) => {
  const baseUrl = domain === "europe" ? EUMETSAT_GETMAP : GEOMET_GETMAP;

  return `${baseUrl}${layerName}&time=${makeISOTimeStamp(validTime, "data")}`;
};

const RasterDataLayer = ({ belowLayer, apiData }: Props) => {
  const animation = {
    state: useAnimationState(),
    currentFrame: useFrame(),
    startTime: useStartTime(),
    frameCount: useFrameCount(),
    deltaTime: useDeltaTime(),
    isStatic: useIsStatic(),
  };

  const map = useMap().current!;

  // safety checks

  if (!apiData || !apiData.timeSteps || apiData.timeSteps.length === 0) return;

  // if the belowLayer is not in the map's layers, we cannot render this layer
  if (!belowLayer || !map.getLayer(belowLayer)) belowLayer = "wateroutline";

  const layerId = "layer-" + apiData.type + "-" + apiData.domain;

  const source: RasterSourceSpecification = {
    attribution: apiData.domain === "europe" ? EUMETSAT_ATTRIBUTION : GEOMET_ATTRIBUTION,
    type: "raster",
    tileSize: 256,
    bounds:
      apiData.type === "satellite"
        ? apiData.domain === "europe"
          ? EUMETSAT_BOUNDS
          : apiData.domain === "west"
            ? GOES_WEST_BOUNDS
            : GOES_EAST_BOUNDS
        : MAP_BOUNDS,
  };

  // filter all the time steps that are within our validity period
  const timeSteps = apiData.timeSteps.filter((time) => time.validTime > animation.startTime);

  if (timeSteps.length === 0) return; // if we have no valid time steps, don't render anything

  // we also need to make sure we have enough frames to cover the entire animation, so first calculate the difference between the number of time steps we have filtered and the total number of frames
  const timeStepsDiff = timeSteps.length - animation.frameCount;

  // if our diff is negative, append the latest frame to the end of the times array until we have enough frames
  // if our diff is positive, remove the earliest frames until we have the same number of frames as the animation.frameCount
  if (timeStepsDiff < 0) {
    for (let i = 0; i < -timeStepsDiff; i++) {
      timeSteps.push(timeSteps[timeSteps.length - 1]);
    }
  } else if (timeStepsDiff > 0) {
    timeSteps.splice(0, timeStepsDiff);
  }

  const maxFrameId = `${layerId}-${animation.frameCount - 1}`;
  const maxFrame = animation.frameCount - 1;

  const transition: TransitionSpecification = { duration: 0 };

  /*
  rule for smooth animation:
   absolutely NO tile source must change, otherwise the layer will dump the previous tiles and re-initialize new ones, leading to the checkerboard pattern and a poor UX. i do not believe this behaviour can be changed as it is inherent in both mapbox and maplibre.
  */

  return (
    <>
      <Source
        {...source}
        key={maxFrameId}
        tiles={[makeTileRequestString(apiData.domain, apiData.name, timeSteps[maxFrame].validTime)]}
        id={maxFrameId}
      >
        <Layer
          type="raster"
          id={maxFrameId}
          beforeId={belowLayer}
          paint={{
            "raster-opacity-transition": transition,
            "raster-opacity": animation.currentFrame === maxFrame ? 1 : 0,
          }}
        />
      </Source>
      {!animation.isStatic &&
        timeSteps.map((u, index) => {
          if (index === maxFrame) return; // don't render the max frame again
          return (
            <Source
              {...source}
              key={`${layerId}-${index}`}
              tiles={[makeTileRequestString(apiData.domain, apiData.name, u.validTime)]}
              id={`${layerId}-${index}`}
            >
              <Layer
                type="raster"
                id={`${layerId}-${index}`}
                beforeId={belowLayer}
                paint={{
                  "raster-opacity-transition": transition,
                  "raster-opacity": animation.currentFrame === index ? 1 : 0,
                }}
              />
            </Source>
          );
        })}
    </>
  );
};

export default RasterDataLayer;
