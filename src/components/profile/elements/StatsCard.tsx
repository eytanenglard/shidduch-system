// src/components/profile/elements/StatsCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { StatsCardDict } from '@/types/dictionary';

interface StatsCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  dict?: StatsCardDict; // Optional dict for specific cases
  progress?: number;
  trend?: { value: number; label: string; isPositive?: boolean };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  title,
  value,
  dict,
  progress,
  trend,
  variant = 'default',
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'destructive':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-card';
    }
  };

  const isAvailabilityStatus = dict && title === dict.availabilityStatusTitle;
  const isAvailable =
    typeof value === 'string' && value.toLowerCase() === 'available';

  const renderValue = () => {
    if (isAvailabilityStatus && dict) {
      const displayValue = isAvailable
        ? dict.availabilityValue.available
        : dict.availabilityValue.unavailable;
      return (
        <div className="mt-1">
          <span
            className={cn(
              'inline-flex px-3 py-1 rounded-full text-sm font-semibold tracking-wide',
              isAvailable
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            )}
          >
            {displayValue}
          </span>
        </div>
      );
    }
    return <h3 className="text-2xl font-semibold">{value}</h3>;
  };

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-shadow',
        getVariantStyles(),
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {renderValue()}
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-4 space-y-2">
            <Progress
              value={progress}
              className="h-2"
              aria-label={`${title} progress: ${progress}%`}
            />
            <p className="text-sm text-muted-foreground text-right">
              {progress}%
            </p>
          </div>
        )}
        {trend && (
          <div className="mt-4 flex items-center">
            <span
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : '-'}
              {trend.value}%
            </span>
            <span className="text-sm text-muted-foreground mr-2">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
export type { StatsCardProps };
