import { create } from "zustand";

type ObservationsState = {
  site: string;
  hours: number;

  setSite: (site: string) => void;
  setHours: (hours: number) => void;
};

export const useObservations = create<ObservationsState>((set) => ({
  site: "cyeg",
  hours: 12,
  setSite: (newSite: string) => set({ site: newSite }),
  setHours: (newHours: number) => set({ hours: newHours }),
}));
