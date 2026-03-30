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
      // Mount: Start rendering and trigger enter animation
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setAnimationClass("slide-enter-active");
      }, 20);
    } else {
      // Unmount: Trigger exit animation
      setAnimationClass("slide-exit-active");
      // Wait for animation to complete before removing from DOM
      setTimeout(() => {
        setShouldRender(false);
        onAnimationComplete?.();
      }, 500); // Match CSS transition duration
    }
  }, [isVisible, onAnimationComplete]);

  if (!shouldRender) return null;

  return <div className={`slide-panel ${animationClass} ${props.className}`}>{children}</div>;
}
