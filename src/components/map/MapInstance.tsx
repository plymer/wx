import Map from "react-map-gl/maplibre";
import { AttributionControl } from "react-map-gl";
import { StyleSpecification } from "maplibre-gl";

// css
import "maplibre-gl/dist/maplibre-gl.css";

// map style
import basemap from "@/assets/map-styles/positronwxmap.json";

// helpers
import { MAP_BOUNDS } from "@/lib/constants";
import { ReactElement, useState } from "react";
import { useAnimationContext } from "@/contexts/animationContext";
import { Loader2 } from "lucide-react";

interface Props {
  width?: string;
  height?: string;
  defaultLon: number | -95;
  defaultLat: number | 53;
  defaultZoom: number | 3.25;
  children?: ReactElement<any, any>;
}

const MapInstance = ({ width, height, defaultLon, defaultLat, defaultZoom, children }: Props) => {
  // controls the state of the loading spinner
  const animation = useAnimationContext();
  const [isLoading, setIsLoading] = useState(false);

  // map viewstate is CONTROLLED in this app
  const [lat, setLat] = useState(defaultLat);
  const [lon, setLon] = useState(defaultLon);
  const [zoom, setZoom] = useState(defaultZoom);
  return (
    <div>
      <Map
        latitude={lat}
        longitude={lon}
        zoom={zoom}
        attributionControl={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        boxZoom={false}
        maxBounds={MAP_BOUNDS}
        style={{ width: width || "100%", height: height || "400px" }}
        mapStyle={basemap as StyleSpecification}
        // onLoad={() => console.log(layers)}
        // onStyleData={(e) => {
        //   // make sure we know what layers are in use by the basemap so that we can filter these out from our actual data layers that we are adding later
        //   // this should only fire on initial map load
        //   !baseMapLayers
        //     ? setBaseMapLayers(e.target.getLayersOrder())
        //     : setLayers(
        //         e.target
        //           .getLayersOrder()
        //           .filter((layer) => !baseMapLayers.includes(layer)),
        //       );
        // }}
        onSourceData={() => {
          // if (e.isSourceLoaded) {
          //   console.log(e.sourceId, "completed loading");
          // }
          setIsLoading(true);
          // we set our 'isLoading' flag to true any time one of the layers in the map is loading data
          // this allows us to show the loading spinner active
        }}
        onIdle={() => {
          // we turn the loading spinner off when the map isn't doing anything
          setIsLoading(false);

          // once no more source data is loading, allow the map to transistion to animating
          animation.animationState === "loading" ? animation.setAnimationState("playing") : "";
        }}
        onMove={
          /* update our map-center lat-lon and zoom whenever we move the map view */
          (e) => {
            setLat(e.viewState.latitude);
            setLon(e.viewState.longitude);
            setZoom(e.viewState.zoom);
          }
        }
      >
        {children}

        <AttributionControl compact position="top-right" />
        {isLoading ? (
          <div className="text-white absolute top-0 left-0 mt-2 ms-2 place-items-center">
            <Loader2 className="inline animate-spin me-2" />
            Loading...
          </div>
        ) : (
          ""
        )}
      </Map>

      {/* <LayerList layerNames={layers} /> */}
    </div>
  );
};

export default MapInstance;
