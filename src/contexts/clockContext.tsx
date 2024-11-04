import { createContext, useMemo, useState } from "react";
import useContextWrapper from "@/hooks/useContextWrapper";

export interface IClockContext {
  time: number;
  setTime: React.Dispatch<React.SetStateAction<IClockContext["time"]>>;
}

export const ClockContext = createContext<IClockContext | null>(null);

export const ClockContextProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const [time, setTime] = useState<IClockContext["time"]>(0);

  const value = useMemo(
    () => ({
      time,
      setTime,
    }),
    [time],
  );

  return (
    <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
  );
};

export const useClockContext = () =>
  useContextWrapper(ClockContext, {
    contextName: useClockContext.name,
    providerName: ClockContextProvider.name,
  });
