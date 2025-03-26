import { Layer, RasterSourceSpecification, Source } from "react-map-gl/maplibre";

import { RasterLayerData } from "../../../lib/types";
import { GEOMET_GETMAP, GOES_EAST_BOUNDS, GOES_WEST_BOUNDS, MAP_BOUNDS } from "../../../config/map";

import {
  useAnimationState,
  useDeltaTime,
  useFrame,
  useFrameCount,
  useStartTime,
} from "../../../stateStores/map/animation";
import { findNearestTimeStep, makeISOTimeStamp } from "../../../lib/utils";

interface Props {
  belowLayer?: string;
  apiData: RasterLayerData;
}

const RasterDataLayer = ({ belowLayer, apiData }: Props) => {
  // the only two states we care about is the animation state (i.e. 'stopped' or 'playing')
  // and the current frame to show

  const animation = {
    state: useAnimationState(),
    currentFrame: useFrame(),
    startTime: useStartTime(),
    frameCount: useFrameCount(),
    deltaTime: useDeltaTime(),
  };

  // safety checks
  if (!belowLayer) return;

  if (!apiData || !apiData.timeSteps || apiData.timeSteps.length === 0) {
    return null; // Return null if we don't have valid data
  }

  const currentTime = animation.startTime + animation.deltaTime * animation.currentFrame;

  const currentTimeStep = findNearestTimeStep(apiData, currentTime);

  const layerId = "layer-" + apiData.type + "-" + apiData.domain;

  const source: RasterSourceSpecification = {
    type: "raster",
    tileSize: 256,
    bounds:
      apiData.type === "satellite" ? (apiData.domain === "west" ? GOES_WEST_BOUNDS : GOES_EAST_BOUNDS) : MAP_BOUNDS,
  };

  // filter all the time steps that are within our validity period
  const timeSteps = apiData.timeSteps.filter((time) => time.validTime > animation.startTime);

  // we also need to make sure we have enough frames to cover the entire animation, so first calculate the difference between the number of time steps we have filtered and the total number of frames
  const timeStepsDiff = timeSteps.length - animation.frameCount;

  // if our diff is negative, append the latest frame to the end of the times array until we have enough frames
  if (timeStepsDiff < 0) {
    for (let i = 0; i < -timeStepsDiff; i++) {
      timeSteps.push(timeSteps[timeSteps.length - 1]);
    }
  }

  /*
  rules for smooth animation:
   1. absolutely NO tile source must change, otherwise the layer will dump the previous tiles and re-initialize new ones, leading to the checkerboard pattern and a poor UX. i do not believe this behaviour can be changed as it is inherent in both mapbox and maplibre.

  2. the previous frame must be rendered under the current frame in order to prevent the flickering of layers due to an inherent, unchangeable (as of 2024-09-02) 300ms fadeout for each layer. the property "raster-fade-duration" does not do anything as of this time.
  */

  return animation.state === "realtime" ? (
    <Source
      key={`${layerId}-0`}
      {...source}
      id={`${layerId}-0`}
      tiles={[
        `${GEOMET_GETMAP}${apiData.name}&time=${makeISOTimeStamp(
          apiData.timeSteps[currentTimeStep].validTime,
          "data"
        )}`,
      ]}
    >
      <Layer type="raster" source="source" id={`${layerId}-0`} beforeId={belowLayer} />
    </Source>
  ) : (
    timeSteps.map((u, index) => (
      <Source
        {...source}
        key={`${layerId}-${index}`}
        tiles={[`${GEOMET_GETMAP}${apiData.name}&time=${makeISOTimeStamp(u.validTime, "data")}`]}
        id={`${layerId}-${index}`}
      >
        <Layer
          type="raster"
          source="source"
          id={`${layerId}-${index}`}
          beforeId={belowLayer}
          paint={{
            "raster-fade-duration": 0, // literally doesn't do anything; defaults to 300 ms
            "raster-opacity":
              index === animation.currentFrame ||
              index === animation.currentFrame - 1 ||
              (apiData.type === "satellite" && index === 0)
                ? 1
                : 0, // here, we want the current, the previous, and the very last frame to be preserved so that we don't get any flickering of the map background since the renderer does not repsect our fade-duration property
          }}
        />
      </Source>
    ))
  );
};

export default RasterDataLayer;
