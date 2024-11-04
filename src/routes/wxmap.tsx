import AnimationControls from "@/components/map/AnimationControls";
import GeoMetLayer from "@/components/map/GeoMetLayer";
import MapInstance from "@/components/map/MapInstance";
import WeatherControls from "@/components/map/WeatherControls";

import { AnimationContextProvider } from "@/contexts/animationContext";
import { useGeoMetContext } from "@/contexts/geometContext";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/wxmap")({
  component: WxMapComponent,
});

function WxMapComponent() {
  const geoMet = useGeoMetContext();

  const handleClick = () => {
    alert("clicked!");
  };

  return (
    <div className="bg-neutral-800 pt-2">
      <AnimationContextProvider>
        <MapInstance
          height="calc(100svh - 10.6rem)"
          defaultLat={53}
          defaultLon={-95}
          defaultZoom={3.25}
          onClick={handleClick}
        >
          <>
            <GeoMetLayer type="satellite" product={geoMet.subProduct} domain="west" belowLayer="wateroutline" />
            <GeoMetLayer type="satellite" product={geoMet.subProduct} domain="east" belowLayer="wateroutline" />
            <WeatherControls />
          </>
        </MapInstance>
        <div className="w-full flex justify-center border-t-2  border-black bg-accent px-2 text-white">
          <AnimationControls />
        </div>
      </AnimationContextProvider>
    </div>
  );
}
