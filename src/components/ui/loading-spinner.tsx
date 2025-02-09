// src/components/ui/loading-spinner.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className,
  size = "md" 
}) => {
  return (
    <div className="flex items-center justify-center w-full min-h-[100px]">
      <Loader2 
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className
        )} 
      />
    </div>
  );
};

export default LoadingSpinner;