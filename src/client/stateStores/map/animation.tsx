import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AnimationState } from "../../lib/types";
import { DEFAULT_MAX_FRAMES } from "../../config/animation";

interface AnimationStateStore {
  frame: number;
  frameCount: number;
  frameRate: number;
  state: AnimationState;
  startTime: number;
  endTime: number;
  deltaTime: number;
  loopId: NodeJS.Timeout | undefined;

  setFrame: (frame: number) => void;
  nextFrame: () => void;
  previousFrame: () => void;
  firstFrame: () => void;
  lastFrame: () => void;
  pause: () => void;
  stop: () => void;
  play: () => void;
  load: () => void;
  setFrameRate: (frameRate: number) => void;
  setStartTime: (time: number) => void;
  setEndTime: (time: number) => void;
  setDeltaTime: (deltaTime: number) => void;
  setLoopId: (id: NodeJS.Timeout) => void;
}

export const useAnimation = create<AnimationStateStore>()(
  persist(
    (set) => ({
      // initial values
      frame: DEFAULT_MAX_FRAMES - 1,
      frameCount: DEFAULT_MAX_FRAMES,
      frameRate: 10,
      state: "stopped",
      endTime: Date.now() - 10_800_000,
      startTime: Date.now(),
      deltaTime: 600_000,
      loopId: undefined,

      // declare methods to change animation state
      setFrame: (newFrame: number) => set(() => ({ frame: newFrame })),
      nextFrame: () => set((state) => ({ frame: state.frame + 1 <= state.frameCount - 1 ? state.frame + 1 : 0 })),
      previousFrame: () => set((state) => ({ frame: state.frame - 1 > 0 ? state.frame - 1 : state.frameCount - 1 })),
      firstFrame: () => set((state) => ({ frame: state.frameCount - 1 })),
      lastFrame: () => set(() => ({ frame: 0 })),
      pause: () => set(() => ({ state: "paused" })),
      stop: () => set(() => ({ state: "stopped" })),
      play: () => set(() => ({ state: "playing" })),
      load: () => set(() => ({ state: "loading" })),
      setFrameRate: (newFrameRate: number) => set(() => ({ frameRate: newFrameRate })),
      setEndTime: (newTime: number) => set(() => ({ endTime: newTime })),
      setStartTime: (newTime: number) => set(() => ({ startTime: newTime })),
      setDeltaTime: (newDeltaTime: number) => set(() => ({ deltaTime: newDeltaTime })),
      setLoopId: (newId: NodeJS.Timeout) => set(() => ({ loopId: newId })),
    }),
    {
      partialize: (state) => ({ frameRate: state.frameRate } as Partial<AnimationStateStore>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as AnimationStateStore) }),
      name: "animationOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
