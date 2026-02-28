import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LayerTabs, MapPopupData } from "../../lib/types";

interface UIStateStore {
  layersTab: LayerTabs;
  popupData?: MapPopupData | undefined;
  actions: {
    setLayersTab: (tab: LayerTabs) => void;
    setPopupData: (data: MapPopupData | undefined) => void;
  };
}

const useUI = create<UIStateStore>()(
  persist(
    (set) => ({
      mapOptionsTab: "overlays",
      layersTab: "satellite",
      popupData: undefined,
      actions: {
        setLayersTab: (tab: LayerTabs) => set(() => ({ layersTab: tab })),
        setPopupData: (data: MapPopupData | undefined) => set(() => ({ popupData: data })),
      },
    }),
    {
      partialize: (state) =>
        ({
          layersTab: state.layersTab,
        }) as Partial<UIStateStore>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as UIStateStore) }),
      name: "uiOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useLayersTab = () => useUI((state) => state.layersTab);
export const usePopupData = () => useUI((state) => state.popupData);
export const useUIActions = () => useUI((state) => state.actions);
