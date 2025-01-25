import { RadarProductsWMSName, SatelliteChannelsWMSName } from "@/config/map";
import { NUM_HRS_DATA } from "@/lib/constants";
import { AnimationState } from "@/lib/types";
import { create } from "zustand";

// type definition for better DX
type MapState = {
  rasterData: {
    satelliteProduct: SatelliteChannelsWMSName;
    showSatellite: boolean;
    radarProduct: RadarProductsWMSName;
    showRadar: boolean;
    manifest?: string[];
    setSatelliteProduct: (product: SatelliteChannelsWMSName) => void;
    toggleSatellite: () => void;
    setRadarProduct: (product: RadarProductsWMSName) => void;
    toggleRadar: () => void;
    setManifest: (newManifest: string[]) => void;
  };
  vectorData?: {};
  animation: {
    state: AnimationState;
    frame: number;
    frameCount: number;
    frameRate: number;
    startTime: number;
    endTime: number;
    deltaTime: number;
    setState: (state: AnimationState) => void;
    setFrame: (frame: number) => void;
    setFrameCount: (frameCount: number) => void;
    setFrameRate: (frameRate: number) => void;
    setStartTime: (startTime: number) => void;
    setEndTime: (endTime: number) => void;
    setDeltaTime: (deltaTime: number) => void;
    nextFrame: () => void;
    prevFrame: () => void;
    firstFrame: () => void;
    lastFrame: () => void;
  };
};

// create and export the stateStore, including default values and data mutation methods
export const useMap = create<MapState>((set) => ({
  rasterData: {
    satelliteProduct: "1km_DayCloudType-NightMicrophysics",
    showSatellite: true,
    radarProduct: "RADAR_1KM_RRAI",
    showRadar: true,
    manifest: [],
    setSatelliteProduct: (newProduct: SatelliteChannelsWMSName) =>
      set((state) => ({ rasterData: { ...state.rasterData, satelliteProduct: newProduct } })),
    toggleSatellite: () =>
      set((state) => ({ rasterData: { ...state.rasterData, showSatellite: !state.rasterData.showSatellite } })),
    setRadarProduct: (newProduct: RadarProductsWMSName) =>
      set((state) => ({ rasterData: { ...state.rasterData, radarProduct: newProduct } })),
    toggleRadar: () =>
      set((state) => ({ rasterData: { ...state.rasterData, showRadar: !state.rasterData.showRadar } })),
    setManifest: (newManifest: string[]) =>
      set((state) => ({ rasterData: { ...state.rasterData, manifest: newManifest } })),
  },
  vectorData: {},
  animation: {
    state: "stopped",
    frame: 17,
    frameCount: 18,
    frameRate: 10,
    startTime: Date.now(),
    endTime: Date.now() - NUM_HRS_DATA * 60 * 60 * 1000,
    deltaTime: 60_0000,
    setState: (newState: AnimationState) => set((state) => ({ animation: { ...state.animation, state: newState } })),
    setFrame: (newFrame: number) => set((state) => ({ animation: { ...state.animation, frame: newFrame } })),
    setFrameCount: (newFrameCount: number) =>
      set((state) => ({ animation: { ...state.animation, frameCount: newFrameCount } })),
    setFrameRate: (newFrameRate: number) =>
      set((state) => ({ animation: { ...state.animation, frameRate: newFrameRate } })),
    setStartTime: (newStartTime: number) =>
      set((state) => ({ animation: { ...state.animation, startTime: newStartTime } })),
    setEndTime: (newEndTime: number) => set((state) => ({ animation: { ...state.animation, endTime: newEndTime } })),
    setDeltaTime: (newDeltaTime: number) =>
      set((state) => ({ animation: { ...state.animation, deltaTime: newDeltaTime } })),
    nextFrame: () =>
      set((state) => ({
        animation: {
          ...state.animation,
          frame: state.animation.frame + 1 >= state.animation.frameCount ? 0 : state.animation.frame + 1,
        },
      })),
    prevFrame: () =>
      set((state) => ({
        animation: {
          ...state.animation,
          frame: state.animation.frame - 1 < 0 ? state.animation.frameCount - 1 : state.animation.frame - 1,
        },
      })),
    firstFrame: () => set((state) => ({ animation: { ...state.animation, frame: state.animation.frameCount - 1 } })),
    lastFrame: () => set((state) => ({ animation: { ...state.animation, frame: 0 } })),
  },
}));
