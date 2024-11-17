import { createContext, useMemo, useState } from "react";
import useContextWrapper from "@/hooks/useContextWrapper";

export interface IAviationContext {
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
}

export const AviationContext = createContext<IAviationContext | null>(null);

export const AviationContextProvider = ({ children }: React.PropsWithChildren<{}>) => {
  // we will want to store/retrieve this from localStorage or sessionStorage at some point in the future
  const [product, setProduct] = useState<IAviationContext["product"]>("gfa");
  const [domain, setDomain] = useState<IAviationContext["domain"]>("lgf");
  const [gfaDomain, setGfaDomain] = useState<IAviationContext["gfaDomain"]>("gfacn32");
  const [subProduct, setSubProduct] = useState<IAviationContext["subProduct"]>("cldwx");
  const [timeStep, setTimeStep] = useState<IAviationContext["timeStep"]>(0);
  const [gfaTimeStep, setGfaTimeStep] = useState<IAviationContext["gfaTimeStep"]>(0);
  const [timeDelta, setTimeDelta] = useState<IAviationContext["timeDelta"]>(0);
  const [url, setUrl] = useState<IAviationContext["url"]>("");
  const [hub, setHub] = useState<IAviationContext["hub"]>("cyyc");
  const [hubName, setHubName] = useState<IAviationContext["hubName"]>("Calgary Intl Airport");

  const value = useMemo(
    () => ({
      product,
      setProduct,
      domain,
      setDomain,
      gfaDomain,
      setGfaDomain,
      subProduct,
      setSubProduct,
      timeStep,
      setTimeStep,
      gfaTimeStep,
      setGfaTimeStep,
      timeDelta,
      setTimeDelta,
      url,
      setUrl,
      hub,
      setHub,
      hubName,
      setHubName,
    }),
    [product, domain, gfaDomain, subProduct, timeStep, gfaTimeStep, timeDelta, url, hub, hubName],
  );

  return <AviationContext.Provider value={value}>{children}</AviationContext.Provider>;
};

export const useAviationContext = () =>
  useContextWrapper(AviationContext, {
    contextName: useAviationContext.name,
    providerName: AviationContextProvider.name,
  });
