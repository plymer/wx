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
  IODC_BOUNDS,
  HIMAWARI_BOUNDS,
} from "@/config/rasterData";
import type { WMSDomains, WMSLayer } from "@shared/lib/types";
import type { TransitionSpecification } from "maplibre-gl";
import { useMemo } from "react";

interface Props {
  belowLayer?: string;
  apiData?: WMSLayer;
}

const makeTileRequestString = (domain: WMSDomains, layerName: string, validTime: number) => {
  let baseUrl;
  switch (domain) {
    case "europe":
    case "indianOcean":
      baseUrl = EUMETSAT_GETMAP;
      break;
    case "west":
    case "east":
    case "himawari":
      baseUrl = GEOMET_GETMAP;
      break;
    default:
      baseUrl = GEOMET_GETMAP;
  }

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

  // if the belowLayer is not in the map's layers, we cannot render this layer
  if (!belowLayer || !map.getLayer(belowLayer)) belowLayer = "wateroutline";

  const layerId = "layer-" + apiData?.type + "-" + apiData?.domain;

  let bounds: [number, number, number, number] = MAP_BOUNDS;
  let attribution = "";

  if (apiData?.type === "satellite") {
    switch (apiData.domain) {
      case "europe":
        bounds = EUMETSAT_BOUNDS;
        attribution = EUMETSAT_ATTRIBUTION;
        break;
      case "indianOcean":
        bounds = IODC_BOUNDS;
        attribution = EUMETSAT_ATTRIBUTION;
        break;
      case "west":
        bounds = GOES_WEST_BOUNDS;
        attribution = GEOMET_ATTRIBUTION;
        break;
      case "east":
        bounds = GOES_EAST_BOUNDS;
        attribution = GEOMET_ATTRIBUTION;
        break;
      case "himawari":
        bounds = HIMAWARI_BOUNDS;
        attribution = GEOMET_ATTRIBUTION;
        break;
      default:
        bounds = MAP_BOUNDS;
        attribution = GEOMET_ATTRIBUTION;
    }
  }

  const source: RasterSourceSpecification = {
    attribution,
    type: "raster",
    tileSize: 256,
    bounds,
  };

  // filter all the time steps that are within our validity period
  const filteredTimesteps = apiData?.timeSteps?.filter((time) => time.validTime > animation.startTime) ?? [];

  const mappedTimesteps = useMemo(() => {
    const timesteps: number[] = [];

    for (let i = 0; i < animation.frameCount; i++) {
      const minTime = animation.startTime + i * animation.deltaTime;
      const maxTime = animation.startTime + (i + 1) * animation.deltaTime;

      const candidate = filteredTimesteps.find(
        (time) => time.validTime >= minTime && time.validTime <= maxTime,
      )?.validTime;

      if (candidate !== undefined) {
        timesteps.push(candidate);
      }
    }

    // we also need to make sure we have enough frames to cover the entire animation, so first calculate the difference between the number of time steps we have filtered and the total number of frames
    const timeStepsDiff = timesteps.length - animation.frameCount;

    // if our diff is negative, append the latest frame to the end of the times array until we have enough frames
    // if our diff is positive, remove the earliest frames until we have the same number of frames as the animation.frameCount
    if (timeStepsDiff < 0) {
      for (let i = 0; i < -timeStepsDiff; i++) {
        timesteps.push(timesteps[timesteps.length - 1]);
      }
    }

    return timesteps;
  }, [filteredTimesteps, animation.startTime, animation.deltaTime, animation.frameCount]);

  const maxFrameId = `${layerId}-${animation.frameCount - 1}`;
  const maxFrame = animation.frameCount - 1;

  const transition: TransitionSpecification = { duration: 0 };

  if (!apiData || mappedTimesteps.length === 0) return; // if we have no valid time steps, don't render anything

  /*
  rule for smooth animation:
   absolutely NO tile source must change, otherwise the layer will dump the previous tiles and re-initialize new ones, leading to the checkerboard pattern and a poor UX. i do not believe this behaviour can be changed as it is inherent in both mapbox and maplibre.
  */

  return (
    <>
      <Source
        {...source}
        key={maxFrameId}
        tiles={[makeTileRequestString(apiData.domain, apiData.name, mappedTimesteps[maxFrame])]}
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
        mappedTimesteps.map((u, index) => {
          if (index === maxFrame) return; // don't render the max frame again
          return (
            <Source
              {...source}
              key={`${layerId}-${index}`}
              tiles={[makeTileRequestString(apiData.domain, apiData.name, u)]}
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
