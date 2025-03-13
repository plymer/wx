import { LayerTabs, MapOptionsTabs } from "../../config/map";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UIStateStore {
  panelSizes: number[];
  mapOptionsTab: MapOptionsTabs;
  layersTab: LayerTabs;
  actions: {
    setPanelSizes: (sizes: number[]) => void;
    setMapOptionsTab: (tab: MapOptionsTabs) => void;
    setLayersTab: (tab: LayerTabs) => void;
  };
}

const useUI = create<UIStateStore>()(
  persist(
    (set) => ({
      // initial values
      panelSizes: [(3 / 5) * 100, (2 / 5) * 100],
      mapOptionsTab: "overlays",
      layersTab: "satellite",
      actions: {
        // declare methods to change the default tabs that are open when the drawers are opened
        setPanelSizes: (sizes: number[]) => set(() => ({ panelSizes: sizes })),
        setMapOptionsTab: (tab: MapOptionsTabs) => set(() => ({ mapOptionsTab: tab })),
        setLayersTab: (tab: LayerTabs) => set(() => ({ layersTab: tab })),
      },
    }),
    {
      partialize: (state) =>
        ({
          panelSizes: state.panelSizes,
          mapOptionsTab: state.mapOptionsTab,
          layersTab: state.layersTab,
        } as Partial<UIStateStore>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as UIStateStore) }),
      name: "uiOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const usePanelSizes = () => useUI((state) => state.panelSizes);
export const useMapOptionsTab = () => useUI((state) => state.mapOptionsTab);
export const useLayersTab = () => useUI((state) => state.layersTab);
export const useUIActions = () => useUI((state) => state.actions);
