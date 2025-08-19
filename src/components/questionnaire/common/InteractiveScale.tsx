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
  ariaLabelledby?: string; // הוסף את השורה הזו
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
  ariaLabelledby, // הוסף את השורה הזו
}: InteractiveScaleProps) {
  const [internalValue, setInternalValue] = useState<number | null>(
    defaultValue || null
  );
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => setIsDragging(false));
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', () => setIsDragging(false));
    };
  }, [isDragging, handleMouseMove]);

  const getScaleItems = () => {
    if (options) return options;

    const items: ScaleOption[] = [];
    for (let i = min; i <= max; i += step) {
      const item: ScaleOption = {
        value: i,
        label: i.toString(),
      };

      if (mode !== 'numeric') {
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
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  return (
    <div
      className={cn(
        'relative space-y-2',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          'relative flex items-center justify-between gap-1',
          sizeClasses[size]
        )}
        onMouseDown={() => !isDisabled && setIsDragging(true)}
      >
        {showLabels && labels && (
          <div className="absolute -top-6 left-0 right-0 flex justify-between text-sm text-gray-500">
            <span>{labels.min}</span>
            {labels.middle && <span>{labels.middle}</span>}
            <span>{labels.max}</span>
          </div>
        )}

        <div className="relative flex-1 flex items-center justify-between">
          <AnimatePresence>
            {scaleItems.map((item) => (
              <TooltipProvider key={item.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      className={cn(
                        'relative flex items-center justify-center',
                        'w-8 h-8 rounded-full transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        activeValue !== null &&
                          item.value <= activeValue &&
                          'bg-blue-500 text-white',
                        activeValue !== null &&
                          item.value > activeValue &&
                          'bg-gray-200',
                        isDisabled && 'cursor-not-allowed'
                      )}
                      onClick={() => handleClick(item.value)}
                      onKeyDown={(e) => handleKeyPress(e, item.value)}
                      onMouseEnter={() =>
                        !isDisabled && setHoveredValue(item.value)
                      }
                      onMouseLeave={() => setHoveredValue(null)}
                      disabled={isDisabled}
                      aria-label={`Scale value ${item.value}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      {item.icon || item.label}
                    </motion.button>
                  </TooltipTrigger>
                  {showTooltips && item.description && (
                    <TooltipContent>
                      <p>{item.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {showValue && value !== null && (
        <div className="text-center text-sm text-gray-500">
          {`ערך נבחר: ${value}`}
        </div>
      )}

      {error && <div className="text-sm text-red-500 mt-1">{error}</div>}

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
