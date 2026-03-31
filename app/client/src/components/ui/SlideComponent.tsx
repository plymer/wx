import { useState, useEffect } from "react";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  children?: React.ReactNode;
}

export default function SlideComponent({ isVisible, onAnimationComplete, children, ...props }: Props) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState("slide-enter-active");

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // force an update after a small delay (to ensure the DOM is ready)
      // to trigger the CSS transition
      setTimeout(() => {
        setAnimationClass("slide-enter-active");
      }, 20);
    } else {
      setAnimationClass("slide-exit-active");

      // wait the duration of the css transition before un-rendering the component
      setTimeout(() => {
        setShouldRender(false);
        onAnimationComplete?.();
      }, 500);
    }
  }, [isVisible, onAnimationComplete]);

  if (!shouldRender) return null;

  return <div className={`slide-panel ${animationClass} ${props.className}`}>{children}</div>;
}
