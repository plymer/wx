import { createContext, useMemo, useState } from "react";
import useContextWrapper from "@/hooks/useContextWrapper";

export interface IObservationsContext {
  site: string;
  setSite: React.Dispatch<React.SetStateAction<IObservationsContext["site"]>>;
  hours: number;
  setHours: React.Dispatch<React.SetStateAction<IObservationsContext["hours"]>>;
}

export const ObservationsContext = createContext<IObservationsContext | null>(null);

export const ObservationsContextProvider = ({ children }: React.PropsWithChildren<{}>) => {
  // we will want to store/retrieve this from localStorage or sessionStorage at some point in the future
  const [site, setSite] = useState<IObservationsContext["site"]>("");
  const [hours, setHours] = useState<IObservationsContext["hours"]>(12);

  const value = useMemo(
    () => ({
      site,
      setSite,
      hours,
      setHours,
    }),
    [site, hours],
  );

  return <ObservationsContext.Provider value={value}>{children}</ObservationsContext.Provider>;
};

export const useObservationsContext = () =>
  useContextWrapper(ObservationsContext, {
    contextName: useObservationsContext.name,
    providerName: ObservationsContextProvider.name,
  });
