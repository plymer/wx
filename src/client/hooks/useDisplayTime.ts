import { useDeltaTime, useFrame, useStartTime } from "@/stateStores/map/animation";

/**
 * Used to calculate the current display time based on animation state
 * @returns The current display time based on animation state
 */
export const useDisplayTime = () => {
  const startTime = useStartTime();
  const frame = useFrame();
  const deltaTime = useDeltaTime();

  return startTime + frame * deltaTime;
};
