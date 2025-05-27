// components/ui/progress.tsx
"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// Define a new interface for props that includes indicatorClassName
interface CustomProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  CustomProgressProps // Use the new CustomProgressProps interface
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-100", // As per your provided file
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 bg-blue-600 transition-all", // As per your provided file
        indicatorClassName // Apply the indicatorClassName here
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }} // Corrected transform for left-to-right fill
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };