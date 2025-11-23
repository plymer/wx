import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PublicForecastOffice } from "../lib/types";
import type { Position } from "geojson";

// type definition for better DX
type PublicState = {
  office: PublicForecastOffice;
  bulletin: string;
  mode: "text" | "point";
  coords: Position | null;
  actions: {
    setOffice: (office: PublicForecastOffice) => void;
    setBulletin: (bulletin: string) => void;
    setMode: (mode: "text" | "point") => void;
    setCoords: (coords: Position | null) => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const usePublicState = create<PublicState>()(
  persist(
    (set) => ({
      office: "paspcedm",
      bulletin: "focn45cwwg",
      mode: "text",
      coords: null,
      actions: {
        setOffice: (newOffice: PublicForecastOffice) => set({ office: newOffice }),
        setBulletin: (newBulletin: string) => set({ bulletin: newBulletin }),
        setMode: (newMode: "text" | "point") => set({ mode: newMode }),
        setCoords: (newCoords: Position | null) => set({ coords: newCoords }),
      },
    }),
    {
      partialize: (state) =>
        ({
          office: state.office,
          bulletin: state.bulletin,
          mode: state.mode,
          coords: state.coords,
        }) as Partial<PublicState>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as PublicState) }),
      name: "publicOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// export the stateStore data accessors
export const useOffice = () => usePublicState((state) => state.office);
export const useBulletin = () => usePublicState((state) => state.bulletin);
export const useMode = () => usePublicState((state) => state.mode);
export const useCoords = () => usePublicState((state) => state.coords);
export const usePublicActions = () => usePublicState((state) => state.actions);
