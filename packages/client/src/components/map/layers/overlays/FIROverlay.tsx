import { FIR_OVERLAY } from "@/config/overlays";
import MapOverlay from "../base/MapOverlay";
import { useFIROverlay } from "@/stateStores/map/overlays";
import firBoundaries from "@/assets/general-overlays/fir-boundaries.json";
import type { FeatureCollection } from "geojson";

export const FIROverlay = () => {
  const firOverlay = useFIROverlay();

  if (!firOverlay) return;

  const data = firBoundaries as FeatureCollection;

  return (
    <MapOverlay
      overlayId="firBoundaries"
      key="firBoundaries"
      data={data}
      belowLayer="water_name"
      overlayOptions={FIR_OVERLAY}
    />
  );
};
