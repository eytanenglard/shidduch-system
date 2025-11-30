'use client';

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

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
  dict: MatchmakerPageDictionary['loadingStates'];
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('relative min-h-[200px]', className)}>
      {/* Updated Overlay: Glassmorphism with Teal tint */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-50 rounded-xl transition-all duration-500">
        <div className="relative">
          {/* Background Blob for Spinner */}
          <div className="absolute inset-0 bg-teal-200/50 blur-xl rounded-full animate-pulse"></div>
          <Loader2 className="relative z-10 h-10 w-10 animate-spin text-teal-600" />
        </div>
      </div>
      <div className="opacity-40 pointer-events-none filter blur-[1px]">
        {children}
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2
        // Updated: Blue -> Teal
        className={cn('animate-spin text-teal-600', sizeClasses[size])}
      />
    </div>
  );
};

export const LoadingCard: React.FC<LoadingCardProps> = ({
  count = 1,
  layout = 'grid',
  className,
}) => {
  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          // Updated: Card Styling to match new UI (Shadows, Border, Gradient)
          className={cn(
            'bg-white rounded-3xl overflow-hidden shadow-lg border border-teal-50',
            layout === 'list' ? 'flex gap-4 p-4' : ''
          )}
        >
          <Skeleton
            className={cn(
              // Updated: Gradient Skeleton
              'bg-gradient-to-br from-gray-100 via-teal-50/30 to-gray-100',
              layout === 'list'
                ? 'w-32 h-32 rounded-2xl'
                : 'w-full h-48 rounded-t-3xl rounded-b-none'
            )}
          />
          <div className={cn('flex-1', layout !== 'list' && 'p-6')}>
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-1/3 bg-gray-100" />
              <Skeleton className="h-6 w-20 rounded-full bg-orange-50" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 bg-gray-100" />
              <Skeleton className="h-4 w-1/2 bg-gray-100" />
              <Skeleton className="h-4 w-5/6 bg-gray-100" />
            </div>
            <div className="flex gap-3 mt-6">
              <Skeleton className="h-10 w-28 rounded-xl bg-teal-50" />
              <Skeleton className="h-10 w-28 rounded-xl bg-gray-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const LoadingText: React.FC<LoadingTextProps> = ({
  lines = 3,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4 bg-gray-100 rounded-full',
            index === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

export const LoadingError: React.FC<LoadingErrorProps> = ({
  message,
  onRetry,
  className,
  dict,
}) => {
  return (
    // Updated: Error Alert Styling (Rose/Red)
    <Alert
      variant="destructive"
      className={cn('border-2 border-rose-100 bg-rose-50/50', className)}
    >
      <AlertCircle className="h-5 w-5 text-rose-600" />
      <AlertTitle className="text-rose-800 font-bold">
        {dict.errorTitle}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-2">
        <span className="text-rose-700">{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4 bg-white border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
          >
            {dict.retryButton}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export const LoadingStats: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-2xl shadow-sm border border-teal-50/50"
        >
          <Skeleton className="h-5 w-20 mb-3 bg-gray-100" />
          <Skeleton className="h-10 w-16 bg-gradient-to-r from-teal-50 to-orange-50" />
        </div>
      ))}
    </div>
  );
};

export const LoadingFilters: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-12 w-full rounded-xl bg-gray-50" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-lg bg-gray-50" />
        ))}
      </div>
    </div>
  );
};

const LoadingComponents = {
  LoadingContainer,
  LoadingSpinner,
  LoadingCard,
  LoadingText,
  LoadingError,
  LoadingStats,
  LoadingFilters,
};

export default LoadingComponents;
