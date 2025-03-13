import RealtimeOptions from "./map/RealtimeOptions";
import AnimationControls from "./map/AnimationControls";
import MapInstance from "./map/MapInstance";
import { positronWxMap } from "../assets/map-styles/positron-wxmap";
import { useAnimationState } from "../stateStores/map/animation";
import {
  useBearing,
  useLatitude,
  useLoadingState,
  useLongitude,
  usePitch,
  useProjection,
  useZoom,
} from "../stateStores/map/mapView";
import { AttributionControl, ViewState } from "react-map-gl/maplibre";
import LoadingIndicator from "./ui/LoadingIndicator";

export default function WxMap() {
  // global state store subscriptions
  const animationState = useAnimationState();
  const loadingState = useLoadingState();
  const projection = useProjection();

  const viewState: Partial<ViewState> = {
    latitude: useLatitude(),
    longitude: useLongitude(),
    zoom: useZoom(),
    bearing: useBearing(),
    pitch: usePitch(),
  };

  // import the map style - this may need to change to allow different map styles in the future
  const mapStyle = positronWxMap;

  // TODO :: fix the small gap of a few px when the map is first loading because the wrapper div below does not actually cover the entire height of the map
  return (
    <div className="bg-neutral-800 pt-2 md:h-(--md-map-height) max-md:h-(--max-md-map-height)">
      <MapInstance viewState={viewState} mapProjection={projection} animationState={animationState} basemap={mapStyle}>
        <>
          <AttributionControl compact position="top-right" />
          <RealtimeOptions className="absolute bottom-0 left-0 m-2" />
          {loadingState && (
            <LoadingIndicator
              displayText="Loading"
              className="absolute top-0 left-0 ms-2 mt-2 text-white bg-transparent"
            />
          )}
        </>
      </MapInstance>
      <div className="w-full flex justify-center border-t-2  border-black bg-accent px-2 text-white max-md:pb-8">
        <AnimationControls />
      </div>
    </div>
  );
}
