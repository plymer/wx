import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { RadarProductsWMSName, SATELLITE_CHANNELS, SatelliteChannelsWMSName } from "../../config/map";

interface RasterStateStore {
  satelliteProduct: SatelliteChannelsWMSName;
  radarProduct: RadarProductsWMSName;
  showSatellite: boolean;
  showRadar: boolean;
  manifest: string[];

  setSatelliteProduct: (product: SatelliteChannelsWMSName) => void;
  setRadarProduct: (product: RadarProductsWMSName) => void;
  toggleSatellite: () => void;
  toggleRadar: () => void;
  clearManifest: () => void;
  setManifest: (layerList: string[]) => void;
}

export const useRasterData = create<RasterStateStore>()(
  persist(
    (set) => ({
      // initial values
      satelliteProduct: SATELLITE_CHANNELS.dayNightMicro.wms,
      radarProduct: "RADAR_1KM_RRAI",
      showSatellite: true,
      showRadar: true,
      manifest: [],

      // declare methods to change animation state
      setSatelliteProduct: (newProduct: SatelliteChannelsWMSName) => set(() => ({ satelliteProduct: newProduct })),
      setRadarProduct: (newProduct: RadarProductsWMSName) => set(() => ({ radarProduct: newProduct })),
      toggleSatellite: () => set((state) => ({ showSatellite: !state.showSatellite })),
      toggleRadar: () => set((state) => ({ showRadar: !state.showRadar })),
      clearManifest: () => set(() => ({ manifest: [] })),
      setManifest: (newLayerList: string[]) => set(() => ({ manifest: newLayerList })),
    }),
    {
      partialize: (state) =>
        ({
          satelliteProduct: state.satelliteProduct,
          radarProduct: state.radarProduct,
          showSatellite: state.showSatellite,
          showRadar: state.showRadar,
        } as Partial<RasterStateStore>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as RasterStateStore) }),
      name: "rasterDataOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
