import { createContext, useMemo, useState } from "react";
import useContextWrapper from "@/hooks/useContextWrapper";
import { SATELLITE_CHANNELS } from "@/config/satellite";

export interface IGeoMetContext {
  satelliteProduct?: string;
  setSatelliteProduct?: React.Dispatch<React.SetStateAction<IGeoMetContext["satelliteProduct"]>>;
  radarProduct?: string;
  setRadarProduct?: React.Dispatch<React.SetStateAction<IGeoMetContext["radarProduct"]>>;
  showRadar?: boolean;
  setShowRadar?: React.Dispatch<React.SetStateAction<IGeoMetContext["showRadar"]>>;
}

export const GeoMetContext = createContext<IGeoMetContext | null>(null);

export const GeoMetContextProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [satelliteProduct, setSatelliteProduct] = useState<IGeoMetContext["satelliteProduct"]>(
    SATELLITE_CHANNELS[0].wms,
  );

  const [radarProduct, setRadarProduct] = useState<IGeoMetContext["radarProduct"]>("RRAI");

  const [showRadar, setShowRadar] = useState<IGeoMetContext["showRadar"]>(false);

  const value = useMemo(
    () => ({
      satelliteProduct,
      setSatelliteProduct,
      radarProduct,
      setRadarProduct,
      showRadar,
      setShowRadar,
    }),
    [satelliteProduct, radarProduct, showRadar],
  );

  return <GeoMetContext.Provider value={value}>{children}</GeoMetContext.Provider>;
};

export const useGeoMetContext = () =>
  useContextWrapper(GeoMetContext, {
    contextName: useGeoMetContext.name,
    providerName: GeoMetContextProvider.name,
  });
