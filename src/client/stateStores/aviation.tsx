import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ProductDomains, Products } from "../config/aviationProducts";

// type definition for better DX
type AviationState = {
  product: Products;
  subProduct: "cldwx" | "turbc";
  domain: ProductDomains;
  timeStep: number;
  hub: string;
  actions: {
    setProduct: (product: Products) => void;
    setSubProduct: (product: "cldwx" | "turbc") => void;
    setDomain: (domain: ProductDomains) => void;
    setTimeStep: (timeStep: number) => void;
    setHub: (hub: string) => void;
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
      hub: "cyyc",
      actions: {
        setProduct: (newProduct: Products) => set({ product: newProduct }),
        setSubProduct: (newSubProduct: "cldwx" | "turbc") => set({ subProduct: newSubProduct }),
        setDomain: (newDomain: ProductDomains) => set({ domain: newDomain }),
        setTimeStep: (newTimeStep: number) => set({ timeStep: newTimeStep }),
        setHub: (newHub: string) => set({ hub: newHub }),
      },
    }),
    {
      partialize: (state) =>
        ({
          product: state.product,
          subProduct: state.subProduct,
          domain: state.domain,
          timeStep: state.timeStep,
          hub: state.hub,
        } as Partial<AviationState>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as AviationState) }),
      name: "aviationOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// export the stateStore data accessors
export const useProduct = () => useAviation((state) => state.product);
export const useSubProduct = () => useAviation((state) => state.subProduct);
export const useDomain = () => useAviation((state) => state.domain);
export const useTimeStep = () => useAviation((state) => state.timeStep);
export const useHub = () => useAviation((state) => state.hub);
export const useAviationActions = () => useAviation((state) => state.actions);
