import { useClockTime } from "@/stateStores/map/animation";
import { MINUTE } from "@shared/lib/constants";
import { useMemo } from "react";

export const useTileUrl = () => {
  const timestamp = Math.round(useClockTime() / MINUTE) * MINUTE;
  const tileUrl = useMemo(() => {
    const baseUrl = import.meta.env.DEV ? "http://localhost:3000/api/tiles" : "/api/tiles";
    return `${baseUrl}/${timestamp}/{z}/{x}/{y}`;
  }, [timestamp]);

  return tileUrl;
};
