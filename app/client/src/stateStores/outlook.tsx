import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OutlookOffice } from "../lib/types";

// type definition for better DX
type OutlookState = {
  office: OutlookOffice;
  region: string | null;
  product: "swo" | "tso";
  valid: string | null;
  actions: {
    setOffice: (office: OutlookOffice) => void;
    setRegion: (region: string | null) => void;
    setProduct: (product: "swo" | "tso") => void;
    setValid: (valid: string | null) => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const useOutlookState = create<OutlookState>()(
  persist(
    (set) => ({
      office: "paspc",
      region: null,
      product: "swo",
      valid: null,
      actions: {
        setProduct: (newProduct: "swo" | "tso") => set({ product: newProduct, region: null, valid: null }),
        setOffice: (newOffice: OutlookOffice) => set({ office: newOffice, region: null, valid: null }),
        setRegion: (newRegion: string | null) => set({ region: newRegion, valid: null }),
        setValid: (newValid: string | null) => set({ valid: newValid }),
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
