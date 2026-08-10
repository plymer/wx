import { useEffect } from "react";

import AnimationControls from "@/components/map/controls/AnimationControls";
import WeatherMap from "@/components/map/WeatherMap";

import { positronWxMap } from "@/assets/map-styles/positron-wxmap.js";

import { AttributionControl, ScaleControl, type ViewState } from "react-map-gl/maplibre";
import MapLoadingIndicator from "@/components/map/MapLoadingIndicator";
import { GeoLocation } from "@/components/map/controls/GeoLocation";
import {
  useProjection,
  useLatitude,
  useLongitude,
  useZoom,
  useBearing,
  usePitch,
  useLayersLoading,
} from "@/stateStores/map/mapView";
import { useAnimationActions } from "@/stateStores/map/animation";

import MapOptions from "@/components/map/controls/MapOptions";
import { SatelliteLayer } from "@/components/map/layers/data/SatelliteLayer";
import { RadarLayer } from "@/components/map/layers/data/RadarLayer";
import { TAFOverlay } from "@/components/map/layers/overlays/TAFOverlay";
import { BedpostOverlay } from "@/components/map/layers/overlays/BedpostOverlay";
import { FIROverlay } from "@/components/map/layers/overlays/FIROverlay";
import { GFAOverlay } from "@/components/map/layers/overlays/GFAOverlay";
import { LGFOverlay } from "@/components/map/layers/overlays/LGFOverlay";
import { PublicRegionsOverlay } from "@/components/map/layers/overlays/PublicRegionsOverlay";
import { MarineRegionsOverlay } from "@/components/map/layers/overlays/MarineRegionsOverlay";
import { LightningDataLayer } from "@/components/map/layers/data/LightningDataLayer";
import { SurfaceDataLayer } from "@/components/map/layers/data/SurfaceDataLayer";
import { DataPopup } from "@/components/map/DataPopup";
import { AirQualityLayer } from "@/components/map/layers/data/AirQualityLayer";
import { SigmetLayer } from "@/components/map/layers/data/SigmetLayer";
import { AlertsLayer } from "@/components/map/layers/data/AlertsLayer";
import { VectorTileSource } from "@/components/map/layers/data/VectorTileSource";
// import { SiteSearch } from "@/components/map/controls/SiteSearch";
import { HillshadeLayer } from "@/components/map/layers/base/Hillshade";
import { AerialImageryLayer } from "@/components/map/layers/base/Aerial";

export default function WxMap() {
  // global state store subscriptions
  const loadingState = useLayersLoading().length > 0;
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
  const interactiveLayers = ["layer-sfc-obs-target", "layer-sigmet", "layer-wxo-alerts"];

  return (
    <div className="bg-neutral-800 pt-2 md:h-(--md-map-height) max-md:h-(--max-md-map-height) text-sm">
      <WeatherMap
        viewState={viewState}
        mapProjection={projection}
        basemap={mapStyle}
        interactiveLayers={interactiveLayers}
      >
        <ScaleControl
          position="bottom-right"
          unit="nautical"
          style={{
            backgroundColor: "rgba(0,0,0,0.25)",
            color: "white",
            fontWeight: "bold",
            borderColor: "rgba(255,255,255,0.6)",
          }}
        />
        <AttributionControl
          compact
          position="bottom-right"
          style={{ backgroundColor: "var(--accent)", color: "var(--secondary)", border: "1px solid var(--primary)" }}
        />

        <VectorTileSource />
        <HillshadeLayer />
        <AerialImageryLayer />

        <SatelliteLayer domain="west" />
        <SatelliteLayer domain="east" />
        <SatelliteLayer domain="europe" />
        <SatelliteLayer domain="indianOcean" />
        <SatelliteLayer domain="himawari" />
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

        <AlertsLayer />

        <LightningDataLayer />

        <DataPopup />

        <div key="map-options" className="absolute bottom-0 left-0 m-2 gap-2 flex flex-col">
          <MapOptions />
          <GeoLocation />
          {/* <SiteSearch /> */}
        </div>
        <MapLoadingIndicator show={loadingState} />
      </WeatherMap>
      <AnimationControls className="w-full flex justify-center border-t-2 border-black bg-neutral-800 px-2 text-white max-md:pb-8" />
    </div>
  );
}
