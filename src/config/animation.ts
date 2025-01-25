// type of buttons for controlling the animation
export const ANIM_CONTROLS = ["last", "prev", "stop", "play", "pause", "next", "first"] as const;

export type AnimationControlsList = (typeof ANIM_CONTROLS)[number];
