import { useCallback, useEffect, useState } from "react";

import AnimationControlButton from "./AnimationControlButton";

import { makeISOTimeStamp } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useMap } from "@/stateStores/map";
import { ANIM_CONTROLS, AnimationControlsList } from "@/config/animation";

const AnimationControls = () => {
  const animation = useMap((state) => state.animation);

  const maxFrame = animation.frameCount - 1;

  const [loopID, setLoopID] = useState<NodeJS.Timeout>();

  const doAnimateCommand = (control: AnimationControlsList) => {
    switch (control) {
      case "play":
        animation.setState("loading");
        break;

      case "pause":
        animation.setState("paused");
        break;

      case "stop":
        animation.setState("stopped");
        animation.setFrame(maxFrame);
        break;

      case "next":
        animation.setState("paused");
        animation.nextFrame();
        break;

      case "prev":
        animation.setState("paused");
        animation.prevFrame();
        break;

      case "first":
        animation.setState("paused");
        animation.firstFrame();
        break;

      case "last":
        animation.setState("paused");
        animation.lastFrame();
        break;
    }
  };

  const translateKeyboardInput = (code: KeyboardEvent): AnimationControlsList | undefined => {
    switch (code.toString()) {
      case "Space":
        if (animation.state === "paused" || animation.state === "loading" || animation.state === "stopped")
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
    }
  };

  /**
   * set up the method that is called by the event listener for keyboard shortcuts in the app
   */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      event.code === "Slash" && event.preventDefault();
      const translated = translateKeyboardInput(event);
      translated && doAnimateCommand(translated);
    },
    [animation.frame, animation.state]
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
    // if we are on the last frame, hold for 2 seconds before starting the loop again
    const delay: number = animation.frame === maxFrame ? 2000 : 1000 / animation.frameRate;

    // console.log("delay:", delay);
    if (animation.state === "playing") {
      console.log(animation.frame, delay);
      setLoopID(setInterval(() => animation.nextFrame(), delay));
    } else {
      clearInterval(loopID);
    }

    return () => {
      clearInterval(loopID);
    };
  }, [animation.state, animation.frame]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:my-1">
      <div>
        <div className="mt-2 flex justify-between font-mono">
          <span>{makeISOTimeStamp(animation.startTime, "display")}</span>
          <span>{makeISOTimeStamp(animation.endTime, "display")}</span>
        </div>

        <Slider
          max={animation.endTime - animation.deltaTime}
          min={animation.startTime}
          step={animation.deltaTime}
          value={[animation.startTime + animation.deltaTime * animation.frame]}
          onValueChange={(e) => {
            animation.setFrame((e[0] - animation.startTime) / animation.deltaTime);
          }}
          className="my-2 bg-gray-800"
        />
      </div>

      <div className="my-2 inline-flex">
        <div className="inline-flex">
          {ANIM_CONTROLS.map((c, index) => (
            <AnimationControlButton
              key={index}
              type={c}
              onClick={() => doAnimateCommand(c)}
              className="rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md"
              animationState={animation.state}
            />
          ))}
        </div>
        <div className="ms-2 inline-flex items-center">
          <label htmlFor="framerate" className="me-2">
            FPS:
          </label>
          <input
            id="framerate"
            className="rounded ps-2 text-black bg-secondary"
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
