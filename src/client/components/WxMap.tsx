import WeatherControls from "./map/WeatherControls";
import AnimationControls from "./map/AnimationControls";
import MapInstance from "./map/MapInstance";

export default function WxMap() {
  // const handleClick = () => {
  //   alert("clicked!");
  // };

  return (
    <div className="bg-neutral-800 pt-2">
      <MapInstance className="">
        <WeatherControls />
      </MapInstance>
      <div className="w-full flex justify-center border-t-2  border-black bg-accent px-2 text-white max-md:pb-8">
        <AnimationControls />
      </div>
    </div>
  );
}
