import { ReactElement, useState } from "react";
import Map, { AttributionControl } from "@vis.gl/react-maplibre";
import { StyleSpecification } from "maplibre-gl";
import { Loader2 } from "lucide-react";

// css
import "maplibre-gl/dist/maplibre-gl.css";

// map style
import basemap from "@/assets/map-styles/positronwxmap.json";

// helpers
import { MAP_BOUNDS } from "@/config/map";

import LayerManager from "./LayerManager";

import { useAnimation } from "@/stateStores/map/animation";
import { useMapViewState } from "@/stateStores/map/view";

interface Props {
  width?: string;
  height: string;
  children?: ReactElement<any, any>;
  // onClick?: () => void;
}

const MapInstance = ({ width, children, height }: Props) => {
  // get access to our mapConfig context
  const animationState = useAnimation((state) => state.state);
  const play = useAnimation((state) => state.play);

  // state hooks for the various states the map can exist in
  const [baseMapLayers, setBaseMapLayers] = useState<string[]>();

  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const viewState = useMapViewState();

  return (
    <div>
      <Map
        latitude={viewState.latitude}
        longitude={viewState.longitude}
        zoom={viewState.zoom}
        bearing={viewState.bearing}
        pitch={viewState.pitch}
        // projection={"globe"}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        boxZoom={false}
        maxBounds={MAP_BOUNDS}
        style={{ width: width || "100%", height: height }}
        mapStyle={basemap as StyleSpecification}
        onLoad={(e) => {
          // this is equivalent to when (e.target._fullyLoaded === true)
          // make sure we know what layers are 'owned' by the basemap so that we can filter these out from our actual data layers that we are adding later
          // we call this on inital map load so that it is not 'contaminated' by any other layers that we have added to the map
          setBaseMapLayers(e.target.getLayersOrder());
          // the map has been initialized, so we can start adding data to it
          setIsMapInitialized(true);
        }}
        onSourceData={() => {
          // we know that the map will have a mapConfig.frameCount number of possible 'sub layers' per layer type
          // we know that this only applies when the map is animating, otherwise we are only showing one (1) 'sub layer' per layer type
          // what if we track the sum of all of the isSourceLoaded returns on a per layer basis
          // satellite needs to have all of its frameCount values doubled since there are two (2) layers

          // dataLayerTypes.forEach((type) => {
          //   if (e.sourceId.includes(type) && !e.isSourceLoaded) {
          //     if (!pendingLayers.includes(e.sourceId)) setPendingLayers([...pendingLayers, e.sourceId]);
          //   }

          //   if (e.sourceId.includes(type) && e.isSourceLoaded) {
          //     if (!loadedLayers.includes(e.sourceId)) setLoadedLayers([...loadedLayers, e.sourceId]);
          //   }
          // });

          // show the loading spinner in the top right of the map while a data source is loading data
          setIsMapLoading(true);
        }}
        onIdle={() => {
          // we turn the loading spinner off when the map isn't doing anything
          setIsMapLoading(false);

          // setLoadedLayers([]);
          // setPendingLayers([]);

          // once no more source data is loading, allow the map to transistion to animating
          if (animationState === "loading") play();
        }}
        onMove={(e) => {
          viewState.setLongitude(e.viewState.longitude);
          viewState.setLatitude(e.viewState.latitude);
          viewState.setZoom(e.viewState.zoom);
        }}
      >
        {isMapInitialized && baseMapLayers ? (
          <>
            {children}
            <LayerManager baseLayers={baseMapLayers} />
          </>
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black">
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
