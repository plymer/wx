import { Layer, RasterSourceSpecification, Source } from "react-map-gl/maplibre";
import { useEffect, useRef, useState } from "react";

import { RasterLayerData } from "@/lib/types";
import { useAnimationState, useDeltaTime, useFrame, useFrameCount, useStartTime } from "@/stateStores/map/animation";
import { GOES_WEST_BOUNDS, GOES_EAST_BOUNDS, MAP_BOUNDS, GEOMET_GETMAP } from "@/config/map";
import { makeISOTimeStamp } from "@/lib/utils";
// import PausibleSource from "./PausibleSource";
// import { useIsMoving } from "@/stateStores/mapView";

interface Props {
  belowLayer?: string;
  apiData: RasterLayerData;
  initDelay?: number;
}

const RasterDataLayer = ({ belowLayer, apiData, initDelay }: Props) => {
  const animation = {
    state: useAnimationState(),
    currentFrame: useFrame(),
    startTime: useStartTime(),
    frameCount: useFrameCount(),
    deltaTime: useDeltaTime(),
  };

  const [init, isInit] = useState(false);

  useEffect(() => {
    setTimeout(() => isInit(true), initDelay ?? 300);
  }, []);

  const [prevFrameVisible, setPrevFrameVisible] = useState<number | undefined>(undefined);
  const fadeTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // on the final frame of the animation, we need to fade out the previous frame, but also need to do it in a way that doesn't flicker the raster data on the map
  // this mostly improves the utility of the radar data since it has transparency and we don't want to see the previous timestep data when we are effectively 'paused'
  useEffect(() => {
    // when frame changes, clear any existing timeout
    if (fadeTimeout.current) {
      clearTimeout(fadeTimeout.current);
      fadeTimeout.current = undefined;
    }

    // set the previous frame as visible
    setPrevFrameVisible(animation.currentFrame - 1);
    // ff we're animating, set the previous frame to be visible
    if (animation.state === "playing" && animation.currentFrame > 0) {
      // only do this on the final frame of the animation. debounce the fadeout to prevent flickering with a timeout of 100 ms
      // if we do this for every frame, it becomes very computationally expensive
      if (animation.currentFrame === animation.frameCount - 1)
        fadeTimeout.current = setTimeout(() => {
          setPrevFrameVisible(undefined);
          fadeTimeout.current = undefined;
        }, 100);
    } else if (animation.state !== "playing") {
      fadeTimeout.current = setTimeout(() => {
        setPrevFrameVisible(undefined);
        fadeTimeout.current = undefined;
      }, 100);
    }

    // cleanup on unmount
    return () => {
      if (fadeTimeout.current) {
        clearTimeout(fadeTimeout.current);
        fadeTimeout.current = undefined;
      }
    };
  }, [animation.currentFrame, animation.state]);

  // safety checks

  if (!belowLayer || !apiData || !apiData.timeSteps || apiData.timeSteps.length === 0) return;

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
  // if our diff is positive, remove the earliest frames until we have the same number of frames as the animation.frameCount
  if (timeStepsDiff < 0) {
    for (let i = 0; i < -timeStepsDiff; i++) {
      timeSteps.push(timeSteps[timeSteps.length - 1]);
    }
  } else if (timeStepsDiff > 0) {
    timeSteps.splice(0, timeStepsDiff);
  }

  /*
  rules for smooth animation:
   1. absolutely NO tile source must change, otherwise the layer will dump the previous tiles and re-initialize new ones, leading to the checkerboard pattern and a poor UX. i do not believe this behaviour can be changed as it is inherent in both mapbox and maplibre.

  2. the previous frame must be rendered under the current frame in order to prevent the flickering of layers due to an inherent, unchangeable (as of 2024-09-02) 300ms fadeout for each layer. the property "raster-fade-duration" does not do anything as of this time.
  */

  const maxFrameId = `${layerId}-${animation.frameCount - 1}`;
  const maxFrame = animation.frameCount - 1;

  // we draw the maxFrame first upon mounting the component, we wait the init delay timeout and then add all of the other frames, referencing the maxFrameId as the beforeId to ensure that it will always be the top-most layer rendered

  return (
    <>
      <Source
        {...source}
        key={maxFrameId}
        tiles={[`${GEOMET_GETMAP}${apiData.name}&time=${makeISOTimeStamp(timeSteps[maxFrame].validTime, "data")}`]}
        id={maxFrameId}
      >
        <Layer
          type="raster"
          source="source"
          id={maxFrameId}
          beforeId={belowLayer}
          paint={{
            "raster-fade-duration": 300, // literally doesn't do anything; defaults to 300 ms
            "raster-opacity": animation.currentFrame === maxFrame ? 1 : 0,
          }}
        />
      </Source>
      {init &&
        timeSteps.map((u, index) => {
          if (index === maxFrame) return; // don't render the max frame again
          return (
            <Source
              {...source}
              key={`${layerId}-${index}`}
              tiles={[`${GEOMET_GETMAP}${apiData.name}&time=${makeISOTimeStamp(u.validTime, "data")}`]}
              id={`${layerId}-${index}`}
              // isPaused={isMoving}
            >
              <Layer
                type="raster"
                source="source"
                id={`${layerId}-${index}`}
                beforeId={maxFrameId} // we set this to the max frame's id
                paint={{
                  "raster-fade-duration": 300, // literally doesn't do anything; defaults to 300 ms
                  "raster-opacity":
                    index === animation.currentFrame ||
                    index === prevFrameVisible ||
                    (apiData.type === "satellite" && index === 0)
                      ? 1
                      : 0, // here, we want the current, the previous, and the very last frame to be preserved so that we don't get any flickering of the map background since the renderer does not repsect our fade-duration property
                }}
              />
            </Source>
          );
        })}
    </>
  );
};

export default RasterDataLayer;
