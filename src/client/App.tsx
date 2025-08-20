// third-party libraries
import { useNavigate } from "react-router";

// ui components
import Button from "@/components/ui/Button";

// app mode components
import Observations from "@/components/Observations";
import WxMap from "@/components/Map";
import Aviation from "@/components/Aviation";
import Outlooks from "@/components/Outlooks";
import Public from "@/components/Public";

// hooks
import useHashPath from "@/hooks/useHashPath";

// app mode configuration
import { APP_MODES_LIST } from "@/config/modes";
import { useAppMode, useSetAppMode } from "@/stateStores/app";
import { AppMode } from "@/lib/types";
import { Toaster } from "@/components/ui/Sonner";

const appModesList: AppMode[] = Object.keys(APP_MODES_LIST).map((k) => k as AppMode);

export const App = () => {
  const appMode = useAppMode();
  const setAppMode = useSetAppMode();
  const navigate = useNavigate();

  // we're using this custom hook to handle the app mode based on the URL hash path
  // so we can create a sharable URL without breaking the iOS SPA PWA experience
  useHashPath();

  // handle the app mode when a user clicks on one of the app mode tabs
  const handleSetAppMode = (mode: AppMode) => {
    if (mode !== appMode) {
      setAppMode(mode);
      navigate(`/${mode}`, { replace: true });
    }
  };

  return (
    <main className="w-full max-w-(--breakpoint-2xl) mx-auto">
      {/* large-screen nav bar */}
      <nav className="flex justify-between px-4 mt-2 place-items-center max-md:hidden">
        <img src="/site-icon.svg" className="size-10 inline me-2" />
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
    </main>
  );
};
