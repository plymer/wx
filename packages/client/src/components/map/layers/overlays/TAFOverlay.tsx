import { useTAFsOverlay } from "@/stateStores/map/overlays";
import MapOverlay from "../base/MapOverlay";
import { TAF_OVERLAY } from "@/config/overlays";
import tafSites from "@/assets/general-overlays/taf-sites.json";
import type { FeatureCollection } from "geojson";

export const TAFOverlay = () => {
  const tafsOverlay = useTAFsOverlay();

  if (!tafsOverlay) return;

  const data = tafSites as FeatureCollection;

  return (
    <MapOverlay overlayId="tafSites" key="tafSites" data={data} belowLayer="place_state" overlayOptions={TAF_OVERLAY} />
  );
};
