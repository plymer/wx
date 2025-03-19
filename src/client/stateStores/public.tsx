import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PublicForecastOffice } from "../lib/types";

// type definition for better DX
type PublicState = {
  office: PublicForecastOffice;
  bulletin: string;
  actions: {
    setOffice: (office: PublicForecastOffice) => void;
    setBulletin: (bulletin: string) => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const usePublicState = create<PublicState>()(
  persist(
    (set) => ({
      office: "paspcedm",
      bulletin: "focn45cwwg",
      actions: {
        setOffice: (newOffice: PublicForecastOffice) => set({ office: newOffice }),
        setBulletin: (newBulletin: string) => set({ bulletin: newBulletin }),
      },
    }),
    {
      partialize: (state) => ({ office: state.office, bulletin: state.bulletin } as Partial<PublicState>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as PublicState) }),
      name: "observationOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// export the stateStore data accessors
export const useOffice = () => usePublicState((state) => state.office);
export const useBulletin = () => usePublicState((state) => state.bulletin);
export const usePublicActions = () => usePublicState((state) => state.actions);
