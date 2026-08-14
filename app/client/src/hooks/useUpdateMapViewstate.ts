import { useCallback, useEffect, useRef } from "react";
import { useMapStateActions } from "../stateStores/map/mapView";
import { usePopupData, useUIActions } from "../stateStores/map/ui";
// import { SiteMetaData } from "../lib/types";
// import { checkIfInBounds } from "@/lib/utils";
import { Map } from "maplibre-gl";
import type { ViewState } from "react-map-gl/maplibre";

/**
 * used to control the map's view state
 * @returns an object with two functions that can be used to update the map view state from a map event or center the map on a site
 */
export function useUpdateMapViewstate() {
  const mapActions = useMapStateActions();

  const popupData = usePopupData();
  const { setPopupData } = useUIActions();

  const popupDataRef = useRef(popupData);

  useEffect(() => {
    popupDataRef.current = popupData;
  }, [popupData]);

  const updateFromMapEvent = useCallback(
    (map: Map, viewState: ViewState) => {
      if (!map || !viewState) {
        console.log("error: no map ref or view state");
        return;
      }

      mapActions.setLongitude(viewState.longitude);
      mapActions.setLatitude(viewState.latitude);
      mapActions.setZoom(viewState.zoom);

      const bounds = map.getBounds();

      const currentPopupData = popupDataRef.current;
      if (currentPopupData && !bounds.contains(currentPopupData.lngLat)) {
        setPopupData(undefined);
      }
    },
    [mapActions, setPopupData],
  );

  // const centerOnSite = useCallback(
  //   (site: SiteMetaData[0]) => {
  //     if (!site || !viewportRef.current) {
  //       console.log(`error - site: ${site} prevViewport: ${viewportRef.current}`);
  //       return;
  //     }

  //     const { lon, lat } = site.coords;

  //     if (!checkIfInBounds([lon, lat], viewportRef.current)) {
  //       mapActions.setLongitude(lon);
  //       mapActions.setLatitude(lat);

  //       recomputeViewport();
  //     }
  //   },
  //   [mapActions, viewportRef, mapRef],
  // );

  return { updateFromMapEvent };
}
