import { Play, Pause, ChevronFirst, ChevronLeft, ChevronLast, ChevronRight, Square } from "lucide-react";

import { AnimationControlsList, AnimationState } from "@/config/animation";
import { Button } from "../ui/button";

interface Props {
  onClick: () => void;
  type: AnimationControlsList;
  className?: string;
  animationState: AnimationState;
}

// icons to display inside the button depending on which 'type' of button it is (the action it performs)
const Icons = {
  last: <ChevronFirst />,
  prev: <ChevronLeft />,
  stop: <Square />,
  play: <Play />,
  pause: <Pause />,
  next: <ChevronRight />,
  first: <ChevronLast />,
};

const AnimationControlButton = ({ onClick, type, className, animationState }: Props) => {
  return (
    <Button
      onClick={onClick}
      className={`${
        type !== "pause" && type !== "play"
          ? className // easy case, not the play or pause button
          : (type === "pause" && animationState === "playing") || (type === "pause" && animationState === "loading")
          ? className // only show pause if we are playing or loading
          : (type === "play" && animationState === "stopped") || (type === "play" && animationState === "paused")
          ? className // only show if we are stopped or paused
          : "hidden"
      }`}
    >
      {Icons[type]}
      <span className="sr-only">{type}</span>
    </Button>
  );
};

export default AnimationControlButton;
