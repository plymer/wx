import { useEffect, useRef, useState } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  children?: React.ReactNode;
}

export default function SlideComponent({ isVisible, onAnimationComplete, children, ...props }: Props) {
  const ENTER_ANIMATION_DELAY_MS = 20;
  const EXIT_ANIMATION_DURATION_MS = 500;

  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationState, setAnimationState] = useState<"enter" | "exit">(isVisible ? "enter" : "exit");
  const enterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisibleRef = useRef(isVisible);
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    isVisibleRef.current = isVisible;

    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }

    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    if (isVisible) {
      setShouldRender(true);
      setAnimationState("exit");
      // force an update after a small delay (to ensure the DOM is ready)
      // to trigger the CSS transition
      enterTimeoutRef.current = setTimeout(() => {
        if (!isVisibleRef.current) {
          return;
        }
        setAnimationState("enter");
        enterTimeoutRef.current = null;
      }, ENTER_ANIMATION_DELAY_MS);
    } else {
      setAnimationState("exit");

      // wait the duration of the css transition before un-rendering the component
      exitTimeoutRef.current = setTimeout(() => {
        if (isVisibleRef.current) {
          return;
        }
        setShouldRender(false);
        onAnimationCompleteRef.current?.();
        exitTimeoutRef.current = null;
      }, EXIT_ANIMATION_DURATION_MS);
    }

    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = null;
      }

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [isVisible]);

  if (!shouldRender) return null;

  const isEntering = animationState === "enter";
  const transitionTiming = isEntering ? "ease-out" : "ease-in";
  const slideStyle: React.CSSProperties = {
    transform: isEntering ? "translateX(0)" : "translateX(-100%)",
    opacity: isEntering ? 1 : 0,
    transition: `transform ${EXIT_ANIMATION_DURATION_MS}ms ${transitionTiming}, opacity ${EXIT_ANIMATION_DURATION_MS}ms ${transitionTiming}`,
    ...props.style,
  };

  return (
    <div {...props} className={props.className} style={slideStyle}>
      {children}
    </div>
  );
}
