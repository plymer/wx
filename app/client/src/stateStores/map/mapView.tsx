import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ViewState } from "react-map-gl/maplibre";
import type { BaseMapType, MapProjections } from "../../lib/types";
import { useMap } from "react-map-gl/maplibre";

interface MapStateStore {
  viewState: ViewState;
  projection: MapProjections;
  baseMap: BaseMapType;
  layersLoading: string[];
  actions: {
    addLayerLoading: (layerName: string) => void;
    removeLayerLoading: (layerName: string) => void;
    setViewState: (viewState: ViewState) => void;
    setProjection: (proj: MapProjections) => void;
    setBaseMap: (basemap: BaseMapType) => void;
  };
}

const useMapViewState = create<MapStateStore>()(
  persist(
    (set) => ({
      // initial values
      viewState: {
        latitude: 53,
        longitude: -95,
        zoom: 3.25,
        bearing: 0,
        pitch: 0,
        padding: { top: 0, left: 0, right: 0, bottom: 0 },
      },
      projection: "mercator",
      baseMap: "hillshade",
      layersLoading: [],
      actions: {
        addLayerLoading: (layerName: string) =>
          set(({ layersLoading }) => ({
            layersLoading: layersLoading.includes(layerName) ? layersLoading : [...layersLoading, layerName],
          })),
        removeLayerLoading: (layerName: string) =>
          set(({ layersLoading }) => ({
            layersLoading: layersLoading.filter((name) => name !== layerName),
          })),
        setViewState: (newViewState) => set(({ viewState }) => ({ viewState: { ...viewState, ...newViewState } })),
        setProjection: (newProjection) => set(() => ({ projection: newProjection })),
        setBaseMap: (newBaseMap) => set(() => ({ baseMap: newBaseMap })),
      },
    }),
    {
      partialize: (state) =>
        ({
          viewState: state.viewState,
          projection: state.projection,
          baseMap: state.baseMap,
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

export const useMapRef = () => {
  const mapRef = useMap();
  return mapRef.current?.getMap();
};
export const useViewState = () => useMapViewState((state) => state.viewState);
export const useProjection = () => useMapViewState((state) => state.projection);
export const useBaseMap = () => useMapViewState((state) => state.baseMap);
export const useLayersLoading = () => useMapViewState((state) => state.layersLoading);
export const useMapStateActions = () => useMapViewState((state) => state.actions);
