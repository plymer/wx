import { Play, Pause, ChevronFirst, ChevronLeft, ChevronLast, ChevronRight } from "lucide-react";
import { ButtonProps } from "./Button";

import { AnimationControlsList, AnimationState } from "@/lib/types";
import ButtonWithTooltip from "./ButtonWithTooltip";

interface Props extends ButtonProps {
  buttonType: AnimationControlsList;
  animationState: AnimationState;
  text?: string;
}

// icons to display inside the button depending on which 'buttonType' of button it is (the action it performs)
const Icons = {
  last: <ChevronFirst />,
  prev: <ChevronLeft />,
  play: <Play />,
  pause: <Pause />,
  next: <ChevronRight />,
  first: <ChevronLast />,
};

const AnimationControlButton = ({ buttonType, animationState, text, ...buttonProps }: Props) => {
  return (
    <ButtonWithTooltip
      {...buttonProps}
      tooltipText={buttonType}
      className={`${
        buttonType !== "pause" && buttonType !== "play"
          ? "" // easy case, not the play or pause button
          : buttonType === "pause" && animationState === "playing"
            ? "" // only show pause if we are playing or loading
            : buttonType === "play" && animationState === "paused"
              ? "" // only show if we are showing realtime data or the loop is paused
              : "hidden"
      }`}
    >
      {Icons[buttonType]}
      <span className="sr-only">{buttonType}</span>
      {text && <span className="ms-2">{text}</span>}
    </ButtonWithTooltip>
  );
};

export default AnimationControlButton;
