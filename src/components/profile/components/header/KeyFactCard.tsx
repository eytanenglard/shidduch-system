'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface KeyFactCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'rose' | 'amber' | 'purple';
  compact?: boolean;
}

const KeyFactCard: React.FC<KeyFactCardProps> = ({
  icon: Icon,
  label,
  value,
  color,
  compact = false,
}) => {
  const colorClasses = {
    rose: 'border-rose-200/50 hover:border-rose-300',
    amber: 'border-amber-200/50 hover:border-amber-300',
    purple: 'border-purple-200/50 hover:border-purple-300',
  };

  const iconColors = {
    rose: 'text-rose-500',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  };

  return (
    <div
      className={cn(
        'flex items-center bg-white/80 backdrop-blur-sm rounded-xl border shadow-sm hover:shadow-md transition-all duration-300',
        compact
          ? 'gap-2 p-2 min-w-[80px] max-w-[110px]'
          : 'gap-2 sm:gap-3 p-2 sm:p-3 min-w-[100px] max-w-[130px] sm:min-w-[120px] sm:max-w-[150px]',
        colorClasses[color],
        'flex-shrink'
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'flex-shrink-0',
          compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5',
          iconColors[color]
        )}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p
          className={cn(
            'font-medium text-gray-500 leading-tight',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'font-semibold text-gray-800 break-words overflow-wrap-anywhere word-break-break-word leading-tight',
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default KeyFactCard;
