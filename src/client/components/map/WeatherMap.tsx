// third-party libraries
import { ReactElement, useState } from "react";
import Map, { ViewState, ViewStateChangeEvent } from "react-map-gl/maplibre";
import { MapLibreEvent, StyleSpecification } from "maplibre-gl";
import { Loader2 } from "lucide-react";

// map css
import "maplibre-gl/dist/maplibre-gl.css";

// helpers
import { MAP_BOUNDS } from "@/config/map";

// global state stores
import { useMapStateActions } from "@/stateStores/map/mapView";
import { useUpdateMapViewstate } from "@/hooks/useUpdateMapViewstate";
import { MapProjections } from "@/lib/types";
import useMapClock from "@/hooks/useClock";

interface Props {
  viewState: Partial<ViewState>;
  mapProjection: MapProjections;
  basemap: StyleSpecification;
  interactiveLayers?: string[];
  children?: ReactElement<any, any>;
}

const WeatherMap = ({ viewState, mapProjection, children, basemap }: Props) => {
  // subscribe to our global state stores
  const mapState = useMapStateActions();
  const mapViewUpdater = useUpdateMapViewstate();

  // set up our map clock so that our map animation is keeping up to date
  useMapClock();

  // keep track of the basemap layers so that we can filter them out when adding our own data layers
  const [baseMapLayers, setBaseMapLayers] = useState<string[]>();

  // keep track of the map initialization state
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // // this is the data extracted from whatever map feature was clicked on, that is passed to the popup handler
  // const [popupData, setPopupData] = useState<PopupData>();

  // const handlePopupDisplay = (e: MapLayerMouseEvent): void => {
  //   const { features, lngLat, type } = e;

  //   if (type === "click" && features && features[0]) {
  //     // set the sidebar mode to whatever the datatype of the clicked feature is
  //     actions.setMode(features[0].properties.dataType);

  //     // we can indeed collect data about ALL of the features we have clicked
  //     // we will do something with this in the future
  //     // console.log(features);

  //     // set the site id, pirep id, sigmet id, or airmet id based on the datatype of the clicked feature
  //     switch (features[0].properties.dataType as AlphaDataTypes) {
  //       case "site":
  //         actions.setSiteId(features[0].properties.siteId); // set the global state store
  //         setSiteId && setSiteId(features[0].properties.siteId); // pass the siteId up to the parent
  //         isPopoutOpen && popout.postMessage({ action: "search", payload: { search: features[0].properties.siteId } }); // send the siteId to the popout if it is open
  //         break;
  //       case "pirep":
  //         actions.setPirepId(features[0].properties.pirepId);
  //         break;
  //       case "sigmet":
  //         actions.setSigmetId(features[0].properties.sigmetId);
  //         break;
  //       case "airmet":
  //         actions.setAirmetId(features[0].properties.airmetId);
  //         break;
  //     }
  //   }

  //   if (features && features[0])
  //     setPopupData({ feature: features[0], coords: lngLat, dataType: features[0].properties.dataType });
  // };

  const onMapLoad = (e: MapLibreEvent) => {
    // Store map reference in mapState
    mapState.setMapRef(e.target);

    // Set base layers
    setBaseMapLayers(e.target.getLayersOrder());
    setIsMapInitialized(true);
  };

  const onMove = (e: ViewStateChangeEvent) => {
    mapViewUpdater.updateFromMapEvent(e.target, e.viewState);
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
      maxBounds={MAP_BOUNDS}
      style={{ width: "100%", height: "inherit", backgroundColor: "var(--color-neutral-700)" }}
      mapStyle={basemap}
      // define which layers are interactive (contain data that we can extract)
      // interactiveLayerIds={["layer-pirep", "layer-sigmet", "layer-airmet", "layer-sfc-obs-target"]}
      // when we click on the map, we want to extract data from any features in the interactive layers defined above, and pass that to a popup that will display on the map
      // onClick={(e) => {
      //   handlePopupDisplay(e);
      // }}
      // onMouseEnter={(e) => {
      //   handlePopupDisplay(e);
      //   setCursor("pointer");
      // }}
      // onMouseMove={(e) => {
      //   handlePopupDisplay(e);
      // }}
      // onMouseLeave={() => {
      //   setPopupData(undefined);
      //   setCursor("grab");
      // }}
      onLoad={onMapLoad}
      onMouseDown={(e) => {
        if (e.originalEvent.button === 1) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          alert("Public forecast extraction not yet implemented.");
        }
      }}
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
