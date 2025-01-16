import { useState } from "react";
import { Button } from "./components/ui/button";
import Observations from "./components/Observations";
import WxMap from "./components/WxMap";
import Aviation from "./components/Aviation";
import Outlooks from "./components/Outlooks";
import Public from "./components/Public";

export const App = () => {
  const [appMode, setAppMode] = useState("obs");

  const LinkDetails = [
    { longName: "Public", shortName: "PUB", mode: "pub" },
    { longName: "Aviation", shortName: "AVN", mode: "avn" },
    { longName: "Observations", shortName: "OBS", mode: "obs" },
    { longName: "Weather Map", shortName: "MAP", mode: "map" },
    { longName: "Outlooks", shortName: "OTLK", mode: "otlk" },
  ];

  return (
    <>
      <nav className="flex justify-between px-4 place-items-center max-md:hidden">
        <img src="/site-icon.svg" className="w-10 h-10 inline mb-2" />
        {LinkDetails.map((l, i) => (
          <Button
            key={i}
            className={"px-6 py-3 text-center [&.active]:bg-neutral-800 [&.active]:text-white [&.active]:rounded-t-md"}
            onClick={() => setAppMode(l.mode)}
          >
            {l.longName}
          </Button>
        ))}
      </nav>
      <nav className="flex justify-between px-4 place-items-center md:hidden ">
        <img src="/site-icon.svg" className="w-6 h-6 inline" />
        {LinkDetails.map((l, i) => (
          <Button
            key={i}
            className={"px-3 py-1 text-center [&.active]:bg-neutral-800 [&.active]:text-white [&.active]:rounded-t-md"}
            onClick={() => setAppMode(l.mode)}
          >
            {l.shortName}
          </Button>
        ))}
      </nav>
      {appMode === "pub" && <Public />}
      {appMode === "obs" && <Observations />}
      {appMode === "map" && <WxMap />}
      {appMode === "avn" && <Aviation />}
      {appMode === "otlk" && <Outlooks />}

      {/* <ReactQueryDevtools /> */}
    </>
  );
};
