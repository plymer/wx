import { useMapStateActions } from "@/stateStores/map/mapView";
import { useEffect, useRef } from "react";

export const useMapLoadingState = (layerName: string, fetching: boolean) => {
  const { addLayerLoading, removeLayerLoading } = useMapStateActions();
  const removeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (removeTimeoutRef.current) {
      clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }

    if (fetching) {
      addLayerLoading(layerName);
    } else {
      removeTimeoutRef.current = setTimeout(() => {
        removeLayerLoading(layerName);
        removeTimeoutRef.current = null;
      }, 150);
    }

    return () => {
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
        removeTimeoutRef.current = null;
      }
    };
  }, [addLayerLoading, fetching, layerName, removeLayerLoading]);
};
