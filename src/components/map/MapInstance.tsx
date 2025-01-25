import { ReactElement, useState } from "react";
import Map, { ViewState, AttributionControl } from "@vis.gl/react-maplibre";
import { StyleSpecification } from "maplibre-gl";
import { Loader2 } from "lucide-react";

// css
import "maplibre-gl/dist/maplibre-gl.css";

// map style
import basemap from "@/assets/map-styles/positronwxmap.json";

// helpers
import { MAP_BOUNDS } from "@/lib/constants";

import LayerManager from "./LayerManager";
import { useMap } from "@/stateStores/map";

interface Props {
  width?: string;
  height?: string;
  defaultLon: number | -95;
  defaultLat: number | 53;
  defaultZoom: number | 3.25;
  children?: ReactElement<any, any>;
  // onClick?: () => void;
}

const MapInstance = ({ width, height, defaultLon, defaultLat, defaultZoom, children }: Props) => {
  const animation = useMap((state) => state.animation);

  const [baseMapLayers, setBaseMapLayers] = useState<string[]>();
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({
    latitude: defaultLat,
    longitude: defaultLon,
    zoom: defaultZoom,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, left: 0, right: 0, bottom: 0 },
  });

  return (
    <div>
      <Map
        latitude={viewState.latitude}
        longitude={viewState.longitude}
        zoom={viewState.zoom}
        bearing={viewState.bearing}
        pitch={viewState.pitch}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        boxZoom={false}
        maxBounds={MAP_BOUNDS}
        projection={"globe"}
        style={{ width: width || "100%", height: height, minHeight: "200px" }}
        mapStyle={basemap as StyleSpecification}
        onStyleData={(e) => {
          // make sure we know what layers are in use by the basemap so that we can filter these out from our actual data layers that we are adding later
          // this should only fire on initial map load
          if (!baseMapLayers) setBaseMapLayers(e.target.getLayersOrder());
        }}
        onSourceData={() => {
          // if (e.isSourceLoaded) {
          //   console.log(e.sourceId, "completed loading");
          // }

          // show the loading spinner in the top right of the map while a data source is loading data
          setIsMapLoading(true);
        }}
        onIdle={() => {
          // we turn the loading spinner off when the map isn't doing anything
          setIsMapLoading(false);

          // once the map is idle for the first time, it has initialized, so we can start adding data to it
          setIsMapInitialized(true);

          // once no more source data is loading, allow the map to transistion to animating
          if (animation.state === "loading") animation.setState("playing");
        }}
        onMove={(e) => {
          setViewState({
            ...viewState,
            longitude: e.viewState.longitude,
            latitude: e.viewState.latitude,
            zoom: e.viewState.zoom,
          });
        }}
      >
        {isMapInitialized && baseMapLayers ? (
          <>
            {children}
            <LayerManager baseLayers={baseMapLayers} />
          </>
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
            <Loader2 className="inline animate-spin me-2" />
            Map Initializing...
          </div>
        )}

        <AttributionControl compact position="top-right" />

        {isMapLoading && (
          <div className="text-white absolute top-0 left-0 mt-2 ms-2 place-items-center">
            <Loader2 className="inline animate-spin me-2" />
            Loading...
          </div>
        )}
      </Map>
    </div>
  );
};

export default MapInstance;
