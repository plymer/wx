import { useEffect } from "react";

import AnimationControlButton from "./AnimationControlButton";

import { makeISOTimeStamp } from "../../lib/utils";

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
} from "../../stateStores/map/animation";
import { ANIM_CONTROLS, AnimationControlsList, MAX_FRAMERATE, MIN_FRAMERATE } from "../../config/animation";
import { CircleHelp } from "lucide-react";
import Button from "../ui/button";
import { Slider } from "../ui/slider";

const AnimationControls = () => {
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
        if (animation.state === "loading" || animation.state === "paused") {
          // if we're stopped or paused at the maxFrame, we don't want to wait the standard 2 second delay so we set our frame to zero and then start playing
          // if we are anywhere else in the loop, just start playing
          if (animation.frame === maxFrame) animationActions.setFrame(0);
          animationActions.play();
        } else {
          animationActions.load();
        }
        break;

      case "pause":
        clearTimeout(animation.loopId);
        animationActions.pause();
        break;

      case "realtime":
        // we want to:
        // 1) stop the animation (incrementing of our frame number)
        // 2) stop all network transactions
        // 3) clear the timeout so that no more loops occur even if they are queued
        // 4) set our frame back to the most-recent time
        animationActions.stop();
        window.stop();
        clearTimeout(animation.loopId);
        animationActions.setFrame(maxFrame);
        break;

      case "next":
        animationActions.pause();
        animationActions.nextFrame();
        break;

      case "prev":
        animationActions.pause();
        animationActions.previousFrame();
        break;

      case "first":
        animationActions.pause();
        animationActions.firstFrame();
        break;

      case "last":
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
    <div className="flex">
      <div className="grid grid-cols-1">
        <div className="mt-2 flex justify-center font-mono">
          <span>Display Time: {makeISOTimeStamp(currentTime, "display")}</span>
        </div>

        <div className="flex justify-between font-mono place-items-center">
          <span className="me-2">{makeISOTimeStamp(animation.startTime, "display", true)}</span>
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
          <span className="ms-2">{makeISOTimeStamp(animation.endTime, "display", true)}</span>
        </div>

        <div className="my-2 inline-flex">
          <div className="inline-flex">
            {
              <div>
                <Button variant={"ghost"} onClick={() => alert("tips and best practices for animation")}>
                  <CircleHelp />
                </Button>
              </div>
            }
            {ANIM_CONTROLS.map((c, index) => {
              if (c === "realtime") return;
              else
                return (
                  <AnimationControlButton
                    key={index}
                    type={c}
                    animationState={animation.state}
                    onClick={() => doAnimateCommand(c)}
                    className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
                  />
                );
            })}
          </div>
          <div className="ms-2 inline-flex items-center">
            <label htmlFor="framerate" className="me-2">
              FPS:
            </label>
            <input
              id="framerate"
              className="rounded ps-2 text-black bg-secondary"
              max={MAX_FRAMERATE}
              min={MIN_FRAMERATE}
              defaultValue={animation.frameRate}
              type="number"
              onChange={(e) => {
                animationActions.setFrameRate(parseInt(e.target.value));
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex py-4 ps-4 place-items-center">
        <AnimationControlButton
          animationState="realtime"
          onClick={() => doAnimateCommand("realtime")}
          type="realtime"
          text="Realtime Mode"
        />
      </div>
    </div>
  );
};

export default AnimationControls;
