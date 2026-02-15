import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OutlookOffice, PublicForecastOffice } from "../lib/types";
import type { Position } from "geojson";

// type definition for better DX
type OutlookState = {
  office: OutlookOffice;
  region: string;
  product: "swo" | "tso";
  valid: string;
  actions: {
    setOffice: (office: OutlookOffice) => void;
    setRegion: (region: string) => void;
    setProduct: (product: "swo" | "tso") => void;
    setValid: (valid: string) => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const useOutlookState = create<OutlookState>()(
  persist(
    (set) => ({
      product: "swo",
      office: "paspc",
      region: "",
      valid: "",

      coords: null,
      actions: {
        setProduct: (newProduct: "swo" | "tso") => set({ product: newProduct, region: "", valid: "" }),
        setOffice: (newOffice: OutlookOffice) => set({ office: newOffice, region: "", valid: "" }),
        setRegion: (newRegion: string) => set({ region: newRegion, valid: "" }),
        setValid: (newValid: string) => set({ valid: newValid }),
      },
    }),
    {
      partialize: (state) =>
        ({
          office: state.office,
          region: state.region,
          product: state.product,
          valid: state.valid,
        }) as Partial<OutlookState>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as OutlookState) }),
      name: "outlookOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// export the stateStore data accessors
export const useOutlookOffice = () => useOutlookState((state) => state.office);
export const useOutlookRegion = () => useOutlookState((state) => state.region);
export const useOutlookProduct = () => useOutlookState((state) => state.product);
export const useOutlookValid = () => useOutlookState((state) => state.valid);
export const useOutlookActions = () => useOutlookState((state) => state.actions);
