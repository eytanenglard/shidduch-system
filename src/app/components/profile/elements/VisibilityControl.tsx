import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VisibilityControlProps {
  /**
   * Current visibility state
   */
  isVisible: boolean;

  /**
   * Callback when visibility changes
   */
  onChange: (isVisible: boolean) => void;

  /**
   * Optional class name for additional styling
   */
  className?: string;

  /**
   * Optional disabled state
   */
  disabled?: boolean;

  /**
   * Optional custom tooltip text
   */
  tooltipText?: {
    visible?: string;
    hidden?: string;
    action?: string;
  };
}

const VisibilityControl: React.FC<VisibilityControlProps> = ({
  isVisible,
  onChange,
  className,
  disabled = false,
  tooltipText = {
    visible: "תשובה זו גלויה למועמדים",
    hidden: "תשובה זו מוסתרת מהמועמדים",
    action: "לחץ כדי",
  },
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-secondary/20 p-2 rounded-md",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Icon */}
      {isVisible ? (
        <Eye 
          className="h-4 w-4 text-primary" 
          aria-hidden="true"
        />
      ) : (
        <EyeOff 
          className="h-4 w-4 text-muted-foreground" 
          aria-hidden="true"
        />
      )}

      {/* Switch with Tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Switch
                checked={isVisible}
                onCheckedChange={onChange}
                disabled={disabled}
                className={cn(
                  "data-[state=checked]:bg-primary",
                  disabled && "cursor-not-allowed"
                )}
                aria-label={`Toggle visibility: currently ${isVisible ? 'visible' : 'hidden'}`}
              />
              {/* Visually hidden text for screen readers */}
              <span className="sr-only">
                {isVisible ? "הסתר תוכן" : "הצג תוכן"}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="left" 
            className="max-w-[200px]"
            dir="rtl"
          >
            <p>
              {isVisible ? tooltipText.visible : tooltipText.hidden}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {tooltipText.action} {isVisible ? "להסתיר" : "להציג"} תשובה זו
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// Default export
export default VisibilityControl;

// Named exports for types
export type { VisibilityControlProps };