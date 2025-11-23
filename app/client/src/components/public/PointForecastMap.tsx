import Map, { type ViewStateChangeEvent } from "react-map-gl/maplibre";
import { positronWxMap } from "@/assets/map-styles/positron-wxmap";

import useMapClock from "@/hooks/useClock";
import { SatelliteLayer } from "../map/layers/data/SatelliteLayer";
import { LightningDataLayer } from "../map/layers/data/LightningDataLayer";
import { PublicRegionsOverlay } from "../map/layers/overlays/PublicRegionsOverlay";
import type { MapLibreEvent } from "maplibre-gl";
import { useEffect, useState } from "react";
import { useLatitude, useLongitude, useMapRef, useMapStateActions, useZoom } from "@/stateStores/map/mapView";
import { useAnimationActions } from "@/stateStores/map/animation";
import { DEFAULT_MAX_FRAMES } from "@/config/animation";
import { Loader2, LocateFixed, Search } from "lucide-react";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useCoords, usePublicActions } from "@/stateStores/public";
import { GeoLocation } from "../map/controls/GeoLocation";
import type { Position } from "geojson";
import { RadarLayer } from "../map/layers/data/RadarLayer";
import Button from "../ui/Button";
import type { FetchStatus } from "@tanstack/react-query";

interface Props {
  setSearchCoords: (coords: Position) => void;
  fetchStatus: FetchStatus;
}

export const PointForecastMap = ({ setSearchCoords, fetchStatus }: Props) => {
  const mapState = useMapStateActions();
  const currentTime = useCurrentTime();
  const coords = useCoords();
  const latitude = useLatitude();
  const longitude = useLongitude();
  const zoom = useZoom();
  const { setFrameCount, setFrame } = useAnimationActions();
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

    return () => {
      mapState.setMapRef(null);
      setFrameCount(DEFAULT_MAX_FRAMES + 1);
      setFrame(DEFAULT_MAX_FRAMES);
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
    mapState.setLongitude(e.viewState.longitude);
    mapState.setLatitude(e.viewState.latitude);
    mapState.setZoom(e.viewState.zoom);
  };

  return (
    <div className="w-full rounded-md overflow-clip h-[calc(100dvh/3)]">
      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
        projection={"globe"}
        onLoad={onMapLoad}
        style={{ width: "100%", height: "inherit" }}
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

            <div className="absolute font-mono top-0 left-1/2 -translate-x-1/2 m-2 bg-primary text-primary-foreground border-neutral-400 border px-2 py-1 rounded-md text-xs">
              {new Date(currentTime).toISOString().replace("T", " ").slice(0, -8) + "Z"}
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
