// third-party libraries
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ui components
import Button from "@/components/ui/Button";

// app mode components
import Observations from "@/components/Observations";
import WxMap from "@/components/WxMap";
import Aviation from "@/components/Aviation";
import Outlooks from "@/components/Outlooks";
import Public from "@/components/Public";

// app mode configuration
import { APP_MODES_LIST } from "@/config/modes";
import { useAppMode, useSetAppMode } from "@/stateStores/app";
import { AppMode } from "@/lib/types";
import { Toaster } from "@/components/ui/Sonner";

const appModesList: AppMode[] = Object.keys(APP_MODES_LIST).map((k) => k as AppMode);

export const App = () => {
  const appMode = useAppMode();
  const setAppMode = useSetAppMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  // handle app mode base on the URL hash path
  // we are using the hash path to determine the app mode
  // and allow us to create a sharable URL without breaking
  // the iOS SPA PWA experience
  // useEffect(() => {
  //   const hashMode = location.pathname.replace("/", "") as AppMode;

  //   setCount(count + 1);

  //   console.log(count, location.pathname, location.hash, hashMode, appMode);

  //   // if the hash mode is set, valid, and different from the current app mode, set the app mode
  //   if (hashMode && hashMode !== appMode && appModesList.includes(hashMode)) {
  //     setAppMode(hashMode);
  //   } else if (!hashMode && appMode) {
  //     navigate(`/${appMode}`, { replace: true });
  //   }
  // }, [location.pathname, location.hash]);

  useEffect(() => {
    // Only handle appMode if we're at the SPA root (after nginx redirect)
    if (location.pathname !== "/") return;

    const hashMode = location.hash.replace(/^#\/?/, "") as AppMode;

    if (hashMode && hashMode !== appMode && appModesList.includes(hashMode)) {
      setAppMode(hashMode);
    } else if (!hashMode && appMode) {
      navigate(`/#/${appMode}`, { replace: true });
    }
  }, [location.pathname, location.hash]);

  // handle the app mode when a user clicks on one of the app mode tabs
  const handleSetAppMode = (mode: AppMode) => {
    if (mode !== appMode) {
      setAppMode(mode);
      navigate(`/#/${mode}`, { replace: true });
    }
  };

  return (
    <main className="w-full max-w-(--breakpoint-2xl) mx-auto">
      {/* large-screen nav bar */}
      <nav className="flex justify-between px-4 mt-2 place-items-center max-md:hidden">
        <img src="/site-icon.svg" className="w-10 h-10 inline me-2" />
        {appModesList.map((l, i) => (
          <Button
            key={i}
            variant={"menuTab"}
            className={appMode === l ? "active " : ""}
            onClick={() => handleSetAppMode(l)}
          >
            {APP_MODES_LIST[l].longName}
          </Button>
        ))}
      </nav>

      {/* small-screen nav bar */}
      <nav className="flex justify-between px-2 place-items-center md:hidden ">
        <img src="/site-icon.svg" className="w-6 h-6 inline" />
        {appModesList.map((l, i) => (
          <Button
            key={i}
            variant={"menuTab"}
            className={appMode === l ? "active " : ""}
            onClick={() => handleSetAppMode(l)}
          >
            {APP_MODES_LIST[l].shortName}
          </Button>
        ))}
      </nav>

      {/* add the app mode components here */}
      {appMode === "pub" && <Public />}
      {appMode === "avn" && <Aviation />}
      {appMode === "obs" && <Observations />}
      {appMode === "map" && <WxMap />}
      {appMode === "otlk" && <Outlooks />}

      <Toaster toastOptions={{ className: "bg-neutral-800 text-white" }} />

      {/* <ReactQueryDevtools /> */}
    </main>
  );
};
