import { useEffect } from "react";

import AnimationControls from "./map/controls/AnimationControls";
import WeatherMap from "./map/WeatherMap";

import { positronWxMap } from "@/assets/map-styles/positron-wxmap.js";

import type { ViewState } from "react-map-gl/maplibre";
import MapLoadingIndicator from "./ui/MapLoadingIndicator";
import { GeoLocation } from "./map/controls/GeoLocation";
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

import OptionsMapOverlays from "./map/controls/OptionsMapOverlays";
import OptionsRealtimeData from "./map/controls/OptionsRealtimeData";
import { SatelliteLayer } from "./map/layers/data/SatelliteLayer";
import { RadarLayer } from "./map/layers/data/RadarLayer";
import { TAFOverlay } from "./map/layers/overlays/TAFOverlay";
import { BedpostOverlay } from "./map/layers/overlays/BedpostOverlay";
import { FIROverlay } from "./map/layers/overlays/FIROverlay";
import { GFAOverlay } from "./map/layers/overlays/GFAOverlay";
import { LGFOverlay } from "./map/layers/overlays/LGFOverlay";
import { PublicRegionsOverlay } from "./map/layers/overlays/PublicRegionsOverlay";
import { MarineRegionsOverlay } from "./map/layers/overlays/MarineRegionsOverlay";
import { LightningDataLayer } from "./map/layers/data/LightningDataLayer";
import { SurfaceDataLayer } from "./map/layers/data/SurfaceDataLayer";
import { SurfaceDataPopup } from "./map/SurfaceDataPopup";
import AirQualityLayer from "./map/layers/data/AirQualityLayer";
import { SigmetLayer } from "./map/layers/data/SigmetLayer";

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

  // const interactiveLayers = ["layer-pirep", "layer-sigmet", "layer-airmet", "layer-sfc-obs-target"]
  const interactiveLayers = ["layer-sfc-obs-target"];

  return (
    <div className="bg-neutral-800 pt-2 md:h-(--md-map-height) max-md:h-(--max-md-map-height) text-sm">
      <WeatherMap
        viewState={viewState}
        mapProjection={projection}
        basemap={mapStyle}
        interactiveLayers={interactiveLayers}
      >
        <>
          {/* <AttributionControl
            compact
            position="top-right"
            style={{ backgroundColor: "var(--accent)", color: "var(--secondary)", border: "1px solid var(--primary)" }}
          /> */}

          {/* <DataAttributions className="absolute bottom-0 right-0 rounded-md max-w-1/2 bg-accent border-1 border-black text-white m-2" /> */}

          <SatelliteLayer domain="west" />
          <SatelliteLayer domain="east" />
          <RadarLayer />

          <AirQualityLayer />

          <SurfaceDataLayer />

          <SigmetLayer />

          <TAFOverlay />
          <BedpostOverlay />
          <FIROverlay />
          <GFAOverlay />
          <LGFOverlay />
          <PublicRegionsOverlay />
          <MarineRegionsOverlay />

          <LightningDataLayer timeRange={15} />

          <SurfaceDataPopup />

          <div key="map-options" className="absolute bottom-0 left-0 m-2 gap-2 flex flex-col">
            <OptionsRealtimeData />
            <OptionsMapOverlays />
            <GeoLocation />
          </div>
          <MapLoadingIndicator show={loadingState} />
        </>
      </WeatherMap>
      <AnimationControls className="w-full flex justify-center border-t-2 border-black bg-neutral-800 px-2 text-white max-md:pb-8" />
    </div>
  );
}
