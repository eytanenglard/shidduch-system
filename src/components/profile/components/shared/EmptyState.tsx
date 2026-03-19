'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ThemeType } from '../../constants/theme';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  variant?: 'mystery' | 'adventure' | 'discovery' | 'romantic';
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  THEME?: ThemeType;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  className,
  action,
  variant = 'discovery',
  size = 'md',
  compact = false,
  THEME,
}) => {
  const sizes = {
    sm: {
      container: compact ? 'py-4 px-3' : 'py-6 px-4',
      icon: 'w-6 h-6 sm:w-8 sm:h-8',
      iconContainer: 'p-2 sm:p-3',
      title: 'text-sm sm:text-base',
      description: 'text-xs sm:text-sm',
      spacing: 'mb-2 sm:mb-3',
    },
    md: {
      container: compact ? 'py-6 px-4' : 'py-8 px-6',
      icon: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
      iconContainer: 'p-3 sm:p-4',
      title: 'text-base sm:text-lg md:text-xl',
      description: 'text-sm sm:text-base',
      spacing: 'mb-3 sm:mb-4',
    },
    lg: {
      container: compact ? 'py-8 px-6' : 'py-12 px-8',
      icon: 'w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16',
      iconContainer: 'p-4 sm:p-5 md:p-6',
      title: 'text-lg sm:text-xl md:text-2xl',
      description: 'text-base sm:text-lg',
      spacing: 'mb-4 sm:mb-6',
    },
  };

  const variants = useMemo(() => {
    const baseVariants = {
      mystery: {
        bg: `bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100`,
        bgSm: `bg-gradient-to-br from-purple-25 via-violet-25 to-purple-50`,
        border: 'border-purple-200 hover:border-purple-300',
        iconBg: `bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600`,
        iconBgSm: `bg-gradient-to-r from-purple-400 via-violet-400 to-purple-500`,
        textColor: 'text-purple-700 sm:text-purple-800',
        titleColor: 'text-purple-800 sm:text-purple-900',
      },
      adventure: {
        bg: `bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100`,
        bgSm: `bg-gradient-to-br from-emerald-25 via-teal-25 to-green-50`,
        border: 'border-emerald-200 hover:border-emerald-300',
        iconBg: `bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600`,
        iconBgSm: `bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500`,
        textColor: 'text-emerald-700 sm:text-emerald-800',
        titleColor: 'text-emerald-800 sm:text-emerald-900',
      },
      discovery: {
        bg: `bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100`,
        bgSm: `bg-gradient-to-br from-amber-25 via-yellow-25 to-orange-50`,
        border: 'border-amber-200 hover:border-amber-300',
        iconBg: `bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600`,
        iconBgSm: `bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500`,
        textColor: 'text-amber-700 sm:text-amber-800',
        titleColor: 'text-amber-800 sm:text-amber-900',
      },
      romantic: {
        bg: `bg-gradient-to-br from-rose-50 via-pink-50 to-red-100`,
        bgSm: `bg-gradient-to-br from-rose-25 via-pink-25 to-red-50`,
        border: 'border-rose-200 hover:border-rose-300',
        iconBg: `bg-gradient-to-r from-rose-500 via-pink-500 to-red-600`,
        iconBgSm: `bg-gradient-to-r from-rose-400 via-pink-400 to-red-500`,
        textColor: 'text-rose-700 sm:text-rose-800',
        titleColor: 'text-rose-800 sm:text-rose-900',
      },
    };

    if (THEME) {
      return {
        ...baseVariants,
        discovery: {
          bg: `bg-gradient-to-br ${THEME.colors.neutral.warm}`,
          bgSm: `bg-gradient-to-br ${THEME.colors.neutral.warmSm}`,
          border: 'border-gray-200 hover:border-gray-300',
          iconBg: `bg-gradient-to-r ${THEME.colors.primary.main}`,
          iconBgSm: `bg-gradient-to-r ${THEME.colors.primary.mainSm}`,
          textColor: 'text-gray-700 sm:text-gray-800',
          titleColor: 'text-gray-800 sm:text-gray-900',
        },
        romantic: {
          ...baseVariants.romantic,
          iconBg: `bg-gradient-to-r ${THEME.colors.primary.romantic}`,
          iconBgSm: `bg-gradient-to-r ${THEME.colors.primary.romanticSm}`,
        },
      };
    }
    return baseVariants;
  }, [THEME]);

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed transition-all duration-300',
        currentSize.container,
        currentVariant.bg,
        'sm:' + currentVariant.bgSm,
        currentVariant.border,
        'shadow-sm hover:shadow-md',
        'max-w-full overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full transition-all duration-300 hover:scale-110 active:scale-95',
          currentSize.iconContainer,
          currentSize.spacing,
          currentVariant.iconBg,
          THEME
            ? `${THEME.shadows.warm} hover:${THEME.shadows.elegant}`
            : 'shadow-md hover:shadow-lg sm:shadow-lg sm:hover:shadow-xl'
        )}
      >
        <Icon
          className={cn(
            currentSize.icon,
            'text-white transition-all duration-300'
          )}
        />
      </div>

      <h3
        className={cn(
          'font-bold leading-tight',
          currentSize.title,
          currentVariant.titleColor,
          currentSize.spacing,
          'break-words hyphens-auto word-break-break-word max-w-full px-2'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'leading-relaxed max-w-xs mx-auto',
            currentSize.description,
            currentVariant.textColor,
            action ? 'mb-4 sm:mb-6' : '',
            'break-words hyphens-auto word-break-break-word px-2'
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
