import { useCurrentTime } from "./useCurrentTime";

export function useRealtimeTilesUrl() {
  const currentTime = useCurrentTime();

  return `${import.meta.env.DEV ? "http://localhost:8080" : window.location.origin}/tiles/realtime/{z}/{x}/{y}.pbf?${currentTime}`;
}
