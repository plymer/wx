// type of buttons for controlling the animation
export const ANIM_CONTROLS = ["last", "prev", "realtime", "play", "pause", "next", "first"] as const;
export type AnimationControlsList = (typeof ANIM_CONTROLS)[number];

export const ANIMATION_STATES = ["playing", "loading", "paused", "realtime"] as const;
// type helper for animation states config
export type AnimationState = (typeof ANIMATION_STATES)[number];

export const MAX_FRAMERATE = 20;
export const MIN_FRAMERATE = 2;
export const DEFAULT_MAX_FRAMES = 18;
