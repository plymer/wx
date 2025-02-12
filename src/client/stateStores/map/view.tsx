import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { PaddingOptions, ViewState } from "@vis.gl/react-maplibre";

interface MapStateStore extends ViewState {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: PaddingOptions;

  setLatitude: (lat: number) => void;
  setLongitude: (lon: number) => void;
  setZoom: (zoom: number) => void;
}

export const useMapViewState = create<MapStateStore>()(
  persist(
    (set) => ({
      // initial values
      latitude: 53,
      longitude: -95,
      zoom: 3.25,
      bearing: 0,
      pitch: 0,
      padding: { top: 0, left: 0, right: 0, bottom: 0 },

      setLatitude: (newLatitude) => set(() => ({ latitude: newLatitude })),
      setLongitude: (newLongitude) => set(() => ({ longitude: newLongitude })),
      setZoom: (newZoom) => set(() => ({ zoom: newZoom })),
    }),
    {
      partialize: (state) =>
        ({ latitude: state.latitude, longitude: state.longitude, zoom: state.zoom }) as Partial<MapStateStore>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as MapStateStore) }),
      name: "mapViewState",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
