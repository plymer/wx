import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AppMode } from "../config/modes";

// type definition for better DX
type AppState = {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
};

// create and export the stateStore, including default values and data mutation methods
const useAppState = create<AppState>()(
  persist(
    (set) => ({
      appMode: "obs",
      setAppMode: (newProduct: AppMode) => set({ appMode: newProduct }),
    }),
    {
      partialize: (state) =>
        ({
          appMode: state.appMode,
        } as Partial<AppState>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as AppState) }),
      name: "aviationOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// export the stateStore data accessors
export const useAppMode = () => useAppState((state) => state.appMode);
export const useSetAppMode = () => useAppState((state) => state.setAppMode);
