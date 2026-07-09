import { useMemo } from "react";

export const useTileUrl = (timestamp: number) => {
  const tileUrl = useMemo(() => {
    const baseUrl = import.meta.env.DEV ? "http://localhost:3000/api/tiles" : "/api/tiles";
    return `${baseUrl}/${timestamp}/{z}/{x}/{y}`;
  }, [timestamp]);

  return tileUrl;
};
