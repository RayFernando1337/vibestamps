import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600/90 dark:bg-emerald-700/80 text-white shadow-[0_4px_10px_rgba(16,185,129,0.2)] dark:shadow-[0_4px_10px_rgba(16,185,129,0.15)] hover:bg-emerald-500/90 dark:hover:bg-emerald-600/90 hover:shadow-[0_6px_15px_rgba(16,185,129,0.3)]",
        destructive:
          "bg-rose-600/90 dark:bg-rose-700/80 text-white shadow-[0_4px_10px_rgba(225,29,72,0.2)] dark:shadow-[0_4px_10px_rgba(225,29,72,0.15)] hover:bg-rose-500/90 dark:hover:bg-rose-600/90 hover:shadow-[0_6px_15px_rgba(225,29,72,0.3)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm shadow-[0_4px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.08)] hover:bg-sky-50/80 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-200 dark:hover:border-sky-800",
        secondary:
          "bg-sky-100/90 dark:bg-sky-900/50 text-sky-700 dark:text-sky-100 shadow-[0_4px_10px_rgba(14,165,233,0.1)] dark:shadow-[0_4px_10px_rgba(14,165,233,0.08)] hover:bg-sky-200/90 dark:hover:bg-sky-800/60 hover:shadow-[0_6px_15px_rgba(14,165,233,0.15)]",
        ghost:
          "hover:bg-slate-100/80 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-100",
        link: "text-emerald-600 dark:text-emerald-400 underline-offset-4 hover:underline hover:text-emerald-500 dark:hover:text-emerald-300",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-full gap-2 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-full px-8 has-[>svg]:px-6 text-base",
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
