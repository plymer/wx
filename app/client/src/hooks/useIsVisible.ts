import { useMapRef } from "@/stateStores/map/mapView";
import type { LngLatBoundsLike } from "maplibre-gl";

export const useIsVisible = (bounds: LngLatBoundsLike) => {
  const mapRef = useMapRef();
  const mapBounds = mapRef?.getBounds();
  const isVisible = mapBounds?.intersects(bounds);

  return isVisible ?? false;
};
