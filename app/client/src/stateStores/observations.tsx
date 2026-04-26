import type { Units } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// type definition for better DX
type ObservationsState = {
  site: string;
  hours: number;
  units: Units;
  actions: {
    setSite: (site: string) => void;
    setHours: (hours: number) => void;
    toggleUnits: () => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const useObservations = create<ObservationsState>()(
  persist(
    (set) => ({
      site: "cyeg",
      hours: 12,
      units: "aviation",
      actions: {
        setSite: (newSite: string) => set({ site: newSite }),
        setHours: (newHours: number) => set({ hours: newHours }),
        toggleUnits: () =>
          set((state) => ({
            units: state.units === "aviation" ? "metric" : "aviation",
          })),
      },
    }),
    {
      partialize: (state) =>
        ({ site: state.site, hours: state.hours, units: state.units }) as Partial<ObservationsState>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as ObservationsState) }),
      name: "observationOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// export the stateStore data accessors
export const useSite = () => useObservations((state) => state.site);
export const useHours = () => useObservations((state) => state.hours);
export const useUnits = () => useObservations((state) => state.units);
export const useObsActions = () => useObservations((state) => state.actions);
