import { useDeltaTime, useFrameCount, useStartTime } from "@/stateStores/map/animation";

export function useCurrentTime() {
  const frameCount = useFrameCount();
  const startTime = useStartTime();
  const deltaTime = useDeltaTime();
  return startTime + (frameCount - 1) * deltaTime;
}
