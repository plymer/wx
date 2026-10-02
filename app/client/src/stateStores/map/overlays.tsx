import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface OverlaysStore {
  gfa: boolean;
  lgf: boolean;
  fir: boolean;
  vaac: boolean;
  tafs: boolean;
  bedposts: boolean;
  publicRegions: boolean;
  marineRegions: boolean;
  actions: {
    toggleGfa: () => void;
    toggleLgf: () => void;
    toggleFir: () => void;
    toggleVaac: () => void;
    toggleTafs: () => void;
    toggleBedposts: () => void;
    togglePublicRegions: () => void;
    toggleMarineRegions: () => void;
  };
}

const useMapOverlays = create<OverlaysStore>()(
  persist(
    (set) => ({
      gfa: true,
      lgf: true,
      fir: true,
      vaac: false,
      tafs: true,
      bedposts: true,
      publicRegions: false,
      marineRegions: false,
      actions: {
        toggleGfa: () => set((state) => ({ gfa: !state.gfa })),
        toggleLgf: () => set((state) => ({ lgf: !state.lgf })),
        toggleFir: () => set((state) => ({ fir: !state.fir })),
        toggleVaac: () => set((state) => ({ vaac: !state.vaac })),
        toggleTafs: () => set((state) => ({ tafs: !state.tafs })),
        toggleBedposts: () => set((state) => ({ bedposts: !state.bedposts })),
        togglePublicRegions: () => set((state) => ({ publicRegions: !state.publicRegions })),
        toggleMarineRegions: () => set((state) => ({ marineRegions: !state.marineRegions })),
      },
    }),
    {
      partialize: (state) => ({
        gfa: state.gfa,
        lgf: state.lgf,
        fir: state.fir,
        vaac: state.vaac,
        tafs: state.tafs,
        bedposts: state.bedposts,
        publicRegions: state.publicRegions,
        marineRegions: state.marineRegions,
      }),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as OverlaysStore) }),
      name: "vectorOverlays",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useGFAOverlay = () => useMapOverlays((state) => state.gfa);
export const useLGFOverlay = () => useMapOverlays((state) => state.lgf);
export const useFIROverlay = () => useMapOverlays((state) => state.fir);
export const useVAACOverlay = () => useMapOverlays((state) => state.vaac);
export const useTAFsOverlay = () => useMapOverlays((state) => state.tafs);
export const useBedpostsOverlay = () => useMapOverlays((state) => state.bedposts);
export const usePublicRegionsOverlay = () => useMapOverlays((state) => state.publicRegions);
export const useMarineRegionsOverlay = () => useMapOverlays((state) => state.marineRegions);
export const useVectorOverlayActions = () => useMapOverlays((state) => state.actions);
