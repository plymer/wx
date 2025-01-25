import { Play, Pause, ChevronFirst, ChevronLeft, ChevronLast, ChevronRight, Square } from "lucide-react";
import { Button } from "../ui/button";
import { AnimationControlsList } from "@/config/animation";
import { AnimationState } from "@/lib/types";

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
          ? className
          : (type === "pause" && animationState === "playing") || (type === "pause" && animationState === "loading")
          ? className
          : type === "play" && animationState === "stopped"
          ? className
          : "hidden"
      }`}
    >
      {Icons[type]}
      <span className="sr-only">{type}</span>
    </Button>
  );
};

export default AnimationControlButton;
