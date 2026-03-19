'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
  iconColorClass?: string;
  valueClassName?: string;
  tooltip?: string;
  variant?: 'default' | 'highlight' | 'elegant' | 'romantic';
  size?: 'sm' | 'md' | 'lg';
  textAlign?: 'center' | 'right' | 'left' | 'start' | 'end';
  responsive?: boolean;
  useMobileLayout?: boolean;
  placeholder: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon: Icon,
  label,
  value,
  className,
  iconColorClass = 'text-rose-500',
  valueClassName,
  tooltip,
  variant = 'default',
  size = 'md',
  textAlign = 'center',
  responsive = true,
  useMobileLayout = false,
  placeholder,
}) => {
  const sizes = {
    sm: {
      container: 'p-2 gap-2 sm:p-3 sm:gap-3',
      icon: 'w-6 h-6 sm:w-8 sm:h-8',
      iconPadding: 'p-1 sm:p-1.5',
      text: 'text-xs sm:text-sm',
      label: 'text-xs sm:text-sm',
      value: 'text-xs sm:text-sm',
    },
    md: {
      container: 'p-2 gap-2 sm:p-3 sm:gap-3 md:p-4 md:gap-4',
      icon: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
      iconPadding: 'p-1.5 sm:p-2 md:p-2.5',
      text: 'text-xs sm:text-sm md:text-base',
      label: 'text-xs sm:text-sm md:text-base',
      value: 'text-xs sm:text-sm md:text-base',
    },
    lg: {
      container: 'p-3 gap-3 sm:p-4 sm:gap-4 md:p-5 md:gap-5',
      icon: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14',
      iconPadding: 'p-2 sm:p-2.5 md:p-3',
      text: 'text-sm sm:text-base md:text-lg',
      label: 'text-sm sm:text-base md:text-lg',
      value: 'text-sm sm:text-base md:text-lg',
    },
  };

  const variants = {
    default: {
      card: 'bg-white border border-gray-200 hover:border-rose-300 hover:shadow-md',
      icon: 'bg-rose-50 border border-rose-200',
      iconColor: iconColorClass || 'text-rose-500',
    },
    highlight: {
      card: `bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-rose-200 shadow-sm hover:shadow-md`,
      icon: `bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-sm`,
      iconColor: 'text-white',
    },
    elegant: {
      card: `bg-gradient-to-br from-white via-gray-50 to-neutral-100 border border-amber-200 shadow-md hover:shadow-lg`,
      icon: `bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white shadow-md`,
      iconColor: 'text-white',
    },
    romantic: {
      card: `bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 border border-pink-200 shadow-sm hover:shadow-lg`,
      icon: `bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 text-white shadow-sm`,
      iconColor: 'text-white',
    },
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];
  const textAlignClass = `text-${textAlign}`;

  const content = (
    <div
      className={cn(
        'flex rounded-xl transition-all duration-300',
        'min-w-0 w-full max-w-full overflow-hidden',
        useMobileLayout
          ? 'flex-col items-center text-center gap-2 sm:gap-3'
          : 'items-start',
        currentSize.container,
        currentVariant.card,
        responsive && 'hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
    >
      <div
        className={cn(
          'flex-1 overflow-hidden',
          useMobileLayout ? 'text-center w-full' : 'min-w-0'
        )}
      >
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <div
            className={cn(
              'flex-shrink-0 rounded-lg transition-all duration-300',
              currentSize.iconPadding,
              currentVariant.icon,
              'min-w-fit'
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn(
                currentSize.icon,
                currentVariant.iconColor,
                'transition-all duration-300'
              )}
            />
          </div>
        </div>
        <p
          className={cn(
            'font-semibold mb-1 tracking-wide leading-tight',
            textAlignClass,
            currentSize.label,
            'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
            variant === 'highlight' || variant === 'elegant'
              ? 'text-rose-700 sm:text-gray-700'
              : 'text-gray-600 sm:text-gray-700',
            useMobileLayout && 'px-1'
          )}
        >
          {label}
        </p>
        <div
          className={cn(
            'font-medium leading-relaxed',
            textAlignClass,
            currentSize.value,
            'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere',
            'max-w-full overflow-hidden',
            variant === 'highlight' || variant === 'elegant'
              ? 'text-gray-800 sm:text-gray-900'
              : 'text-gray-700 sm:text-gray-800',
            useMobileLayout && 'px-1',
            valueClassName
          )}
        >
          {value || (
            <span className="text-gray-400 italic text-xs sm:text-sm">
              {placeholder}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (tooltip && responsive) {
    return (
      <Tooltip>
        <TooltipTrigger asChild className="w-full">
          {content}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-center bg-white border border-rose-200 shadow-lg z-50"
          sideOffset={5}
        >
          <p className="text-gray-700 text-sm break-words p-2">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default DetailItem;
