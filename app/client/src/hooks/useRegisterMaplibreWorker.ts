import { useEffect } from "react";
import { setWorkerUrl, getWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

export const useRegisterMaplibreWorker = () => {
  useEffect(() => {
    if (getWorkerUrl() === "") setWorkerUrl(workerUrl);
  }, []);
};
