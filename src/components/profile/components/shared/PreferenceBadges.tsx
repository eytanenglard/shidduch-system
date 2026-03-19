'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface PreferenceBadgesProps {
  title: string;
  icon: React.ElementType;
  values: string[] | undefined;
  translationMap: Record<
    string,
    {
      label: string;
      shortLabel?: string;
      icon: React.ElementType;
      color: string;
    }
  >;
  // Legacy props (accepted but ignored)
  gradientClass?: string;
  compact?: boolean;
  THEME?: unknown;
}

function PreferenceBadges({
  title,
  icon,
  values,
  translationMap,
}: PreferenceBadgesProps) {
  if (!values || values.length === 0) return null;

  const IconComponent = icon;
  return (
    <div className="space-y-3 min-w-0 max-w-full">
      <div className="flex items-center gap-2 min-w-0">
        <IconComponent className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-2 min-w-0 max-w-full">
        {values.map((val) => {
          const itemData = translationMap[val] || {
            label: val,
            icon: Sparkles,
            color: 'text-gray-600',
          };
          return (
            <Badge
              key={val}
              variant="outline"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border-gray-200 text-gray-700 rounded-full"
            >
              <itemData.icon
                className={cn('w-3 h-3 flex-shrink-0', itemData.color)}
              />
              <span className="break-words min-w-0">{itemData.label}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export default PreferenceBadges;
