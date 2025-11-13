// src/components/questionnaire/common/InteractiveScale.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Star, Heart, ThumbsUp } from 'lucide-react';
import type { InteractiveScaleDict } from '@/types/dictionary';

// הגדרות הצבעים הדינמיות עבור כל עולם
type ThemeColor = 'sky' | 'rose' | 'purple' | 'teal' | 'amber';

const getThemeConfig = (themeColor: ThemeColor) => {
  const themes = {
    sky: {
      gradientStyle:
        'linear-gradient(to right, rgb(34 211 238), rgb(14 165 233), rgb(59 130 246))',
    },
    rose: {
      gradientStyle:
        'linear-gradient(to right, rgb(251 113 133), rgb(236 72 153), rgb(239 68 68))',
    },
    purple: {
      gradientStyle:
        'linear-gradient(to right, rgb(192 132 252), rgb(139 92 246), rgb(99 102 241))',
    },
    teal: {
      gradientStyle:
        'linear-gradient(to right, rgb(45 212 191), rgb(16 185 129), rgb(34 197 94))',
    },
    amber: {
      gradientStyle:
        'linear-gradient(to right, rgb(251 191 36), rgb(249 115 22), rgb(234 179 8))',
    },
  };
  return themes[themeColor] || themes.sky;
};

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
  labels?: { min: string; max: string; middle?: string };
  descriptions?: { min?: string; max?: string; middle?: string };
  options?: ScaleOption[];
  mode?: 'numeric' | 'icons' | 'hearts' | 'stars' | 'thumbs';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showValue?: boolean;
  showTooltips?: boolean;
  isDisabled?: boolean;
  className?: string;
  required?: boolean;
  name?: string;
  error?: string;
  ariaLabelledby?: string;
  dict: InteractiveScaleDict;
  themeColor?: ThemeColor;
}

const defaultIcons = { stars: Star, hearts: Heart, thumbs: ThumbsUp };

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
  mode = 'numeric',
  size = 'md',
  showLabels = true,
  showValue = true,
  showTooltips = true,
  isDisabled = false,
  className = '',
  required = false,
  name,
  error,
  dict,
  themeColor = 'sky',
}: InteractiveScaleProps) {
  const [internalValue, setInternalValue] = useState<number | null>(
    defaultValue || null
  );
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const theme = getThemeConfig(themeColor);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = useCallback(
    (newValue: number) => {
      if (!isDisabled) {
        setInternalValue(newValue);
        onChange?.(newValue);
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

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent, itemValue: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick(itemValue);
      }
    },
    [handleClick]
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

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
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

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
      window.addEventListener('touchend', () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
      window.removeEventListener('touchend', () => setIsDragging(false));
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  const getScaleItems = () => {
    if (options) return options;
    const items: ScaleOption[] = [];
    for (let i = min; i <= max; i += step) {
      const item: ScaleOption = { value: i, label: i.toString() };
      if (mode !== 'numeric') {
        const Icon = defaultIcons[mode as keyof typeof defaultIcons];
        item.icon = <Icon className="w-4 h-4 sm:w-5 sm:h-5" />;
      }
      items.push(item);
    }
    return items;
  };

  const scaleItems = getScaleItems();
  const activeValue = hoveredValue !== null ? hoveredValue : value;

  // גודלים רספונסיביים - קטן יותר במובייל
  const sizeClasses = {
    sm: 'h-7 sm:h-8 text-xs sm:text-sm',
    md: 'h-8 sm:h-10 text-sm sm:text-base',
    lg: 'h-10 sm:h-12 text-base sm:text-lg',
  };

  return (
    <div
      className={cn(
        'relative space-y-2 w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          'relative flex items-center justify-between',
          // רווחים דינמיים לפי מספר הפריטים
          scaleItems.length <= 5 ? 'gap-2 sm:gap-3' : 'gap-0.5 sm:gap-1',
          sizeClasses[size]
        )}
        onMouseDown={() => !isDisabled && setIsDragging(true)}
        onTouchStart={() => !isDisabled && setIsDragging(true)}
      >
        {showLabels && labels && (
          <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs sm:text-sm text-gray-500 px-1">
            <span className="text-right">{labels.min}</span>
            {labels.middle && (
              <span className="hidden sm:inline">{labels.middle}</span>
            )}
            <span className="text-left">{labels.max}</span>
          </div>
        )}
        <div className="relative flex-1 flex items-center justify-between w-full">
          <AnimatePresence>
            {scaleItems.map((item) => (
              <TooltipProvider key={item.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      style={
                        activeValue !== null && item.value <= activeValue
                          ? { background: theme.gradientStyle }
                          : undefined
                      }
                      className={cn(
                        'relative flex items-center justify-center',
                        // גודלים דינמיים לפי מספר פריטים
                        scaleItems.length <= 5
                          ? 'w-10 h-10 sm:w-12 sm:h-12'
                          : scaleItems.length <= 7
                            ? 'w-8 h-8 sm:w-10 sm:h-10'
                            : 'w-6 h-6 sm:w-8 sm:h-8',
                        'rounded-full transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-1 sm:focus:ring-offset-2',
                        'active:scale-95 touch-manipulation',
                        // טקסט קטן יותר במובייל לסקיילות ארוכות
                        scaleItems.length > 7 && 'text-xs sm:text-sm',
                        activeValue !== null &&
                          item.value <= activeValue &&
                          'text-white shadow-md',
                        activeValue !== null &&
                          item.value > activeValue &&
                          'bg-gray-200 hover:bg-gray-300',
                        isDisabled && 'cursor-not-allowed'
                      )}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleClick(item.value);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        handleClick(item.value);
                      }}
                      onKeyDown={(e) => handleKeyPress(e, item.value)}
                      onMouseEnter={() =>
                        !isDisabled && setHoveredValue(item.value)
                      }
                      onMouseLeave={() => setHoveredValue(null)}
                      disabled={isDisabled}
                      aria-label={dict.ariaLabel.replace(
                        '{{value}}',
                        item.value.toString()
                      )}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.icon || item.label}
                    </motion.button>
                  </TooltipTrigger>
                  {showTooltips && item.description && (
                    <TooltipContent>
                      <p className="text-xs sm:text-sm">{item.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </AnimatePresence>
        </div>
      </div>
      {showValue && value !== null && (
        <div className="text-center text-xs sm:text-sm text-gray-500 mt-2">
          {dict.selectedValue.replace('{{value}}', value.toString())}
        </div>
      )}
      {error && (
        <div className="text-xs sm:text-sm text-red-500 mt-1">{error}</div>
      )}
      {required && (
        <input
          type="hidden"
          name={name}
          value={value || ''}
          required
          aria-hidden="true"
        />
      )}
    </div>
  );
}
