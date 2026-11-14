import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const THUMB_SIZE = "1rem";

function getTicks(min: number, max: number, step: number) {
  const range = max - min;
  const stops = Math.floor(range / step + 1e-9);
  const ticks = Array.from({ length: stops + 1 }, (_, i) => {
    const value = +(min + i * step).toFixed(6);
    return { value, f: (value - min) / range };
  });
  if (ticks[ticks.length - 1].value < max) ticks.push({ value: max, f: 1 });
  return ticks;
}

function Slider({
  className,
  showTicks,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & { showTicks?: boolean }) {
  const { max, min, step } = props;

  const ticks = !!max && !!min && !!step ? getTicks(min, max, step) : undefined;

  return (
    <div
      className="relative h-full w-full flex items-center"
      style={{ "--thumb": `${THUMB_SIZE}` } as React.CSSProperties}
    >
      {showTicks &&
        ticks?.map(({ f, value }) => {
          const left = `calc(var(--thumb) / 2 + (100% - var(--thumb)) * ${f})`;
          return (
            <span key={value} style={{ left }} className="absolute top-1/2 h-4 w-0.5 -translate-1/2 bg-neutral-400" />
          );
        })}

      <SliderPrimitive.Root
        data-slot="slider"
        className={cn("relative flex w-full touch-none select-none items-center", className)}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200 data-disabled:cursor-not-allowed">
          <SliderPrimitive.Range className="absolute h-full bg-accent data-disabled:bg-neutral-200 data-disabled:cursor-not-allowed" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block size-[1rem] rounded-full border border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-disabled:pointer-events-none data-disabled:bg-neutral-200 data-disabled:cursor-not-allowed" />
      </SliderPrimitive.Root>
    </div>
  );
}
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
