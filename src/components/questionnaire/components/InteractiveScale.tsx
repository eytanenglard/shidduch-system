import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Star,
  Heart,
  ThumbsUp,
  Sparkles,
  Info,
  AlertCircle,
} from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Progress } from "@/components/ui/progress";

interface ScaleOption {
  value: number;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface InteractiveScaleProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  onComplete?: (value: number) => void;
  labels?: {
    min: string;
    max: string;
    middle?: string;
  };
  descriptions?: {
    min?: string;
    max?: string;
    middle?: string;
  };
  options?: ScaleOption[];
  mode?: "numeric" | "icons" | "hearts" | "stars" | "thumbs";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showValue?: boolean;
  showTooltips?: boolean;
  isDisabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
  error?: string;
}

const defaultIcons = {
  stars: Star,
  hearts: Heart,
  thumbs: ThumbsUp,
};

export default function InteractiveScale({
  min = 1,
  max = 10,
  step = 1,
  defaultValue,
  value: controlledValue,
  onChange,
  onComplete,
  labels,
  options,
  mode = "numeric",
  size = "md",
  showLabels = true,
  showValue = true,
  showTooltips = true,
  isDisabled = false,
  className = "",
  required = false,
  name,
  error,
  descriptions,
}: InteractiveScaleProps) {
  const [internalValue, setInternalValue] = useState<number | null>(
    defaultValue || null
  );
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const isMobileDevice = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // טיימר להצגת הרמז
  useEffect(() => {
    // אם יש ערך - הסתר את הרמז
    if (value !== null) {
      setHintVisible(false);
      return;
    }

    // הצג רמז למשתמש אחרי 2 שניות אם אין ערך
    const timer = setTimeout(() => {
      if (value === null) {
        setHintVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [value]);

  const handleValueChange = useCallback(
    (newValue: number) => {
      if (!isDisabled) {
        setInternalValue(newValue);
        onChange?.(newValue);
        setHintVisible(false);
      }
    },
    [isDisabled, onChange]
  );

  const handleClick = useCallback(
    (clickedValue: number) => {
      handleValueChange(clickedValue);
      onComplete?.(clickedValue);
    },
    [handleValueChange, onComplete]
  );

  const handleTouchStart = useCallback(() => {
    if (!isDisabled) {
      setIsTouching(true);
    }
  }, [isDisabled]);

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (isTouching && containerRef.current) {
        const touch = event.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        const range = max - min;
        const newValue = Math.round((percentage * range) / step) * step + min;

        handleValueChange(newValue);
        setHoveredValue(newValue);
      }
    },
    [isTouching, min, max, step, handleValueChange]
  );

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    if (hoveredValue !== null) {
      onComplete?.(hoveredValue);
    }
  }, [hoveredValue, onComplete]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent, itemValue: number) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick(itemValue);
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        const nextValue = Math.min(max, itemValue + step);
        handleClick(nextValue);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        const prevValue = Math.max(min, itemValue - step);
        handleClick(prevValue);
      }
    },
    [handleClick, max, min, step]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        const range = max - min;
        const newValue = Math.round((percentage * range) / step) * step + min;
        handleValueChange(newValue);
        setHoveredValue(newValue);
      }
    },
    [isDragging, min, max, step, handleValueChange]
  );

  const handleTrackClick = useCallback(
    (event: React.MouseEvent) => {
      if (isDisabled) return;

      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        const range = max - min;
        const newValue = Math.round((percentage * range) / step) * step + min;
        handleClick(newValue);
      }
    },
    [isDisabled, min, max, step, handleClick]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", () => {
        setIsDragging(false);
        if (hoveredValue !== null) {
          onComplete?.(hoveredValue);
        }
      });
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", () => setIsDragging(false));
    };
  }, [isDragging, handleMouseMove, hoveredValue, onComplete]);

  useEffect(() => {
    if (isTouching) {
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isTouching, handleTouchMove, handleTouchEnd]);

  const getScaleItems = () => {
    if (options) return options;

    const items: ScaleOption[] = [];
    for (let i = min; i <= max; i += step) {
      const item: ScaleOption = {
        value: i,
        label: i.toString(),
      };

      if (mode !== "numeric") {
        const Icon = defaultIcons[mode as keyof typeof defaultIcons];
        item.icon = <Icon className="w-5 h-5" />;
      }

      items.push(item);
    }
    return items;
  };

  const scaleItems = getScaleItems();
  const activeValue = hoveredValue !== null ? hoveredValue : value;

  const sizeClasses = {
    sm: "h-8 text-sm gap-1",
    md: "h-10 text-base gap-1.5",
    lg: "h-12 text-lg gap-2",
  };

  // לקבוע אם להראות את התיאור - התיאור יוצג רק אם יש ערך פעיל ויש תיאור
  const showDescription =
    activeValue !== null &&
    descriptions &&
    ((activeValue === min && descriptions.min) ||
      (activeValue === max && descriptions.max) ||
      (activeValue === Math.floor((min + max) / 2) && descriptions.middle));

  const getDescription = () => {
    if (activeValue === null || !descriptions) return "";

    if (activeValue === min) return descriptions.min || "";
    if (activeValue === max) return descriptions.max || "";
    if (activeValue === Math.floor((min + max) / 2))
      return descriptions.middle || "";

    if (options) {
      const option = options.find((o) => o.value === activeValue);
      return option?.description || "";
    }

    return "";
  };

  // חישוב אחוז ערך הסולם הנוכחי
  const getValuePercentage = () => {
    if (activeValue === null) return 0;
    return ((activeValue - min) / (max - min)) * 100;
  };

  // אנימציות
  const variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };

  // רכיב שמציג תיאור לערך הנוכחי
  const ValueDescription = () => {
    const description = getDescription();
    if (!description) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 text-sm text-blue-800"
      >
        {description}
      </motion.div>
    );
  };

  // רכיב רמז למשתמש כאשר אין ערך
  const UserHint = () => {
    if (!hintVisible) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center mt-2 text-xs text-blue-600 bg-blue-50 rounded-full py-1 px-3"
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {isMobileDevice ? "לחץ/החלק לבחירת ערך" : "בחר ערך בסולם למעלה"}
      </motion.div>
    );
  };

  return (
    <div
      className={cn(
        "relative space-y-2",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Track Bar - שורה אחידה ברקע */}
      <div
        ref={trackRef}
        className={cn(
          "absolute left-0 right-0 h-2 bg-gray-200 rounded-full top-1/2 -translate-y-1/2 z-0 cursor-pointer",
          isDisabled ? "bg-gray-100" : ""
        )}
        onClick={handleTrackClick}
      ></div>

      {/* Progress Fill Track */}
      {activeValue !== null && (
        <div
          className="absolute left-0 h-2 bg-blue-500 rounded-full top-1/2 -translate-y-1/2 z-0 transition-all duration-150"
          style={{ width: `${getValuePercentage()}%` }}
        ></div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "relative flex items-center justify-between z-10",
          sizeClasses[size]
        )}
        onMouseDown={() => !isDisabled && setIsDragging(true)}
        onTouchStart={handleTouchStart}
      >
        {showLabels && labels && (
          <div className="absolute -top-8 left-0 right-0 flex justify-between text-sm text-gray-600">
            <span>{labels.min}</span>
            {labels.middle && <span>{labels.middle}</span>}
            <span>{labels.max}</span>
          </div>
        )}

        <div className="relative flex-1 flex items-center justify-between">
          <AnimatePresence initial={false}>
            {scaleItems.map((item) => {
              // האם האייטם הנוכחי פעיל (כלומר הערך הנוכחי או קטן ממנו)
              const isActive =
                activeValue !== null && item.value <= activeValue;
              const isHighlighted = item.value === activeValue;
              const isInRange =
                activeValue !== null && item.value <= activeValue;

              return (
                <TooltipProvider key={item.value} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        type="button"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap="tap"
                        className={cn(
                          "relative flex items-center justify-center",
                          "w-8 h-8 rounded-full transition-all duration-150",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
                          isActive
                            ? "bg-blue-500 text-white shadow-sm"
                            : "bg-white border border-gray-300",
                          isHighlighted && "ring-2 ring-blue-500 scale-110",
                          isDisabled && "cursor-not-allowed"
                        )}
                        onClick={() => handleClick(item.value)}
                        onKeyDown={(e) => handleKeyPress(e, item.value)}
                        onMouseEnter={() =>
                          !isDisabled && setHoveredValue(item.value)
                        }
                        onMouseLeave={() => setHoveredValue(null)}
                        disabled={isDisabled}
                        aria-label={`Scale value ${item.value}, ${item.label}`}
                        style={{
                          zIndex: isHighlighted ? 5 : isActive ? 4 : 3,
                        }}
                      >
                        {item.icon || item.label}

                        {/* Animation pulse for highlighted item */}
                        {isHighlighted && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-blue-500 opacity-20"
                            initial={{ scale: 1 }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.2, 0.3, 0.2],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "loop",
                            }}
                          />
                        )}
                      </motion.button>
                    </TooltipTrigger>
                    {showTooltips && (item.description || item.label) && (
                      <TooltipContent>
                        <p>{item.description || `ערך: ${item.label}`}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Touch hint for mobile */}
      <AnimatePresence>{hintVisible && <UserHint />}</AnimatePresence>

      {/* Show Current Value */}
      {showValue && (
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-3 px-4 py-1 rounded-full text-sm font-medium transition-all",
              value !== null
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {value !== null ? (
              <span className="flex items-center">
                <Star className="h-3.5 w-3.5 text-blue-500 mr-1" />
                ערך נבחר: {value}
              </span>
            ) : (
              <span className="flex items-center">
                <Info className="h-3.5 w-3.5 text-gray-500 mr-1" />
                לא נבחר ערך
              </span>
            )}
          </motion.div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-500 mt-1 flex items-center"
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          {error}
        </motion.div>
      )}

      {/* Progress bar showing value relationship to min/max */}
      {value !== null && !isTablet && (
        <div className="pt-2">
          <Progress value={getValuePercentage()} className="h-1" />
        </div>
      )}

      {/* Description for the selected value */}
      <AnimatePresence>
        {showDescription && <ValueDescription />}
      </AnimatePresence>

      {/* Hidden input for form submission */}
      {required && (
        <input
          type="hidden"
          name={name}
          value={value || ""}
          required
          aria-hidden="true"
        />
      )}
    </div>
  );
}
