import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-wrap= rounded-md text-sm font-medium hover:cursor-pointer ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        menuTab: "rounded-none rounded-t-md [&.active]:bg-neutral-800 [&.active]:text-white",
        selected: "bg-accent text-accent-foreground hover:bg-accent/40",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        drawer:
          "bg-neutral-200 w-full text-black hover:bg-accent hover:text-white [&.active]:bg-accent  [&.active]:text-white rounded-none first-of-type:rounded-s-md last-of-type:rounded-e-md",
        floatingIcon: "bg-primary hover:bg-accent text-white w-10 h-10 items-center border-1 border-neutral-400",
        ghost: "bg-transparent text-primary-foreground hover:text-accent",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-9 rounded-md px-3",
        lg: "min-h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// helper type for button variants
export type ButtonVariantList = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSizeList = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export default Button;
