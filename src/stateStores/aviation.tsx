import { ProductDomains, Products } from "@/config/aviationProducts";
import { create } from "zustand";

type AviationState = {
  product: Products;
  subProduct: "cldwx" | "turbc";
  domain: ProductDomains;
  timeStep: number;
  hub: string;
  setProduct: (product: Products) => void;
  setSubProduct: (product: "cldwx" | "turbc") => void;
  setDomain: (domain: ProductDomains) => void;
  setTimeStep: (timeStep: number) => void;
  setHub: (hub: string) => void;
};

export const useAviation = create<AviationState>((set) => ({
  product: "gfa",
  subProduct: "cldwx",
  domain: "gfacn31",
  timeStep: 0,
  hub: "cyyc",
  setProduct: (newProduct: Products) => set({ product: newProduct }),
  setSubProduct: (newSubProduct: "cldwx" | "turbc") => set({ subProduct: newSubProduct }),
  setDomain: (newDomain: ProductDomains) => set({ domain: newDomain }),
  setTimeStep: (newTimeStep: number) => set({ timeStep: newTimeStep }),
  setHub: (newHub: string) => set({ hub: newHub }),
}));
