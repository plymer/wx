// third-party libraries
import { type ReactElement, useState } from "react";
import Map, { type ViewStateChangeEvent } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, MapLibreEvent, StyleSpecification } from "maplibre-gl";
import { Loader2 } from "lucide-react";

// helpers

// global state stores
import { useMapStateActions, useProjection, useViewState } from "@/stateStores/map/mapView";

import useMapClock from "@/hooks/useClock";
import { usePopupData, useUIActions } from "@/stateStores/map/ui";
import { useMapLoadingState } from "@/hooks/useMapLoadingState";
import { useRegisterMaplibreWorker } from "@/hooks/useRegisterMaplibreWorker";

interface Props {
  basemap: StyleSpecification;
  interactiveLayers?: string[];
  children?: ReactElement<any, any>[] | ReactElement<any, any>;
}

const WeatherMap = ({ children, basemap, interactiveLayers }: Props) => {
  useRegisterMaplibreWorker();

  // subscribe to our global state stores
  const { setViewState } = useMapStateActions();
  const viewState = useViewState();

  const { setPopupData } = useUIActions();
  const popupData = usePopupData();

  const projection = useProjection();

  const [isSatelliteLoading, setIsSatelliteLoading] = useState(false);
  const [isRadarLoading, setIsRadarLoading] = useState(false);

  useMapLoadingState("satellite", isSatelliteLoading);
  useMapLoadingState("radar", isRadarLoading);

  // set up our map clock so that our map animation is keeping up to date
  useMapClock();

  // keep track of the basemap layers so that we can filter them out when adding our own data layers
  const [baseMapLayers, setBaseMapLayers] = useState<string[]>();

  // keep track of the map initialization state
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // set the cursor state
  const [cursor, setCursor] = useState<React.CSSProperties["cursor"]>("grab");

  // // this is the data extracted from whatever map feature was clicked on, that is passed to the popup handler

  const handlePopupDisplay = (e: MapLayerMouseEvent): void => {
    const { features, lngLat, type } = e;

    if (type === "click" && features && features.length > 0) {
      setPopupData({ features, lngLat });
    } else {
      setPopupData(undefined);
    }
  };

  const onMapLoad = (e: MapLibreEvent) => {
    // Set base layers
    setBaseMapLayers(e.target.getLayersOrder());
    setIsMapInitialized(true);
  };

  const onMove = (e: ViewStateChangeEvent) => {
    setViewState(e.viewState);
    const bounds = e.target.getBounds();
    if (popupData && !bounds.contains(popupData.lngLat)) setPopupData(undefined);
  };

  return (
    <Map
      {...viewState}
      maxTileCacheSize={512}
      maxTileCacheZoomLevels={10}
      maxZoom={13}
      fadeDuration={0}
      projection={projection}
      attributionControl={false}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      boxZoom={false}
      cursor={cursor}
      style={{ width: "100%", height: "inherit", backgroundColor: "var(--color-neutral-700)" }}
      mapStyle={basemap}
      // define which layers are interactive (contain data that we can extract)
      interactiveLayerIds={interactiveLayers}
      // when we click on the map, we want to extract data from any features in the interactive layers defined above, and pass that to a popup that will display on the map
      onClick={(e) => {
        handlePopupDisplay(e);
      }}
      onMouseEnter={() => setCursor("pointer")}
      onMouseLeave={() => setCursor("grab")}
      onLoad={onMapLoad}
      onSourceData={(e) => {
        const isSatelliteLoading = e.sourceId.includes("satellite");
        const isRadarLoading = e.sourceId.includes("radar");

        setIsSatelliteLoading(isSatelliteLoading && e.isSourceLoaded === false);
        setIsRadarLoading(isRadarLoading && e.isSourceLoaded === false);
      }}
      onMove={onMove}
    >
      {isMapInitialized && baseMapLayers ? (
        <>{children}</>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
          <Loader2 className="inline animate-spin me-2" />
          Map Initializing...
        </div>
      )}
    </Map>
  );
};

export default WeatherMap;
