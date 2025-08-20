import MapOverlay from "../base/MapOverlay";
import { BEDPOSTS_OVERLAY } from "@/config/overlays";
import { useBedpostsOverlay } from "@/stateStores/map/overlays";
import bedposts from "@/assets/general-overlays/bedposts.json";
import type { FeatureCollection } from "geojson";
import { useMapRef } from "@/stateStores/map/mapView";

export const BedpostOverlay = () => {
  const bedpostsOverlay = useBedpostsOverlay();
  const mapRef = useMapRef();

  if (!bedpostsOverlay) return;

  const data = bedposts as FeatureCollection;

  const belowLayer = mapRef?.getLayer("tafSites") ? "tafSites" : "place_state";

  return (
    <MapOverlay
      overlayId="bedposts"
      key="bedposts"
      data={data}
      belowLayer={belowLayer}
      overlayOptions={BEDPOSTS_OVERLAY}
    />
  );
};
