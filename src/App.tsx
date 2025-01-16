// third-party libraries
import { useState } from "react";

// ui components
import { Button } from "./components/ui/button";

// app mode components
import Observations from "./components/Observations";
import WxMap from "./components/WxMap";
import Aviation from "./components/Aviation";
import Outlooks from "./components/Outlooks";
import Public from "./components/Public";

// app mode configuration
import { APP_MODES } from "./config/modes";

export const App = () => {
  const [appMode, setAppMode] = useState("obs");

  return (
    <>
      {/* large-screen nav bar */}
      <nav className="flex justify-between px-4 mt-2 place-items-center max-md:hidden">
        <img src="/site-icon.svg" className="w-10 h-10 inline" />
        {APP_MODES.map((l, i) => (
          <Button
            key={i}
            variant={"menuTab"}
            className={appMode === l.mode ? "active " : ""}
            onClick={() => setAppMode(l.mode)}
          >
            {l.longName}
          </Button>
        ))}
      </nav>

      {/* small-screen nav bar */}
      <nav className="flex justify-between px-4 place-items-center md:hidden ">
        <img src="/site-icon.svg" className="w-6 h-6 inline" />
        {APP_MODES.map((l, i) => (
          <Button
            key={i}
            variant={"menuTab"}
            className={appMode === l.mode ? "active " : ""}
            onClick={() => setAppMode(l.mode)}
          >
            {l.shortName}
          </Button>
        ))}
      </nav>

      {/* add the app mode components here */}
      {appMode === "pub" && <Public />}
      {appMode === "avn" && <Aviation />}
      {appMode === "obs" && <Observations />}
      {appMode === "map" && <WxMap />}
      {appMode === "otlk" && <Outlooks />}

      {/* <ReactQueryDevtools /> */}
    </>
  );
};
