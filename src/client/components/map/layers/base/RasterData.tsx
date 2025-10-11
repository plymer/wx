import { Layer, RasterSourceSpecification, Source, useMap } from "react-map-gl/maplibre";
import { useEffect, useRef, useState } from "react";

import { useAnimationState, useDeltaTime, useFrame, useFrameCount, useStartTime } from "@/stateStores/map/animation";
import { makeISOTimeStamp } from "@/lib/utils";
import {
  EUMETSAT_GETMAP,
  GEOMET_GETMAP,
  GOES_WEST_BOUNDS,
  GOES_EAST_BOUNDS,
  MAP_BOUNDS,
  EUMETSAT_BOUNDS,
} from "@/config/rasterData";
import type { WMSDomains, WMSLayer, WMSLayerTypes } from "@shared/lib/types";
import { TransitionSpecification } from "maplibre-gl";

// import PausibleSource from "./PausibleSource";
// import { useIsMoving } from "@/stateStores/mapView";

interface Props {
  belowLayer?: string;
  apiData?: WMSLayer;
  initDelay?: number;
}

const makeTileRequestString = (domain: WMSDomains, layerName: string, validTime: number) => {
  const baseUrl = domain === "europe" ? EUMETSAT_GETMAP : GEOMET_GETMAP;

  return `${baseUrl}${layerName}&time=${makeISOTimeStamp(validTime, "data")}`;
};

const RasterDataLayer = ({ belowLayer, apiData, initDelay }: Props) => {
  const animation = {
    state: useAnimationState(),
    currentFrame: useFrame(),
    startTime: useStartTime(),
    frameCount: useFrameCount(),
    deltaTime: useDeltaTime(),
  };

  const map = useMap().current!;

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
  }, [animation.currentFrame, animation.state, animation.frameCount]);

  // safety checks

  if (!apiData || !apiData.timeSteps || apiData.timeSteps.length === 0) return;

  // if the belowLayer is not in the map's layers, we cannot render this layer
  if (!belowLayer || !map.getLayer(belowLayer)) belowLayer = "wateroutline"; // default to the radar layer

  const layerId = "layer-" + apiData.type + "-" + apiData.domain;

  const source: RasterSourceSpecification = {
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

  /*
  rules for smooth animation:
   1. absolutely NO tile source must change, otherwise the layer will dump the previous tiles and re-initialize new ones, leading to the checkerboard pattern and a poor UX. i do not believe this behaviour can be changed as it is inherent in both mapbox and maplibre.


   i am leaving this here as a testament to my stupidity:
  2. the previous frame must be rendered under the current frame in order to prevent the flickering of layers due to an inherent, unchangeable (as of 2024-09-02) 300ms fadeout for each layer. the property "raster-fade-duration" does not do anything as of this time.
  */

  const maxFrameId = `${layerId}-${animation.frameCount - 1}`;
  const maxFrame = animation.frameCount - 1;

  // we draw the maxFrame first upon mounting the component, we wait the init delay timeout and then add all of the other frames, referencing the maxFrameId as the beforeId to ensure that it will always be the top-most layer rendered

  const transition: TransitionSpecification = { duration: 0 };

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
          source={maxFrameId}
          id={maxFrameId}
          beforeId={belowLayer}
          paint={{
            "raster-opacity-transition": transition,
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
              tiles={[makeTileRequestString(apiData.domain, apiData.name, u.validTime)]}
              id={`${layerId}-${index}`}
              // isPaused={isMoving}
            >
              <Layer
                type="raster"
                source={`${layerId}-${index}`}
                id={`${layerId}-${index}`}
                beforeId={maxFrameId} // we set this to the max frame's id
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
