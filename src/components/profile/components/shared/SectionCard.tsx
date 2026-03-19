'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  // Legacy props (accepted but ignored for backward compat)
  headerClassName?: string;
  action?: React.ReactNode;
  variant?: string;
  gradient?: string;
  size?: string;
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
}) => (
  <div className={cn('mb-6', className)}>
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 p-5',
        contentClassName
      )}
    >
      {children}
    </div>
  </div>
);

export default SectionCard;
