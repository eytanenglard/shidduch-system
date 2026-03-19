'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'elegant' | 'romantic' | 'highlight';
  gradient?: string;
  size?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  compact?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  contentClassName,
  headerClassName,
  action,
  variant = 'default',
  gradient,
  size = 'md',
  collapsible = false,
  compact = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sizes = {
    sm: {
      card: 'rounded-lg sm:rounded-xl',
      header: 'p-2 sm:p-3',
      content: 'p-2 sm:p-3',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
      iconPadding: 'p-1.5 sm:p-2',
      title: 'text-sm sm:text-base',
      subtitle: 'text-xs sm:text-sm',
      gap: 'gap-2 sm:gap-3',
    },
    md: {
      card: 'rounded-xl sm:rounded-2xl',
      header: compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 md:p-6',
      content: compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 md:p-6',
      icon: 'w-5 h-5 sm:w-6 sm:h-6',
      iconPadding: 'p-2 sm:p-2.5',
      title: 'text-base sm:text-lg md:text-xl',
      subtitle: 'text-sm sm:text-base',
      gap: 'gap-3 sm:gap-4',
    },
    lg: {
      card: 'rounded-2xl',
      header: compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 md:p-8',
      content: compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6 md:p-8',
      icon: 'w-6 h-6 sm:w-7 sm:h-7',
      iconPadding: 'p-2.5 sm:p-3',
      title: 'text-lg sm:text-xl md:text-2xl',
      subtitle: 'text-base sm:text-lg',
      gap: 'gap-4 sm:gap-5',
    },
  };

  const variants = {
    default: {
      card: 'bg-white border-gray-200 shadow-lg hover:shadow-xl',
      header: 'bg-gradient-to-r from-gray-50 to-white border-gray-200',
      headerSm: 'bg-gradient-to-r from-gray-25 to-white border-gray-100',
      iconBg: 'bg-gray-100 border border-gray-200',
      iconColor: 'text-gray-600',
    },
    elegant: {
      card: `bg-white border-amber-200 shadow-xl hover:shadow-2xl`,
      header: `bg-gradient-to-r ${gradient || 'from-amber-50 via-yellow-50 to-orange-50'} border-amber-200`,
      headerSm: `bg-gradient-to-r from-amber-25 via-yellow-25 to-orange-25 border-amber-100`,
      iconBg: `bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-white shadow-md`,
      iconColor: 'text-white',
    },
    romantic: {
      card: `bg-white border-rose-200 shadow-lg hover:shadow-xl`,
      header: `bg-gradient-to-r ${gradient || 'from-rose-50 via-pink-50 to-red-50'} border-rose-200`,
      headerSm: `bg-gradient-to-r from-rose-25 via-pink-25 to-red-25 border-rose-100`,
      iconBg: `bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white shadow-md`,
      iconColor: 'text-white',
    },
    highlight: {
      card: `bg-white border-pink-200 shadow-lg hover:shadow-xl ring-1 ring-pink-100 hover:ring-pink-200`,
      header: `bg-gradient-to-r ${gradient || 'from-pink-500 via-rose-500 to-red-500'} border-pink-200`,
      headerSm: `bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 border-pink-100`,
      iconBg: `bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg`,
      iconColor: 'text-white',
    },
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];
  const iconBgClass =
    (variant === 'elegant' ||
      variant === 'romantic' ||
      variant === 'highlight') &&
    gradient
      ? `bg-gradient-to-r ${gradient} text-white shadow-md`
      : currentVariant.iconBg;

  return (
    <div
      className={cn(
        'border overflow-hidden flex flex-col transition-all duration-300',
        currentSize.card,
        currentVariant.card,
        'max-w-full min-w-0',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b transition-all duration-300',
          currentSize.header,
          'gap-2',
          currentVariant.header,
          'sm:' + currentVariant.headerSm,
          'min-w-0 overflow-hidden',
          headerClassName
        )}
      >
        <div
          className={cn('flex items-center min-w-0 flex-1', 'gap-1 sm:gap-2')}
        >
          {Icon && (
            <div
              className={cn(
                'flex-shrink-0 rounded-lg transition-all duration-300',
                currentSize.iconPadding,
                iconBgClass,
                'hover:scale-110 active:scale-95'
              )}
            >
              <Icon
                className={cn(currentSize.icon, currentVariant.iconColor)}
              />
            </div>
          )}
          <div className="min-w-0 flex-1 overflow-hidden text-center">
            <h3
              className={cn(
                'font-bold leading-tight transition-all duration-300 text-center',
                currentSize.title,
                variant === 'default'
                  ? 'text-gray-800 hover:text-gray-900'
                  : 'text-gray-800',
                'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere max-w-full'
              )}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className={cn(
                  'mt-0.5 opacity-80 transition-all duration-300 text-center',
                  currentSize.subtitle,
                  'text-gray-600 text-center mx-auto',
                  'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere max-w-full'
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-1 h-8 w-8 hover:bg-white/60"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  isCollapsed && 'rotate-180'
                )}
              />
            </Button>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </div>
      <div
        className={cn(
          'transition-all duration-300 overflow-hidden',
          currentSize.content,
          collapsible &&
            isCollapsed &&
            'max-h-0 p-0 md:max-h-none md:p-4 md:sm:p-5 md:md:p-6',
          'min-w-0 max-w-full',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default SectionCard;
