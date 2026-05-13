// third-party libraries
import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

// ui components
import Button from "@/components/ui/Button";
import { GlobalMessage } from "./components/ui/GlobalMessage";
import { Toaster } from "@/components/ui/Sonner";

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
import type { AppMode } from "@/lib/types";
import { api } from "@/lib/trpc";
import { MINUTE } from "@shared/lib/constants";

const appModesList: AppMode[] = Object.keys(APP_MODES_LIST).map((k) => k as AppMode);

export const App = () => {
  const appMode = useAppMode();
  const setAppMode = useSetAppMode();
  const navigate = useNavigate();

  const [showGlobalMessage, setShowGlobalMessage] = useState(true);

  const { data: globalMessages } = useQuery(api.messages.get.queryOptions(undefined, { refetchInterval: MINUTE }));

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

  const handleMessageClose = () => setShowGlobalMessage(false);

  return (
    <main className="w-full max-w-384 mx-auto">
      <nav className="flex gap-1 justify-between px-4 mt-2 items-center">
        <img src="/site-icon.svg" className="max-md:size-6 md:size-10" />
        {appModesList.map((m, i) => (
          <Button
            key={i}
            variant={"menuTab"}
            className={appMode === m ? "active " : ""}
            onClick={() => handleSetAppMode(m)}
          >
            <span className="max-md:hidden">{APP_MODES_LIST[m].longName}</span>
            <span className="md:hidden">{APP_MODES_LIST[m].shortName}</span>
          </Button>
        ))}
      </nav>

      {/* add the app mode components here */}
      {appMode === "pub" && <Public />}
      {appMode === "avn" && <Aviation />}
      {appMode === "obs" && <Observations />}
      {appMode === "map" && <WxMap />}
      {appMode === "otlk" && <Outlooks />}

      {showGlobalMessage && globalMessages && (
        <GlobalMessage
          message={globalMessages.message}
          timestamp={globalMessages.timestamp}
          title={globalMessages.title}
          onClick={handleMessageClose}
        />
      )}

      <Toaster toastOptions={{ className: "bg-neutral-800 text-white" }} />
    </main>
  );
};
