import { useGFAOverlay } from "@/stateStores/map/overlays";
import MapOverlay from "../base/MapOverlay";
import { GFA_OVERLAY } from "@/config/overlays";
import type { FeatureCollection } from "geojson";
import gfaBoundaries from "@/assets/cmac-product-overlays/gfa-boundaries.json";
import { useMapRef } from "@/stateStores/map/mapView";

export const GFAOverlay = () => {
  const gfaOverlay = useGFAOverlay();
  const mapRef = useMapRef();

  if (!gfaOverlay) return;

  const data = gfaBoundaries as FeatureCollection;

  const belowLayer = mapRef?.getLayer("firBoundaries") ? "firBoundaries" : "water_name";

  return (
    <MapOverlay
      overlayId="gfaBoundaries"
      key="gfaBoundaries"
      data={data}
      belowLayer={belowLayer}
      overlayOptions={GFA_OVERLAY}
    />
  );
};
