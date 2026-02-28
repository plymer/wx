import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OutlookOffice } from "../lib/types";

// type definition for better DX
type OutlookState = {
  office: OutlookOffice | null;
  region: string | null;
  product: "swo" | "tso";
  validPeriod: string | null;
  actions: {
    setOffice: (office: OutlookOffice) => void;
    setRegion: (region: string | null) => void;
    setProduct: (product: "swo" | "tso") => void;
    setValidPeriod: (period: string | null) => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const useOutlookState = create<OutlookState>()(
  persist(
    (set) => ({
      office: null,
      region: null,
      product: "swo",
      validPeriod: null,
      actions: {
        setProduct: (newProduct: "swo" | "tso") => set({ product: newProduct, region: null, validPeriod: null }),
        setOffice: (newOffice: OutlookOffice) => set({ office: newOffice, region: null, validPeriod: null }),
        setRegion: (newRegion: string | null) => set({ region: newRegion, validPeriod: null }),
        setValidPeriod: (newPeriod: string | null) => set({ validPeriod: newPeriod }),
      },
    }),
    {
      partialize: (state) =>
        ({
          office: state.office,
          region: state.region,
          product: state.product,
          valid: state.validPeriod,
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
export const useOutlookValidPeriod = () => useOutlookState((state) => state.validPeriod);
export const useOutlookActions = () => useOutlookState((state) => state.actions);
