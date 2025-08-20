import { useLGFOverlay } from "@/stateStores/map/overlays";
import MapOverlay from "../base/MapOverlay";
import { LGF_OVERLAY } from "@/config/overlays";
import lgfBoundaries from "@/assets/cmac-product-overlays/lgf-boundaries.json";
import type { FeatureCollection } from "geojson";
import { useMapRef } from "@/stateStores/map/mapView";

export const LGFOverlay = () => {
  const lgfOverlay = useLGFOverlay();
  const mapRef = useMapRef();

  if (!lgfOverlay) return;

  const data = lgfBoundaries as FeatureCollection;

  const belowLayer = mapRef?.getLayer("gfaBoundaries")
    ? "gfaBoundaries"
    : mapRef?.getLayer("firBoundaries")
      ? "firBoundaries"
      : "water_name";

  return (
    <MapOverlay
      overlayId="lgfBoundaries"
      key="lgfBoundaries"
      data={data}
      belowLayer={belowLayer}
      overlayOptions={LGF_OVERLAY}
    />
  );
};
