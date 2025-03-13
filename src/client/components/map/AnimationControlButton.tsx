import { Play, Pause, ChevronFirst, ChevronLeft, ChevronLast, ChevronRight, Clock } from "lucide-react";

import { AnimationControlsList, AnimationState } from "../../config/animation";
import Button from "../ui/button";

interface Props {
  onClick: () => void;
  type: AnimationControlsList;
  className?: string;
  animationState: AnimationState;
  text?: string;
}

// icons to display inside the button depending on which 'type' of button it is (the action it performs)
const Icons = {
  last: <ChevronFirst />,
  prev: <ChevronLeft />,
  realtime: <Clock />,
  play: <Play />,
  pause: <Pause />,
  next: <ChevronRight />,
  first: <ChevronLast />,
};

const AnimationControlButton = ({ onClick, type, className, animationState, text }: Props) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`${
        type !== "pause" && type !== "play"
          ? className // easy case, not the play or pause button
          : (type === "pause" && animationState === "playing") || (type === "pause" && animationState === "loading")
          ? className // only show pause if we are playing or loading
          : (type === "play" && animationState === "realtime") || (type === "play" && animationState === "paused")
          ? className // only show if we are showing realtime data or the loop is paused
          : "hidden"
      }`}
    >
      {Icons[type]}
      <span className="sr-only">{type}</span>
      {text && <span className="ms-2">{text}</span>}
    </Button>
  );
};

export default AnimationControlButton;
