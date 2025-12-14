import Map, { type ViewStateChangeEvent } from "react-map-gl/maplibre";
import { positronWxMap } from "@/assets/map-styles/positron-wxmap";

import useMapClock from "@/hooks/useClock";
import { SatelliteLayer } from "../map/layers/data/SatelliteLayer";
import { LightningDataLayer } from "../map/layers/data/LightningDataLayer";
import { PublicRegionsOverlay } from "../map/layers/overlays/PublicRegionsOverlay";
import type { MapLibreEvent } from "maplibre-gl";
import { useEffect, useState } from "react";
import { useLatitude, useLongitude, useMapStateActions, useZoom } from "@/stateStores/map/mapView";
import { useAnimationActions } from "@/stateStores/map/animation";
import { DEFAULT_MAX_FRAMES } from "@/config/animation";
import { Loader2, LocateFixed, Search } from "lucide-react";

import { useCoords, usePublicActions } from "@/stateStores/public";
import { GeoLocation } from "../map/controls/GeoLocation";
import type { Feature, Position } from "geojson";
import { RadarLayer } from "../map/layers/data/RadarLayer";
import Button from "../ui/Button";
import type { FetchStatus } from "@tanstack/react-query";
import * as turf from "@turf/turf";

import { HOUR } from "@shared/lib/constants";
import { SurfaceDataLayer } from "../map/layers/data/SurfaceDataLayer";
import { useUpdateMapViewstate } from "@/hooks/useUpdateMapViewstate";
import { AlertsLayer } from "../map/layers/data/AlertsLayer";
import { SelectedFxPoint } from "../map/layers/overlays/SelectedFxPoint";
import { useDisplayTime } from "@/hooks/useDisplayTime";

interface Props {
  searchCoords: Position | null;
  setSearchCoords: (coords: Position) => void;
  fetchStatus: FetchStatus;
}

export const PointForecastMap = ({ searchCoords, setSearchCoords, fetchStatus }: Props) => {
  const mapState = useMapStateActions();
  const displayTime = useDisplayTime();
  const coords = useCoords();
  const latitude = useLatitude();
  const longitude = useLongitude();
  const zoom = useZoom();

  const { updateFromMapEvent } = useUpdateMapViewstate();
  const { setFrameCount, setFrame, setStartTime } = useAnimationActions();
  const { setCoords } = usePublicActions();

  useMapClock();

  // keep track of the basemap layers so that we can filter them out when adding our own data layers
  const [baseMapLayers, setBaseMapLayers] = useState<string[]>();

  // keep track of the map initialization state
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // when we unmount the map, clear the map reference from global state
  useEffect(() => {
    setFrameCount(1);
    setFrame(0);
    setStartTime(Date.now());

    console.log("Mounting map, setting map reference in state");

    return () => {
      console.log("Unmounting map, clearing map reference from state");
      mapState.setMapRef(null);
      setFrameCount(DEFAULT_MAX_FRAMES + 1);
      setFrame(DEFAULT_MAX_FRAMES);
      setStartTime(Date.now() - 3 * HOUR);
    };
  }, []);

  const onMapLoad = (e: MapLibreEvent) => {
    // Store map reference in mapState
    mapState.setMapRef(e.target);

    // Set base layers
    setBaseMapLayers(e.target.getLayersOrder());
    setIsMapInitialized(true);
  };

  const onMapMove = (e: ViewStateChangeEvent) => {
    setCoords([e.viewState.longitude, e.viewState.latitude]);
    updateFromMapEvent(e.target, e.viewState);
  };

  const currentLocationGeoJSON = turf.featureCollection([
    { type: "Feature", geometry: { type: "Point", coordinates: searchCoords || [0, 0] }, properties: {} },
  ] as Feature[]);

  return (
    <div className="w-full rounded-md overflow-clip min-h-96 h-[calc(100dvh/3)]">
      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
        pitch={0}
        bearing={0}
        projection={"globe"}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        boxZoom={false}
        onLoad={onMapLoad}
        style={{ width: "100%", height: "100%" }}
        onMove={onMapMove}
        mapStyle={positronWxMap}
        attributionControl={false}
      >
        {isMapInitialized && baseMapLayers ? (
          <>
            <SatelliteLayer domain="west" />
            <SatelliteLayer domain="east" />
            <RadarLayer />
            <LightningDataLayer />
            <PublicRegionsOverlay override />
            <SurfaceDataLayer />
            <AlertsLayer />
            <SelectedFxPoint data={currentLocationGeoJSON} />

            <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 m-2 bg-primary text-primary-foreground border-neutral-400 border px-2 py-1 rounded-md text-xs">
              {new Date(displayTime).toISOString().replace("T", " ").slice(0, -8) + "Z"}
            </div>

            <div className="absolute  bottom-0 left-1/2 -translate-x-1/2 flex place-items-center gap-2 mb-2">
              <GeoLocation />
              <Button
                disabled={!coords || fetchStatus !== "idle"}
                variant="floating"
                onClick={() => {
                  if (coords) setSearchCoords(coords);
                }}
              >
                {fetchStatus !== "idle" ? <Loader2 className="animate-spin" /> : <Search />} Search
              </Button>
            </div>
            <LocateFixed className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </>
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
            <Loader2 className="inline animate-spin me-2" />
            Map Initializing...
          </div>
        )}
      </Map>
    </div>
  );
};
