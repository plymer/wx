import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MapOptionsTabs, LayerTabs } from "../../lib/types";

interface UIStateStore {
  mapOptionsTab: MapOptionsTabs;
  layersTab: LayerTabs;
  actions: {
    setMapOptionsTab: (tab: MapOptionsTabs) => void;
    setLayersTab: (tab: LayerTabs) => void;
  };
}

const useUI = create<UIStateStore>()(
  persist(
    (set) => ({
      // initial values
      mapOptionsTab: "overlays",
      layersTab: "satellite",
      actions: {
        // declare methods to change the default tabs that are open when the drawers are opened
        setMapOptionsTab: (tab: MapOptionsTabs) => set(() => ({ mapOptionsTab: tab })),
        setLayersTab: (tab: LayerTabs) => set(() => ({ layersTab: tab })),
      },
    }),
    {
      partialize: (state) =>
        ({
          mapOptionsTab: state.mapOptionsTab,
          layersTab: state.layersTab,
        }) as Partial<UIStateStore>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as UIStateStore) }),
      name: "uiOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useMapOptionsTab = () => useUI((state) => state.mapOptionsTab);
export const useLayersTab = () => useUI((state) => state.layersTab);
export const useUIActions = () => useUI((state) => state.actions);
