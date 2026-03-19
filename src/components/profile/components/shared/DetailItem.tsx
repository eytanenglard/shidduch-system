'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
  placeholder?: string;
  valueClassName?: string;
  // Legacy props (accepted but ignored)
  iconColorClass?: string;
  tooltip?: string;
  variant?: string;
  size?: string;
  textAlign?: string;
  responsive?: boolean;
  useMobileLayout?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({
  icon: Icon,
  label,
  value,
  className,
  placeholder,
  valueClassName,
}) => (
  <div className={cn('flex items-start gap-3 py-2', className)}>
    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd
        className={cn(
          'text-sm font-medium text-gray-800 break-words overflow-wrap-anywhere',
          valueClassName
        )}
      >
        {value || (
          <span className="text-gray-400 italic text-xs">{placeholder}</span>
        )}
      </dd>
    </div>
  </div>
);

export default DetailItem;
