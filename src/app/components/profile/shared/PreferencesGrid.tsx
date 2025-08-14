// src/components/profile/shared/PreferencesGrid.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PreferenceItem {
  value: string;
  label: string;
  icon?: React.ElementType;
}

interface PreferencesGridProps {
  label: string;
  items: PreferenceItem[] | undefined;
  className?: string;
}

const PreferencesGrid: React.FC<PreferencesGridProps> = ({
  label,
  items,
  className,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg bg-slate-50/70 border border-slate-200/80',
        className
      )}
    >
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Badge
              key={item.value}
              variant="secondary"
              className="bg-sky-100 text-sky-800 border-sky-200/80"
            >
              {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
              {item.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default PreferencesGrid;
