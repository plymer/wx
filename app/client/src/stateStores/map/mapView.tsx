import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Map } from "maplibre-gl";
import type { PaddingOptions, ViewState } from "react-map-gl/maplibre";
import type { MapProjections } from "../../lib/types";

interface MapStateStore extends ViewState {
  mapRef: Map | null;
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: PaddingOptions;
  projection: MapProjections;
  viewportBounds?: [number, number, number, number];
  layersLoading: string[];
  actions: {
    setMapRef: (ref: Map | null) => void;
    addLayerLoading: (layerName: string) => void;
    removeLayerLoading: (layerName: string) => void;
    setLatitude: (lat: number) => void;
    setLongitude: (lon: number) => void;
    setZoom: (zoom: number) => void;
    setProjection: (proj: MapProjections) => void;
    setViewportBounds: (bounds: [number, number, number, number]) => void;
  };
}

const useMapViewState = create<MapStateStore>()(
  persist(
    (set) => ({
      // initial values
      mapRef: null,
      latitude: 53,
      longitude: -95,
      zoom: 3.25,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, left: 0, right: 0, bottom: 0 },
      projection: "mercator",
      viewportBounds: undefined,
      layersLoading: [],
      actions: {
        setMapRef: (newRef) => set(() => ({ mapRef: newRef })),
        addLayerLoading: (layerName: string) =>
          set((state) => ({
            layersLoading: state.layersLoading.includes(layerName)
              ? state.layersLoading
              : [...state.layersLoading, layerName],
          })),
        removeLayerLoading: (layerName: string) =>
          set((state) => ({
            layersLoading: state.layersLoading.filter((name) => name !== layerName),
          })),
        setLatitude: (newLatitude) => set(() => ({ latitude: newLatitude })),
        setLongitude: (newLongitude) => set(() => ({ longitude: newLongitude })),
        setZoom: (newZoom) => set(() => ({ zoom: newZoom })),
        setProjection: (newProjection) => set(() => ({ projection: newProjection })),
        setViewportBounds: (newBounds) => set(() => ({ viewportBounds: newBounds })),
      },
    }),
    {
      partialize: (state) =>
        ({
          latitude: state.latitude,
          longitude: state.longitude,
          zoom: state.zoom,
          projection: state.projection,
          viewportBounds: state.viewportBounds,
        }) as Partial<MapStateStore>,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as MapStateStore),
      }),
      name: "mapViewState",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// export hooks for state and actions
export const useMapRef = () => useMapViewState((state) => state.mapRef);
export const useLatitude = () => useMapViewState((state) => state.latitude);
export const useLongitude = () => useMapViewState((state) => state.longitude);
export const useZoom = () => useMapViewState((state) => state.zoom);
export const useBearing = () => useMapViewState((state) => state.bearing);
export const usePitch = () => useMapViewState((state) => state.pitch);
export const usePadding = () => useMapViewState((state) => state.padding);
export const useProjection = () => useMapViewState((state) => state.projection);
export const useViewportBounds = () => useMapViewState((state) => state.viewportBounds);
export const useLayersLoading = () => useMapViewState((state) => state.layersLoading);
export const useMapStateActions = () => useMapViewState((state) => state.actions);
