import { usePublicRegionsOverlay } from "@/stateStores/map/overlays";
import MapOverlay from "../base/MapOverlay";
import { PUBLIC_OVERLAY } from "@/config/overlays";
import publicRegions from "@/assets/general-overlays/public-regions.json";
import type { FeatureCollection } from "geojson";

interface Props {
  override?: boolean;
}

export const PublicRegionsOverlay = ({ override }: Props) => {
  const publicRegionsOverlay = usePublicRegionsOverlay();

  if (!override && !publicRegionsOverlay) return;

  const data = publicRegions as FeatureCollection;

  return <MapOverlay overlayId="publicRegions" key="publicRegions" data={data} overlayOptions={PUBLIC_OVERLAY} />;
};
