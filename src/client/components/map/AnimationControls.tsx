import React, { useEffect } from "react";

import AnimationControlButton from "./AnimationControlButton";
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
} from "@stateStores/map/animation";
import { ANIM_CONTROLS } from "@config/animation";
import { AnimationControlsList } from "@lib/types";
import { makeISOTimeStamp } from "@lib/utils";
import { Slider } from "../ui/Slider";

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
        // if (animation.state === "loading" || animation.state === "paused") {
        //   // if we're stopped or paused at the maxFrame, we don't want to wait the standard 2 second delay so we set our frame to zero and then start playing
        //   // if we are anywhere else in the loop, just start playing
        if (animation.frame === maxFrame) animationActions.setFrame(0);
        //   animationActions.play();
        // } else {
        //   animationActions.load();
        // }
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
   *  Used to translate keyboard input into a useable command string to animate the data
   * @param code a string returned by a KeyboardEvent.code that pertains to the key pressed by the user
   * @returns a string that can be used by the doAnimateCommand method to change the animation state and timestep
   */
  // const translateKeyboardInput = (event: KeyboardEvent): AnimationControlsList | undefined => {
  //   switch (event.code) {
  //     case "Space":
  //       if (animation.state === "paused" || animation.state === "loading" || animation.state === "stopped")
  //         return "play";
  //       else return "pause";
  //     case "Comma":
  //       return "prev";
  //     case "Period":
  //       return "next";
  //     case "Slash":
  //       return "first";
  //     case "KeyM":
  //       return "last";
  //   }
  // };

  /**
   * set up the method that is called by the event listener for keyboard shortcuts in the app
   */
  // const handleKeyPress = useCallback(
  //   (event: KeyboardEvent) => {
  //     event.code === "Slash" && event.preventDefault();
  //     const translated = translateKeyboardInput(event);
  //     translated && doAnimateCommand(translated);
  //   },
  //   [animation.frame, animation.state],
  // );

  /**
   * add the event listeners to the html document that listen for user keyboard input and send it to our callback
   */
  // useEffect(() => {
  //   document.addEventListener("keydown", handleKeyPress);

  //   return () => {
  //     document.removeEventListener("keydown", handleKeyPress);
  //   };
  // }, [handleKeyPress]);

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
      <div className="flex justify-center flex-col w-full max-w-80">
        <div className="mt-2 flex justify-center font-mono ">
          Display Time: {makeISOTimeStamp(currentTime, "display")}
        </div>

        <div className="flex justify-between font-mono place-items-center">
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

        <div className="m-2 inline-flex justify-center">
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
