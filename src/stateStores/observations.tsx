import { create } from "zustand";

// type definition for better DX
type ObservationsState = {
  site: string;
  hours: number;
  setSite: (site: string) => void;
  setHours: (hours: number) => void;
};

// create and export the stateStore, including default values and data mutation methods
export const useObservations = create<ObservationsState>((set) => ({
  site: "cyeg",
  hours: 12,
  setSite: (newSite: string) => set({ site: newSite }),
  setHours: (newHours: number) => set({ hours: newHours }),
}));
