import { useEffect } from "react";

import AnimationControls from "./map/AnimationControls";
import MapInstance from "./map/MapInstance";

import { positronWxMap } from "@/assets/map-styles/positron-wxmap.js";

import { AttributionControl, ViewState } from "react-map-gl/maplibre";
import MapLoadingIndicator from "./ui/MapLoadingIndicator";
import { GeoLocation } from "./map/GeoLocation";
import {
  useLoadingState,
  useProjection,
  useLatitude,
  useLongitude,
  useZoom,
  useBearing,
  usePitch,
} from "@/stateStores/map/mapView";
import { useAnimationActions } from "@/stateStores/map/animation";

import OptionsMapOverlays from "./map/OptionsMapOverlays";
import OptionsRealtimeData from "./map/OptionsRealtimeData";
// import DataAttributions from "./map/DataAttributions";

export default function WxMap() {
  // global state store subscriptions
  const loadingState = useLoadingState();
  const projection = useProjection();
  const animation = useAnimationActions();

  const viewState: Partial<ViewState> = {
    latitude: useLatitude(),
    longitude: useLongitude(),
    zoom: useZoom(),
    bearing: useBearing(),
    pitch: usePitch(),
  };

  useEffect(() => {
    // on mount, make sure the animation is paused
    // and set to the first frame
    animation.firstFrame();
    animation.pause();
  }, []);

  // import the map style - this may need to change to allow different map styles in the future
  const mapStyle = positronWxMap;

  return (
    <div className="bg-neutral-800 pt-2 md:h-(--md-map-height) max-md:h-(--max-md-map-height) text-sm">
      <MapInstance viewState={viewState} mapProjection={projection} basemap={mapStyle}>
        <>
          <AttributionControl
            compact
            position="top-right"
            style={{ backgroundColor: "var(--accent)", color: "var(--secondary)", border: "1px solid var(--primary)" }}
          />

          {/* <DataAttributions className="absolute bottom-0 right-0 rounded-md max-w-1/2 bg-accent border-1 border-black text-white m-2" /> */}

          <div key="map-options" className="absolute bottom-0 left-0 m-2 gap-2 flex flex-col">
            <OptionsRealtimeData />
            <OptionsMapOverlays />
            <GeoLocation />
          </div>
          <MapLoadingIndicator show={loadingState} />
        </>
      </MapInstance>
      <AnimationControls className="w-full flex justify-center border-t-2 border-black bg-neutral-800 px-2 text-white max-md:pb-8" />
    </div>
  );
}
