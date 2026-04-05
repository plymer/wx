import { useEffect } from "react";

import AnimationControls from "./map/controls/AnimationControls";
import WeatherMap from "./map/WeatherMap";

import { positronWxMap } from "@/assets/map-styles/positron-wxmap.js";

import { AttributionControl, ScaleControl, type ViewState } from "react-map-gl/maplibre";
import MapLoadingIndicator from "./ui/MapLoadingIndicator";
import { GeoLocation } from "./map/controls/GeoLocation";
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

import MapOptions from "./map/controls/MapOptions";
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
import { DataPopup } from "./map/DataPopup";
import { AirQualityLayer } from "./map/layers/data/AirQualityLayer";
import { SigmetLayer } from "./map/layers/data/SigmetLayer";
import { TerrainRGB } from "./map/layers/base/TerrainRGB";
import { AlertsLayer } from "./map/layers/data/AlertsLayer";

export default function WxMap() {
  // global state store subscriptions
  const loadingState = useLayersLoading().length;

  console.log("Number of layers loading:", loadingState);
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

        <TerrainRGB />

        <SatelliteLayer domain="west" />
        <SatelliteLayer domain="east" />
        <SatelliteLayer domain="europe" />
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

        <LightningDataLayer timeRange={15} />

        <DataPopup />

        <div key="map-options" className="absolute bottom-0 left-0 m-2 gap-2 flex flex-col">
          <MapOptions />
          <GeoLocation />
        </div>
        <MapLoadingIndicator show={loadingState > 0} />
      </WeatherMap>
      <AnimationControls className="w-full flex justify-center border-t-2 border-black bg-neutral-800 px-2 text-white max-md:pb-8" />
    </div>
  );
}
