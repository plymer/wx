import { createContext, useMemo, useState } from "react";
import useContextWrapper from "@/hooks/useContextWrapper";
import { SATELLITE_CHANNELS } from "@/config/satellite";

export interface IMapConfigContext {
  // raster data config
  satelliteProduct: string;
  setSatelliteProduct: React.Dispatch<React.SetStateAction<IMapConfigContext["satelliteProduct"]>>;
  showSatellite: boolean;
  setShowSatellite: React.Dispatch<React.SetStateAction<IMapConfigContext["showSatellite"]>>;
  radarProduct: string;
  setRadarProduct: React.Dispatch<React.SetStateAction<IMapConfigContext["radarProduct"]>>;
  showRadar: boolean;
  setShowRadar: React.Dispatch<React.SetStateAction<IMapConfigContext["showRadar"]>>;

  // map animation config
  animationState: "playing" | "loading" | "paused" | "stopped";
  setAnimationState: React.Dispatch<React.SetStateAction<IMapConfigContext["animationState"]>>;
  currentFrame: number; // which frame is being displayed
  setCurrentFrame: React.Dispatch<React.SetStateAction<IMapConfigContext["currentFrame"]>>;
  frameCount: number; // how many frames are in the animation
  setFrameCount: React.Dispatch<React.SetStateAction<IMapConfigContext["frameCount"]>>;
  frameRate: number;
  setFrameRate: React.Dispatch<React.SetStateAction<IMapConfigContext["frameRate"]>>;
  startTime: number;
  setStartTime: React.Dispatch<React.SetStateAction<IMapConfigContext["startTime"]>>;
  endTime: number;
  setEndTime: React.Dispatch<React.SetStateAction<IMapConfigContext["endTime"]>>;
  timeStep: number;
  setTimeStep: React.Dispatch<React.SetStateAction<IMapConfigContext["timeStep"]>>;
}

export const MapConfigContext = createContext<IMapConfigContext | null>(null);

export const MapConfigContextProvider = ({ children }: React.PropsWithChildren<{}>) => {
  // raster data states
  const [satelliteProduct, setSatelliteProduct] = useState<IMapConfigContext["satelliteProduct"]>(
    SATELLITE_CHANNELS[0].wms,
  );
  const [showSatellite, setShowSatellite] = useState<IMapConfigContext["showSatellite"]>(true);
  const [radarProduct, setRadarProduct] = useState<IMapConfigContext["radarProduct"]>("RRAI");
  const [showRadar, setShowRadar] = useState<IMapConfigContext["showRadar"]>(true);

  // map animation states
  const [animationState, setAnimationState] = useState<IMapConfigContext["animationState"]>("stopped");
  const [frameCount, setFrameCount] = useState<IMapConfigContext["frameCount"]>(24);
  const [currentFrame, setCurrentFrame] = useState<IMapConfigContext["currentFrame"]>(frameCount - 1);
  const [frameRate, setFrameRate] = useState<IMapConfigContext["frameRate"]>(10);
  const [startTime, setStartTime] = useState<IMapConfigContext["startTime"]>(0);
  const [endTime, setEndTime] = useState<IMapConfigContext["endTime"]>(Date.now());
  const [timeStep, setTimeStep] = useState<IMapConfigContext["timeStep"]>(60000);

  // memoize all parts of the state to limit re-render calls
  const value = useMemo(
    () => ({
      satelliteProduct,
      setSatelliteProduct,
      showSatellite,
      setShowSatellite,
      radarProduct,
      setRadarProduct,
      showRadar,
      setShowRadar,
      animationState,
      setAnimationState,
      currentFrame,
      setCurrentFrame,
      frameCount,
      setFrameCount,
      frameRate,
      setFrameRate,
      startTime,
      setStartTime,
      endTime,
      setEndTime,
      timeStep,
      setTimeStep,
    }),
    [
      satelliteProduct,
      showSatellite,
      radarProduct,
      showRadar,
      animationState,
      currentFrame,
      frameRate,
      startTime,
      endTime,
      timeStep,
    ],
  );

  return <MapConfigContext.Provider value={value}>{children}</MapConfigContext.Provider>;
};

export const useMapConfigContext = () =>
  useContextWrapper(MapConfigContext, {
    contextName: useMapConfigContext.name,
    providerName: MapConfigContextProvider.name,
  });
