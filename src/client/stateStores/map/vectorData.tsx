import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface VectorStateStore {
  showLightning: boolean;
  showObs: boolean;
  showPIREPs: boolean;
  showSIGMETs: boolean;
  showAIRMETs: boolean;
  actions: {
    toggleLightning: () => void;
    toggleObs: () => void;
    togglePIREPs: () => void;
    toggleSIGMETs: () => void;
    toggleAIRMETs: () => void;
  };
}

const useVectorData = create<VectorStateStore>()(
  persist(
    (set) => ({
      // initial values
      showLightning: true,
      showObs: true,
      showPIREPs: true,
      showSIGMETs: true,
      showAIRMETs: true,
      actions: {
        toggleLightning: () => set((state) => ({ showLightning: !state.showLightning })),
        toggleObs: () => set((state) => ({ showObs: !state.showObs })),
        togglePIREPs: () => set((state) => ({ showPIREPs: !state.showPIREPs })),
        toggleSIGMETs: () => set((state) => ({ showSIGMETs: !state.showSIGMETs })),
        toggleAIRMETs: () => set((state) => ({ showAIRMETs: !state.showAIRMETs })),
      },
    }),
    {
      partialize: (state) =>
        ({
          showLightning: state.showLightning,
          showObs: state.showObs,
          showPIREPs: state.showPIREPs,
          showAIRMETs: state.showAIRMETs,
          showSIGMETs: state.showSIGMETs,
        } as Partial<VectorStateStore>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as VectorStateStore) }),
      name: "vectorDataOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useShowLightning = () => useVectorData((state) => state.showLightning);
export const useShowObs = () => useVectorData((state) => state.showObs);
export const useShowPIREPs = () => useVectorData((state) => state.showPIREPs);
export const useShowSIGMETs = () => useVectorData((state) => state.showSIGMETs);
export const useShowAIRMETs = () => useVectorData((state) => state.showAIRMETs);
export const useVectorActions = () => useVectorData((state) => state.actions);
