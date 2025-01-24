import { ProductDomains, Products } from "@/config/aviationProducts";
import { create } from "zustand";

type AviationState = {
  product: Products;
  domain: ProductDomains;
  timeStep: number;
  setProduct: (product: Products) => void;
  setDomain: (domain: ProductDomains) => void;
  setTimeStep: (timeStep: number) => void;
};

/*
product: string;
setProduct: React.Dispatch<React.SetStateAction<IAviationContext["product"]>>;
domain: string;
setDomain: React.Dispatch<React.SetStateAction<IAviationContext["domain"]>>;
gfaDomain: string;
setGfaDomain: React.Dispatch<React.SetStateAction<IAviationContext["gfaDomain"]>>;
subProduct?: string;
setSubProduct?: React.Dispatch<React.SetStateAction<IAviationContext["subProduct"]>>;
timeStep: number;
setTimeStep: React.Dispatch<React.SetStateAction<IAviationContext["timeStep"]>>;
gfaTimeStep: number;
setGfaTimeStep: React.Dispatch<React.SetStateAction<IAviationContext["gfaTimeStep"]>>;
timeDelta: number;
setTimeDelta: React.Dispatch<React.SetStateAction<IAviationContext["timeDelta"]>>;
url: string;
setUrl: React.Dispatch<React.SetStateAction<IAviationContext["url"]>>;
hub: string;
setHub: React.Dispatch<React.SetStateAction<IAviationContext["hub"]>>;
hubName: string;
setHubName: React.Dispatch<React.SetStateAction<IAviationContext["hubName"]>>;
 */

export const useAviation = create<AviationState>((set) => ({
  product: "gfa",
  domain: "gfacn31",
  timeStep: 0,

  setProduct: (newProduct: Products) => set({ product: newProduct }),
  setDomain: (newDomain: ProductDomains) => set({ domain: newDomain }),
  setTimeStep: (newTimeStep: number) => set({ timeStep: newTimeStep }),
}));
