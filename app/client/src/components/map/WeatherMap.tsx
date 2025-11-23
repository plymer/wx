// third-party libraries
import { type ReactElement, useState } from "react";
import Map, { type ViewState, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent, MapLibreEvent, StyleSpecification } from "maplibre-gl";
import { Loader2 } from "lucide-react";

// helpers

// global state stores
import { useMapStateActions } from "@/stateStores/map/mapView";
import { useUpdateMapViewstate } from "@/hooks/useUpdateMapViewstate";
import type { MapProjections } from "@/lib/types";
import useMapClock from "@/hooks/useClock";
import { useUIActions } from "@/stateStores/map/ui";

interface Props {
  viewState: Partial<ViewState>;
  mapProjection: MapProjections;
  basemap: StyleSpecification;
  interactiveLayers?: string[];
  children?: ReactElement<any, any>;
}

const WeatherMap = ({ viewState, mapProjection, children, basemap, interactiveLayers }: Props) => {
  // subscribe to our global state stores
  const mapState = useMapStateActions();
  const { updateFromMapEvent } = useUpdateMapViewstate();
  const { setPopupData } = useUIActions();

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
    }
  };

  const onMapLoad = (e: MapLibreEvent) => {
    // Store map reference in mapState
    mapState.setMapRef(e.target);

    // Set base layers
    setBaseMapLayers(e.target.getLayersOrder());
    setIsMapInitialized(true);
  };

  const onMove = (e: ViewStateChangeEvent) => {
    updateFromMapEvent(e.target, e.viewState);
  };

  return (
    <Map
      maxTileCacheSize={512}
      maxTileCacheZoomLevels={10}
      fadeDuration={0}
      latitude={viewState.latitude}
      longitude={viewState.longitude}
      zoom={viewState.zoom}
      bearing={viewState.bearing}
      pitch={viewState.pitch}
      projection={mapProjection}
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
        if (e.sourceId.includes("satellite") || e.sourceId.includes("radar")) {
          mapState.setLoadingState(true);
        }
      }}
      onIdle={() => {
        mapState.setLoadingState(false);
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
