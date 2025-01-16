import AnimationControls from "@/components/map/AnimationControls";

import MapInstance from "@/components/map/MapInstance";
import WeatherControls from "@/components/map/WeatherControls";

import { MapConfigContextProvider } from "@/contexts/mapConfigContext";

export default function WxMap() {
  // const handleClick = () => {
  //   alert("clicked!");
  // };

  return (
    <div className="bg-neutral-800 pt-2">
      <MapConfigContextProvider>
        <MapInstance height="calc(100svh - 9.6rem)" defaultLat={53} defaultLon={-95} defaultZoom={3.25}>
          <WeatherControls />
        </MapInstance>
        <div className="w-full flex justify-center border-t-2  border-black bg-accent px-2 text-white">
          <AnimationControls />
        </div>
      </MapConfigContextProvider>
    </div>
  );
}
