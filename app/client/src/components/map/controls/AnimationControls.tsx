import React, { useEffect } from "react";

import AnimationControlButton from "@/components/ui/AnimationControlButton";
import {
  useAnimationActions,
  useAnimationState,
  useDeltaTime,
  useEndTime,
  useFrame,
  useFrameCount,
  useFrameRate,
  useLoopId,
  useStartTime,
} from "@/stateStores/map/animation";
import { ANIM_CONTROLS } from "@/config/animation";
import type { AnimationControlsList } from "@/lib/types";
import { makeISOTimeStamp } from "@/lib/utils";
import { Slider } from "@/components/ui/Slider";

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const AnimationControls = ({ ...props }: Props) => {
  const animationActions = useAnimationActions();

  const animation = {
    frameCount: useFrameCount(),
    state: useAnimationState(),
    frame: useFrame(),
    loopId: useLoopId(),
    frameRate: useFrameRate(),
    startTime: useStartTime(),
    deltaTime: useDeltaTime(),
    endTime: useEndTime(),
  };

  const maxFrame = animation.frameCount - 1;
  const currentTime = animation.startTime + animation.frame * animation.deltaTime;

  /**
   * controls the animation based on user input
   * @param control the string passed as the command for the animation
   */
  const doAnimateCommand = (control: AnimationControlsList) => {
    switch (control) {
      case "play":
        if (animation.frame === maxFrame) animationActions.setFrame(0);

        animationActions.play();
        break;

      case "pause":
        clearTimeout(animation.loopId);
        animationActions.pause();
        break;

      case "next":
        clearTimeout(animation.loopId);
        animationActions.pause();
        animationActions.nextFrame();
        break;

      case "prev":
        clearTimeout(animation.loopId);
        animationActions.pause();
        animationActions.previousFrame();
        break;

      case "first":
        clearTimeout(animation.loopId);
        animationActions.pause();
        animationActions.firstFrame();
        break;

      case "last":
        clearTimeout(animation.loopId);
        animationActions.pause();
        animationActions.lastFrame();
        break;
    }
  };

  /**
   * create a setInterval that will be applied or removed as necessary depending on the animation state that the user has chosen
   */
  useEffect(() => {
    // calculate the milliseconds per frame
    // if wwe are on the last frame, hold for 2 seconds before starting the loop again
    const delay: number = animation.frame === maxFrame ? 2_000 : 1_000 / animation.frameRate;

    if (animation.state === "playing") {
      animationActions.setLoopId(setTimeout(() => animationActions.nextFrame(), delay));
    }

    return () => clearTimeout(animation.loopId);
  }, [animation.state, animation.frame]);

  return (
    <div {...props}>
      <div className="flex justify-center flex-col w-full max-w-90 ">
        <div className="mt-2 flex justify-center font-mono drop-shadow-2xl">
          Display Time: {makeISOTimeStamp(currentTime, "display")}
        </div>

        <div className="flex justify-between font-mono place-items-center border-2 border-black rounded-md px-2 mt-2 bg-neutral-900 drop-shadow-2xl">
          <div className="me-2 text-xs">{makeISOTimeStamp(animation.startTime, "display", true)}</div>
          <Slider
            onClick={() => animationActions.pause()}
            max={animation.endTime}
            min={animation.startTime}
            step={animation.deltaTime}
            value={[currentTime]}
            onValueChange={(e) => {
              animationActions.setFrame((e[0] - animation.startTime) / animation.deltaTime);
            }}
            className="my-2"
          />
          <div className="ms-2 text-xs">{makeISOTimeStamp(animation.endTime, "display", true)}</div>
        </div>

        <div className="m-2 inline-flex justify-center drop-shadow-2xl">
          {ANIM_CONTROLS.map((c, index) => (
            <AnimationControlButton
              key={index}
              buttonType={c}
              animationState={animation.state}
              onClick={() => doAnimateCommand(c)}
              variant={"animation"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimationControls;
