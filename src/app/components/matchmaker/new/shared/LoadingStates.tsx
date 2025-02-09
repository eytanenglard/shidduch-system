// /shared/LoadingStates.tsx
"use client";

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface LoadingContainerProps {
  children: React.ReactNode;
  className?: string;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface LoadingCardProps {
  count?: number;
  layout?: 'grid' | 'list';
  className?: string;
}

interface LoadingTextProps {
  lines?: number;
  className?: string;
}

interface LoadingErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('relative min-h-[200px]', className)}>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
    </div>
  );
};

export const LoadingCard: React.FC<LoadingCardProps> = ({
  count = 1,
  layout = 'grid',
  className
}) => {
  return (
    <div 
      className={cn(
        layout === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-white rounded-lg overflow-hidden shadow-sm',
            layout === 'list' ? 'flex gap-4' : ''
          )}
        >
          {/* תמונת פרופיל */}
          <Skeleton className={cn(
            'bg-gray-200',
            layout === 'list' ? 'w-32 h-32' : 'w-full h-48'
          )} />

          <div className="p-4 flex-1">
            {/* כותרת */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-6 w-16" />
            </div>

            {/* פרטים */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* כפתורים */}
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LoadingText: React.FC<LoadingTextProps> = ({
  lines = 3,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

export const LoadingError: React.FC<LoadingErrorProps> = ({
  message,
  onRetry,
  className
}) => {
  return (
    <Alert variant="destructive" className={cn('border-red-500', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>שגיאה</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4"
          >
            נסה שוב
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const LoadingStats: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
};

export const LoadingFilters: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24" />
        ))}
      </div>
    </div>
  );
};

export default {
  LoadingContainer,
  LoadingSpinner,
  LoadingCard,
  LoadingText,
  LoadingError,
  LoadingStats,
  LoadingFilters
};