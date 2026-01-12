// ===========================================
// src/components/matching/MatchingJobStatus.tsx
// ===========================================
// 🎯 קומפוננטות להצגת סטטוס Job
// כולל Progress Bar, Banner, ו-Notification

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  Sparkles,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { JobStatus, SearchMethod, MatchResult } from './hooks/useMatchingJob';

// ============================================================================
// Progress Bar Component
// ============================================================================

interface MatchingProgressBarProps {
  progress: number;
  progressMessage: string;
  method: SearchMethod;
  isLoading: boolean;
  onCancel?: () => void;
  className?: string;
}

export const MatchingProgressBar: React.FC<MatchingProgressBarProps> = ({
  progress,
  progressMessage,
  method,
  isLoading,
  onCancel,
  className
}) => {
  if (!isLoading) return null;

  const isVector = method === 'vector';
  const gradientClass = isVector 
    ? 'from-blue-500 to-cyan-500' 
    : 'from-purple-500 to-pink-500';
  const bgClass = isVector ? 'bg-blue-50' : 'bg-purple-50';
  const Icon = isVector ? Zap : Brain;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'rounded-xl p-4 border shadow-lg',
        bgClass,
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-2 rounded-lg bg-gradient-to-r text-white',
            gradientClass
          )}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {isVector ? 'חיפוש מהיר' : 'ניתוח מתקדם'}
            </p>
            <p className="text-sm text-gray-500">{progressMessage}</p>
          </div>
        </div>
        
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="relative">
        <Progress 
          value={progress} 
          className="h-3 bg-gray-200"
        />
        <motion.div
          className={cn(
            'absolute inset-0 h-3 rounded-full bg-gradient-to-r opacity-30',
            gradientClass
          )}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
          style={{ width: '50%' }}
        />
      </div>

      <div className="flex justify-between mt-2 text-sm text-gray-500">
        <span>{progress}%</span>
        <span className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          מעבד...
        </span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Completion Banner Component
// ============================================================================

interface MatchingCompleteBannerProps {
  matchesCount: number;
  totalCandidates?: number;
  fromCache: boolean;
  completedAt?: Date;
  onViewResults: () => void;
  onDismiss: () => void;
  className?: string;
}

export const MatchingCompleteBanner: React.FC<MatchingCompleteBannerProps> = ({
  matchesCount,
  totalCandidates,
  fromCache,
  completedAt,
  onViewResults,
  onDismiss,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        'rounded-xl p-4 bg-gradient-to-r from-green-50 to-emerald-50',
        'border border-green-200 shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-green-500 text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          
          <div>
            <h3 className="font-bold text-green-800 text-lg">
              הושלם! נמצאו {matchesCount} התאמות
            </h3>
            
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-green-600">
              {totalCandidates && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  נסרקו {totalCandidates} מועמדים
                </span>
              )}
              
              {fromCache && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-4 h-4" />
                  מהזיכרון
                </span>
              )}
              
              {completedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTimeAgo(completedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          onClick={onViewResults}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
        >
          <Sparkles className="w-4 h-4 ml-2" />
          הצג תוצאות
        </Button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Error Banner Component
// ============================================================================

interface MatchingErrorBannerProps {
  error: string;
  onRetry?: () => void;
  onDismiss: () => void;
  className?: string;
}

export const MatchingErrorBanner: React.FC<MatchingErrorBannerProps> = ({
  error,
  onRetry,
  onDismiss,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'rounded-xl p-4 bg-red-50 border border-red-200 shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-500 text-white">
            <XCircle className="w-5 h-5" />
          </div>
          
          <div>
            <h3 className="font-bold text-red-800">החיפוש נכשל</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {onRetry && (
        <div className="mt-4">
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            נסה שוב
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// Floating Notification Component
// ============================================================================

interface MatchingNotificationProps {
  status: JobStatus;
  matchesCount?: number;
  progressMessage?: string;
  progress?: number;
  onViewResults?: () => void;
  onDismiss: () => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export const MatchingNotification: React.FC<MatchingNotificationProps> = ({
  status,
  matchesCount = 0,
  progressMessage,
  progress = 0,
  onViewResults,
  onDismiss,
  position = 'bottom-right'
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4'
  };

  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={cn(
        'fixed z-50 w-80 rounded-xl shadow-2xl border overflow-hidden',
        positionClasses[position],
        status === 'completed' ? 'bg-white border-green-200' :
        status === 'failed' ? 'bg-white border-red-200' :
        'bg-white border-gray-200'
      )}
    >
      {/* Header */}
      <div 
        className={cn(
          'p-3 flex items-center justify-between cursor-pointer',
          status === 'completed' ? 'bg-green-50' :
          status === 'failed' ? 'bg-red-50' :
          'bg-gray-50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {status === 'processing' || status === 'pending' ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          ) : status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          
          <span className="font-medium">
            {status === 'processing' || status === 'pending' ? 'מחפש התאמות...' :
             status === 'completed' ? `נמצאו ${matchesCount} התאמות!` :
             'החיפוש נכשל'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {(status === 'processing' || status === 'pending') && (
                <>
                  <Progress value={progress} className="h-2 mb-2" />
                  <p className="text-sm text-gray-500">{progressMessage || 'מעבד...'}</p>
                  <p className="text-xs text-gray-400 mt-1">{progress}%</p>
                </>
              )}

              {status === 'completed' && (
                <Button
                  onClick={onViewResults}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  הצג תוצאות
                </Button>
              )}

              {status === 'failed' && (
                <p className="text-sm text-red-600">
                  אירעה שגיאה בחיפוש. נסה שוב מאוחר יותר.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  
  return date.toLocaleDateString('he-IL');
}

// ============================================================================
// Export All
// ============================================================================

export default {
  MatchingProgressBar,
  MatchingCompleteBanner,
  MatchingErrorBanner,
  MatchingNotification
};
