import { MARINE_OVERLAY } from "@/config/overlays";
import MapOverlay from "../base/MapOverlay";
import marineRegions from "@/assets/general-overlays/marine-regions.json";
import { useMarineRegionsOverlay } from "@/stateStores/map/overlays";
import type { FeatureCollection } from "geojson";

export const MarineRegionsOverlay = () => {
  const marineRegionsOverlay = useMarineRegionsOverlay();

  if (!marineRegionsOverlay) return;

  const data = marineRegions as FeatureCollection;

  return <MapOverlay overlayId="marineRegions" key="marineRegions" data={data} overlayOptions={MARINE_OVERLAY} />;
};
