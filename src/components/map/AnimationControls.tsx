import { JSX, useCallback, useEffect, useState } from "react";

import AnimationControlButton from "./AnimationControlButton";
import { useMapConfigContext } from "@/contexts/mapConfigContext";

import { makeISOTimeStamp } from "@/lib/utils";
import { Slider } from "../ui/slider";

// import { NUM_HRS_DATA } from "@/utilities/constants";

const AnimationControls = () => {
  const animation = useMapConfigContext();

  const [loopID, setLoopID] = useState<NodeJS.Timeout>();

  // type of buttons for controlling the animation
  const ANIM_CONTROLS: string[] = ["last", "prev", "stop", "play", "pause", "next", "first"];

  /**
   * helper function to handle the logic for looping through the animation
   * @param frame the animation frame that has been requested
   * @param delta the optional modifier (1, -1) that we will mutate our request with
   */
  const getNewFrame = (frameCount: number, frame: number, delta?: number) => {
    const maxFrame = frameCount - 1;
    const minFrame = 0;

    if (delta) frame = frame + delta;

    if (frame > maxFrame) {
      frame = minFrame;
    } else if (frame < minFrame) {
      frame = maxFrame;
    }

    // we have mutated the frame number and are returning it to the caller
    return frame;
  };

  /**
   * controls the animation based on user input
   * @param control the string passed as the command for the animation
   */
  const doAnimateCommand = (control: string) => {
    switch (control) {
      case "play":
        animation.setAnimationState("loading");
        break;

      case "pause":
        animation.setAnimationState("paused");
        break;

      case "stop":
        animation.setAnimationState("stopped");
        animation.setCurrentFrame(getNewFrame(animation.frameCount, animation.frameCount - 1));
        break;

      case "next":
        animation.setAnimationState("paused");
        animation.setCurrentFrame(getNewFrame(animation.frameCount, animation.currentFrame, 1));
        break;

      case "prev":
        animation.setAnimationState("paused");
        animation.setCurrentFrame(getNewFrame(animation.frameCount, animation.currentFrame, -1));
        break;

      case "first":
        animation.setAnimationState("paused");
        animation.setCurrentFrame(getNewFrame(animation.frameCount, animation.frameCount - 1));
        break;

      case "last":
        animation.setAnimationState("paused");
        animation.setCurrentFrame(getNewFrame(animation.frameCount, 0));
        break;
    }
  };

  /**
   *  Used to translate keyboard input into a useable command string to animate the data
   * @param code a string returned by a KeyboardEvent.code that pertains to the key pressed by the user
   * @returns a string that can be used by the doAnimateCommand method to change the animation state and timestep
   */
  const translateKeyboardInput = (code: string) => {
    // console.log(code);
    switch (code) {
      case "Space":
        if (
          animation.animationState === "paused" ||
          animation.animationState === "loading" ||
          animation.animationState === "stopped"
        )
          return "play";
        else return "pause";
      case "Comma":
        return "prev";
      case "Period":
        return "next";
      case "Slash":
        return "first";
      case "KeyM":
        return "last";
      default:
        return "";
    }
  };

  /**
   * set up the method that is called by the event listener for keyboard shortcuts in the app
   */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      event.code === "Slash" && event.preventDefault();
      const translated = translateKeyboardInput(event.code);
      translated != "" && doAnimateCommand(translated);
    },
    [animation.currentFrame, animation.animationState],
  );

  /**
   * add the event listeners to the html document that listen for user keyboard input and send it to our callback
   */
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  /**
   * create a setInterval that will be applied or removed as necessary depending on the animation state that the user has chosen
   */
  useEffect(() => {
    // calculate the milliseconds per frame
    // if wwe are on the last frame, hold for 2 seconds before starting the loop again
    const delay: number = animation.currentFrame === animation.frameCount - 1 ? 2000 : 1000 / animation.frameRate;

    if (animation.animationState === "playing") {
      setLoopID(
        setInterval(
          () => animation.setCurrentFrame(getNewFrame(animation.frameCount, animation.currentFrame, 1)),
          delay,
        ),
      );
    } else {
      clearInterval(loopID);
    }

    return () => {
      clearInterval(loopID);
    };
  }, [animation.animationState, animation.currentFrame]);

  /**
   * Builds a button for each command that is available for the animating of the map
   * @param command the command that will be passed on to the function that actually controls the animation and frame shown on the map display
   * @param index integer used to key the JSX element passed from the .map() function
   * @returns a JSX button element with all of the props needed to allow the user to control the map animation
   */
  const buildButton = (command: string, index: number) => {
    var button: JSX.Element = (
      <AnimationControlButton key={index} type={command} onClick={() => handleClick(command)} />
    );
    if (command === "play" && animation.animationState === "playing") {
      return "";
    } else if (command === "play" && animation.animationState === "loading") {
      return "";
    } else if (
      (command === "pause" && animation.animationState === "paused") ||
      (command === "pause" && animation.animationState === "stopped")
    ) {
      return "";
    } else {
      return button;
    }
  };

  /**
   * controls the animation based on user input
   * @param control the string passed as the command for the animation
   */
  const handleClick = (control: string) => {
    // we don't need to translate any input so just pass the command string
    doAnimateCommand(control);
  };

  // const animationProgress =
  //   (animation.currentFrame / (animation.frameCount - 1)) * 100;
  // const sliderStep = (NUM_HRS_DATA * 60 * 60 * 1000) / animation.timeStep;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:my-1">
      <div>
        <div className="mt-2 flex justify-between font-mono">
          <span>{makeISOTimeStamp(animation.startTime, "display")}</span>
          <span>{makeISOTimeStamp(animation.endTime, "display")}</span>
        </div>

        <Slider
          max={animation.endTime - animation.timeStep}
          min={animation.startTime}
          step={animation.timeStep}
          value={[animation.startTime + animation.timeStep * animation.currentFrame]}
          onValueChange={(e) => {
            animation.setCurrentFrame(
              getNewFrame(animation.frameCount, (e[0] - animation.startTime) / animation.timeStep),
            );
          }}
          className="my-2 bg-gray-800"
        />
      </div>

      <div className="my-2 inline-flex">
        <div className="inline-flex">{ANIM_CONTROLS.map((c, index) => buildButton(c, index))}</div>
        <div className="ms-2 inline-flex items-center">
          <label htmlFor="framerate" className="me-2">
            FPS:
          </label>
          <input
            id="framerate"
            className="rounded ps-2 text-black"
            max={20}
            min={2}
            defaultValue={animation.frameRate}
            type="number"
            onChange={(e) => animation.setFrameRate(parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

export default AnimationControls;
