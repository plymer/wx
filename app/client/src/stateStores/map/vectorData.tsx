import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface VectorStateStore {
  showAQ: boolean;
  showLightning: boolean;
  showObs: boolean;
  showIsobars: boolean;
  showIsotherms: boolean;
  showIsodrosotherms: boolean;
  showPIREPs: boolean;
  showSIGMETs: boolean;
  showAIRMETs: boolean;
  showPublicAlerts: boolean;
  showHurricanes: boolean;
  publicAlertsFilterLevel: "all" | "convective";
  actions: {
    toggleAQ: () => void;
    toggleLightning: () => void;
    toggleObs: () => void;
    toggleIsobars: () => void;
    toggleIsotherms: () => void;
    toggleIsodrosotherms: () => void;
    togglePIREPs: () => void;
    toggleSIGMETs: () => void;
    toggleAIRMETs: () => void;
    toggleHurricanes: () => void;
    togglePublicAlerts: () => void;
    togglePublicAlertsFilterLevel: () => void;
  };
}

const useVectorData = create<VectorStateStore>()(
  persist(
    (set) => ({
      // initial values
      showAQ: true,
      showLightning: true,
      showObs: true,
      showIsobars: true,
      showIsotherms: false,
      showIsodrosotherms: false,
      showPIREPs: true,
      showSIGMETs: true,
      showAIRMETs: true,
      showPublicAlerts: true,
      showHurricanes: true,
      publicAlertsFilterLevel: "all",
      actions: {
        toggleAQ: () => set((state) => ({ showAQ: !state.showAQ })),
        toggleLightning: () => set((state) => ({ showLightning: !state.showLightning })),
        toggleObs: () => set((state) => ({ showObs: !state.showObs })),
        toggleIsobars: () => set((state) => ({ showIsobars: !state.showIsobars })),
        toggleIsotherms: () => set((state) => ({ showIsotherms: !state.showIsotherms })),
        toggleIsodrosotherms: () => set((state) => ({ showIsodrosotherms: !state.showIsodrosotherms })),
        togglePIREPs: () => set((state) => ({ showPIREPs: !state.showPIREPs })),
        toggleSIGMETs: () => set((state) => ({ showSIGMETs: !state.showSIGMETs })),
        toggleAIRMETs: () => set((state) => ({ showAIRMETs: !state.showAIRMETs })),
        togglePublicAlerts: () => set((state) => ({ showPublicAlerts: !state.showPublicAlerts })),
        toggleHurricanes: () => set((state) => ({ showHurricanes: !state.showHurricanes })),
        togglePublicAlertsFilterLevel: () =>
          set((state) => ({
            publicAlertsFilterLevel: state.publicAlertsFilterLevel === "all" ? "convective" : "all",
          })),
      },
    }),
    {
      partialize: (state) =>
        ({
          showAQ: state.showAQ,
          showLightning: state.showLightning,
          showObs: state.showObs,
          showIsobars: state.showIsobars,
          showIsotherms: state.showIsotherms,
          showIsodrosotherms: state.showIsodrosotherms,
          showPIREPs: state.showPIREPs,
          showAIRMETs: state.showAIRMETs,
          showSIGMETs: state.showSIGMETs,
          showPublicAlerts: state.showPublicAlerts,
          showHurricanes: state.showHurricanes,
          publicAlertsFilterLevel: state.publicAlertsFilterLevel,
        }) as Partial<VectorStateStore>,
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as VectorStateStore) }),
      name: "vectorDataOptions",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useShowAQ = () => useVectorData((state) => state.showAQ);
export const useShowLightning = () => useVectorData((state) => state.showLightning);
export const useShowObs = () => useVectorData((state) => state.showObs);
export const useShowIsobars = () => useVectorData((state) => state.showIsobars);
export const useShowIsotherms = () => useVectorData((state) => state.showIsotherms);
export const useShowIsodrosotherms = () => useVectorData((state) => state.showIsodrosotherms);
export const useShowPIREPs = () => useVectorData((state) => state.showPIREPs);
export const useShowSIGMETs = () => useVectorData((state) => state.showSIGMETs);
export const useShowAIRMETs = () => useVectorData((state) => state.showAIRMETs);
export const useShowPublicAlerts = () => useVectorData((state) => state.showPublicAlerts);
export const useShowHurricanes = () => useVectorData((state) => state.showHurricanes);
export const usePublicAlertsFilterLevel = () => useVectorData((state) => state.publicAlertsFilterLevel);
export const useVectorActions = () => useVectorData((state) => state.actions);
