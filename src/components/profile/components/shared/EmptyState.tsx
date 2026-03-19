'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
  // Legacy props (accepted but ignored)
  variant?: string;
  size?: string;
  compact?: boolean;
  THEME?: unknown;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  className,
  action,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center rounded-xl',
      'border border-dashed border-gray-200 bg-gray-50 py-8 px-6',
      className
    )}
  >
    <div className="rounded-full bg-gray-100 p-3 mb-3">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="font-semibold text-gray-700 mb-1 text-base break-words px-2">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed break-words px-2">
        {description}
      </p>
    )}
    {action && (
      <div className="flex flex-wrap justify-center gap-2 mt-4">{action}</div>
    )}
  </div>
);

export default EmptyState;
