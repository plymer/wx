import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Slider({
  className,
  showTicks,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { showTicks?: boolean }) {
  const { max, min, step } = props;

  const computeTickMarkCount = !!max && !!min && !!step;

  const tickMarkCount = computeTickMarkCount ? (max - min) / step + 1 : 1;
  const tickWidth = 100 / tickMarkCount;

  return (
    <div className="relative h-full w-full flex items-center">
      {showTicks && tickMarkCount > 1 && (
        <div className="absolute h-6/7 w-full flex">
          {Array.from({ length: tickMarkCount }).map((_, idx) => (
            <div style={{ width: `${tickWidth}%` }} key={idx} className="text-center text-neutral-400 font-mono">
              |
            </div>
          ))}
        </div>
      )}

      <SliderPrimitive.Root
        data-slot="slider"
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200 data-disabled:cursor-not-allowed">
          <SliderPrimitive.Range className="absolute h-full bg-accent data-disabled:bg-neutral-200 data-disabled:cursor-not-allowed" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-disabled:pointer-events-none data-disabled:bg-neutral-200 data-disabled:cursor-not-allowed" />
      </SliderPrimitive.Root>
    </div>
  );
}
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
