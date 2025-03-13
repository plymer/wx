import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { AnimationState, DEFAULT_MAX_FRAMES } from "../../config/animation";
import { HOUR, MINUTE } from "../../lib/utils";

interface AnimationStateStore {
  frame: number;
  frameCount: number;
  frameRate: number;
  state: AnimationState;
  startTime: number;
  endTime: number;
  deltaTime: number;
  loopId: NodeJS.Timeout | undefined;
  actions: {
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
  };
}

const useAnimation = create<AnimationStateStore>()(
  persist(
    (set) => ({
      // initial values
      frame: DEFAULT_MAX_FRAMES,
      frameCount: DEFAULT_MAX_FRAMES + 1,
      frameRate: 10,
      state: "realtime",
      endTime: Date.now(),
      startTime: Date.now() - 3 * HOUR,
      deltaTime: 10 * MINUTE,
      loopId: undefined,
      actions: {
        // declare methods to change animation state
        setFrame: (newFrame: number) => set(() => ({ frame: newFrame })),
        nextFrame: () => set((state) => ({ frame: state.frame + 1 <= state.frameCount - 1 ? state.frame + 1 : 0 })),
        previousFrame: () => set((state) => ({ frame: state.frame - 1 >= 0 ? state.frame - 1 : state.frameCount - 1 })),
        firstFrame: () => set((state) => ({ frame: state.frameCount - 1 })),
        lastFrame: () => set(() => ({ frame: 0 })),
        pause: () => set(() => ({ state: "paused" })),
        stop: () => set(() => ({ state: "realtime" })),
        play: () => set(() => ({ state: "playing" })),
        load: () => set(() => ({ state: "loading" })),
        setFrameRate: (newFrameRate: number) => set(() => ({ frameRate: newFrameRate })),
        setEndTime: (newTime: number) => set(() => ({ endTime: newTime })),
        setStartTime: (newTime: number) => set(() => ({ startTime: newTime })),
        setDeltaTime: (newDeltaTime: number) => set(() => ({ deltaTime: newDeltaTime })),
        setLoopId: (newId: NodeJS.Timeout) => set(() => ({ loopId: newId })),
      },
    }),
    {
      // persist only frameRate
      partialize: (state) => ({ frameRate: state.frameRate } as Partial<AnimationStateStore>),
      merge: (persistedState, currentState) => ({ ...currentState, ...(persistedState as AnimationStateStore) }),
      name: "animationOptions",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useFrame = () => useAnimation((state) => state.frame);
export const useFrameCount = () => useAnimation((state) => state.frameCount);
export const useFrameRate = () => useAnimation((state) => state.frameRate);
export const useAnimationState = () => useAnimation((state) => state.state);
export const useStartTime = () => useAnimation((state) => state.startTime);
export const useEndTime = () => useAnimation((state) => state.endTime);
export const useDeltaTime = () => useAnimation((state) => state.deltaTime);
export const useLoopId = () => useAnimation((state) => state.loopId);
export const useAnimationActions = () => useAnimation((state) => state.actions);
