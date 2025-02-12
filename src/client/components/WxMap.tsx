import WeatherControls from "./map/WeatherControls";
import AnimationControls from "./map/AnimationControls";
import MapInstance from "./map/MapInstance";

export default function WxMap() {
  // const handleClick = () => {
  //   alert("clicked!");
  // };

  // TODO :: fix the small gap of a few px when the map is first loading because the wrapper div below does not actually cover the entire height of the map
  return (
    <div className="bg-neutral-800 pt-2 md:h-(--md-map-height) max-md:h-(--max-md-map-height)">
      <MapInstance>
        <WeatherControls />
      </MapInstance>
      <div className="w-full flex justify-center border-t-2  border-black bg-accent px-2 text-white max-md:pb-8">
        <AnimationControls />
      </div>
    </div>
  );
}
