'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { ThemeType } from '../../constants/theme';

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
  gradientClass: string;
  compact: boolean;
  THEME: ThemeType;
}

function PreferenceBadges({
  title,
  icon,
  values,
  translationMap,
  gradientClass,
  compact,
  THEME,
}: PreferenceBadgesProps) {
  if (!values || values.length === 0) {
    return null;
  }

  const IconComponent = icon;
  return (
    <div className="space-y-3 sm:space-y-4 min-w-0 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div
          className={cn(
            'flex-shrink-0 rounded-lg',
            compact ? 'p-1.5' : 'p-1.5 sm:p-2',
            `bg-gradient-to-r ${gradientClass}`
          )}
        >
          <IconComponent
            className={cn(
              'text-white',
              compact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
            )}
          />
        </div>
        <h4
          className={cn(
            'font-bold text-gray-800 break-words hyphens-auto word-break-break-word min-w-0 flex-1 overflow-wrap-anywhere',
            compact ? 'text-sm' : 'text-sm sm:text-base'
          )}
        >
          {title}
        </h4>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3 min-w-0 max-w-full">
        {values.map((val) => {
          const itemData = translationMap[val] || {
            label: val,
            shortLabel: val.length > 12 ? val.substring(0, 12) + '...' : val,
            icon: Sparkles,
            color: 'text-gray-600',
          };
          return (
            <Badge
              key={val}
              variant="outline"
              className={cn(
                'flex items-center font-semibold border-2 min-w-0 max-w-full transition-all hover:scale-105 active:scale-95',
                compact
                  ? 'gap-1 px-2 py-1 text-xs'
                  : 'gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm',
                'bg-white hover:bg-gray-50 border-gray-200 hover:border-rose-300',
                THEME.shadows.soft,
                'break-words hyphens-auto word-break-break-word overflow-wrap-anywhere'
              )}
            >
              <itemData.icon
                className={cn(
                  'flex-shrink-0',
                  compact ? 'w-3 h-3' : 'w-3 h-3 sm:w-4 sm:h-4',
                  itemData.color
                )}
              />
              <span className="break-words overflow-hidden min-w-0">
                {compact && itemData.shortLabel
                  ? itemData.shortLabel
                  : itemData.label}
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export default PreferenceBadges;
