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
import { api } from "./lib/trpc";
import { MINUTE } from "@shared/lib/constants";
import { TwitterIcon } from "./components/ui/TwitterIcon";

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
    <main className="relative w-full max-w-(--breakpoint-2xl) mx-auto">
      <nav className="flex justify-between md:px-4 md:mt-2 max-md:px-2 place-items-center">
        <img src="/site-icon.svg" className="md:size-10 max-md:size-6 inline me-2" />
        {appModesList.map((l, i) => (
          <Button
            key={i}
            variant={"menuTab"}
            className={appMode === l ? "active " : ""}
            onClick={() => handleSetAppMode(l)}
          >
            <span className="max-md:hidden">{APP_MODES_LIST[l].longName}</span>
            <span className="md:hidden">{APP_MODES_LIST[l].shortName}</span>
          </Button>
        ))}

        <a
          href="https://twitter.com/prairiewxca"
          target="_blank"
          rel="noopener noreferrer"
          title="Reach out on Twitter"
        >
          <TwitterIcon className="text-neutral-800 fill-neutral-600 hover:fill-neutral-800 transition-all stroke-0 md:size-8 max-md:size-6" />
        </a>
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
