import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAppMode, useSetAppMode } from "@/stateStores/app";
import { AppMode } from "@/lib/types";
import { APP_MODES_LIST } from "@/config/modes";

const useHashPath = () => {
  const appModesList: AppMode[] = Object.keys(APP_MODES_LIST).map((k) => k as AppMode);

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
    // get our hash mode from the URL path
    // using HashRouter means that 'pathname' will be, compltely unintuitively(!)
    //  the hash path, while 'hash' is actually empty (lol)
    const hashMode = location.pathname.replace("/", "") as AppMode;

    // if redirected from nginx, set ignoreHashOnce and clean up the URL
    const params = new URLSearchParams(location.search);
    if (params.has("redirected")) {
      sessionStorage.setItem("ignoreHashOnce", "true");
      // Remove the query param from the URL, set the appMode, and navigate to the hash mode
      setAppMode(hashMode);
      navigate(`/${hashMode}`, { replace: true });
      return;
    }

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

    // if the hash mode is set, valid, and different from the current app mode, set the app mode
    if (hashMode && hashMode !== appMode && appModesList.includes(hashMode)) {
      setAppMode(hashMode);
      // otherwise if there's no hashMode but we have an appMode, navigate to that app mode
    } else if (!hashMode && appMode) {
      navigate(`/${appMode}`, { replace: true });
    }
  }, [location.pathname]);
};

export default useHashPath;
