import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-[--opacity-disabled] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/[--opacity-subtle] focus-visible:ring-[3px] aria-invalid:ring-error/20 aria-invalid:border-error",
  {
    variants: {
      variant: {
        default:
          "bg-brand/[--opacity-hover] text-brand-foreground shadow-md hover:bg-brand-hover/[--opacity-hover] hover:shadow-glow-brand",
        destructive:
          "bg-error/[--opacity-hover] text-brand-foreground shadow-md hover:bg-error-hover/[--opacity-hover] hover:shadow-glow-brand focus-visible:ring-error/20",
        outline:
          "border border-border/[--opacity-surface] bg-surface backdrop-blur-sm shadow-md hover:bg-info/10 hover:text-info hover:border-info",
        secondary:
          "bg-info/10 text-info shadow-md hover:bg-info/20 hover:shadow-glow-info",
        ghost:
          "hover:bg-neutral/10 hover:text-neutral",
        link: "text-brand underline-offset-4 hover:underline hover:text-brand-hover",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-9 rounded-full gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-11 rounded-full px-7 has-[>svg]:px-5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
