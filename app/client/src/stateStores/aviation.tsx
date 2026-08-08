import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Products, ProductDomains } from "@/lib/types";

// type definition for better DX
type AviationState = {
  product: Products;
  subProduct: "cldwx" | "turbc";
  domain: ProductDomains;
  timeStep: number;

  actions: {
    setProduct: (product: Products) => void;
    setSubProduct: (product: "cldwx" | "turbc") => void;
    setDomain: (domain: ProductDomains) => void;
    setTimeStep: (timeStep: number) => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
const useAviation = create<AviationState>()(
  persist(
    (set) => ({
      product: "gfa",
      subProduct: "cldwx",
      domain: "gfacn31",
      timeStep: 0,

      actions: {
        setProduct: (newProduct: Products) => set({ product: newProduct }),
        setSubProduct: (newSubProduct: "cldwx" | "turbc") => set({ subProduct: newSubProduct }),
        setDomain: (newDomain: ProductDomains) => set({ domain: newDomain }),
        setTimeStep: (newTimeStep: number) => set({ timeStep: newTimeStep }),
      },
    }),
    {
      partialize: (state) =>
        ({
          product: state.product,
          subProduct: state.subProduct,
          domain: state.domain,
          timeStep: state.timeStep,
        }) as Partial<AviationState>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as AviationState) }),
      name: "aviationOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// export the stateStore data accessors
export const useAvProduct = () => useAviation((state) => state.product);
export const useAvSubProduct = () => useAviation((state) => state.subProduct);
export const useDomain = () => useAviation((state) => state.domain);
export const useTimeStep = () => useAviation((state) => state.timeStep);

export const useAviationActions = () => useAviation((state) => state.actions);
