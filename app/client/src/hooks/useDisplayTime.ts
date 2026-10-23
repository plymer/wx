import { useDeltaTime, useFrame, useStartTime } from "@/stateStores/map/animation";
import { useMapRef } from "@/stateStores/map/mapView";
import { useEffect } from "react";

/**
 * Used to calculate the current display time based on animation state
 * @returns The current display time based on animation state
 */
export const useDisplayTime = () => {
  const startTime = useStartTime();
  const frame = useFrame();
  const deltaTime = useDeltaTime();

  const currentTime = startTime + frame * deltaTime;
  const mapRef = useMapRef();

  useEffect(() => {
    mapRef?.setGlobalStateProperty("time", currentTime);
  }, [mapRef, currentTime]);

  return currentTime;
};
