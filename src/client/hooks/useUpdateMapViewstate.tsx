import { useCallback, useEffect, useRef } from "react";
import { useMapRef, useMapStateActions, useViewportBounds } from "../stateStores/map/mapView";
// import { SiteMetaData } from "../lib/types";
// import { checkIfInBounds } from "@/lib/utils";
import { Map } from "maplibre-gl";
import { ViewState } from "react-map-gl/maplibre";

/**
 * used to control the map's view state
 * @returns an object with two functions that can be used to update the map view state from a map event or center the map on a site
 */
export function useUpdateMapViewstate() {
  const mapActions = useMapStateActions();
  const viewport = useViewportBounds();
  const mapRef = useMapRef();

  const viewportRef = useRef(viewport);

  // keep the viewport ref up to date between renders
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

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
      const newViewport: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      mapActions.setViewportBounds(newViewport);
    },
    [mapActions]
  );

  // const recomputeViewport = useCallback(() => {
  //   requestAnimationFrame(() => {
  //     if (mapRef) {
  //       // request a frame to be rendered and then update our viewport bounds so that our viewport-filtered data renders correctly
  //       const bounds = mapRef.getBounds();
  //       if (bounds) {
  //         mapActions.setViewportBounds([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
  //       }
  //     }
  //   });
  // }, []);

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
