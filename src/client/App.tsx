// third-party libraries
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

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

  // handle app mode base on the URL hash path
  // we are using the hash path to determine the app mode
  // and allow us to create a sharable URL without breaking
  // the iOS SPA PWA experience
  // the nginx config on the server uses a 302 redirect to take any URL that points to /[appModesList]
  // and convert it to a /#/[appModesList] URL, which is then handled by this code
  useEffect(() => {
    // this is a hack to allow iOS PWA users to have their app mode set when they first open the app
    // this is necessary because when they add the app to their home screen,
    // the app will reference whatever the their app mode was when they created the shortcut
    // we're using sessionStorage to set a flag to ignore the hash path once and stop the
    // redirect that would otherwise happen; this flag is cleared when the app is force-closed
    // or the app is ended by iOS internal memory management
    if (!sessionStorage.getItem("ignoreHashOnce")) {
      if (location.pathname !== "/" && location.pathname !== "") {
        // Remove the hash path and go to the appMode in localStorage
        sessionStorage.setItem("ignoreHashOnce", "true");
        navigate(`/${appMode}`, { replace: true });
        return;
      }
    }

    // get our hash mode from the URL path
    // using HashRouter means that 'pathname' will be, compltely unintuitively(!)
    //  the hash path, while 'hash' is actually empty (lol)
    const hashMode = location.pathname.replace("/", "") as AppMode;

    // if the hash mode is set, valid, and different from the current app mode, set the app mode
    if (hashMode && hashMode !== appMode && appModesList.includes(hashMode)) {
      setAppMode(hashMode);
      // otherwise if there's no hashMode but we have an appMode, navigate to that app mode
    } else if (!hashMode && appMode) {
      navigate(`/${appMode}`, { replace: true });
    }
  }, [location.pathname]);

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
