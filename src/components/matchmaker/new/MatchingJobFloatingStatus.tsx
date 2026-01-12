// ===========================================
// src/components/matching/MatchingJobFloatingStatus.tsx
// ===========================================
// 🎯 קומפוננטה צפה שמציגה את סטטוס ה-Job מכל מקום באפליקציה
// נוסיף אותה ל-layout הראשי

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Brain, 
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useMatchingJobContextOptional } from '@/app/[locale]/contexts/MatchingJobContext';
import { usePathname, useRouter } from 'next/navigation';

// ============================================================================
// FLOATING STATUS COMPONENT
// ============================================================================

export const MatchingJobFloatingStatus: React.FC = () => {
  const context = useMatchingJobContextOptional();
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when a new job starts
  useEffect(() => {
    if (context?.isJobRunning) {
      setIsDismissed(false);
      setIsExpanded(true);
    }
  }, [context?.isJobRunning]);

  // Don't render if no context or dismissed
  if (!context) return null;
  
  const { currentJob, isJobRunning, hasResults, cancelJob } = context;

  // Don't show if idle or dismissed
  if (currentJob.status === 'idle' || isDismissed) return null;

  // Don't show on the matchmaker page itself (it has its own UI)
  const isOnMatchmakerPage = pathname?.includes('/matchmaker/clients');
  if (isOnMatchmakerPage && isJobRunning) return null;

  const isVector = currentJob.method === 'vector';
  const Icon = isVector ? Zap : Brain;

  const handleViewResults = () => {
    // Navigate to matchmaker page
    const locale = pathname?.split('/')[1] || 'he';
    router.push(`/${locale}/matchmaker/clients`);
    
    // Dispatch event for the page to scroll to results
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('matching-job-view-results'));
    }, 500);
  };

  const handleDismiss = () => {
    if (currentJob.status === 'completed' || currentJob.status === 'failed') {
      setIsDismissed(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        className={cn(
          'fixed z-[100] bottom-6 left-6 w-80 rounded-xl shadow-2xl border overflow-hidden',
          'bg-white/95 backdrop-blur-sm',
          currentJob.status === 'completed' && 'border-green-200',
          currentJob.status === 'failed' && 'border-red-200',
          isJobRunning && 'border-gray-200'
        )}
      >
        {/* Header */}
        <div 
          className={cn(
            'p-3 flex items-center justify-between cursor-pointer transition-colors',
            currentJob.status === 'completed' && 'bg-green-50',
            currentJob.status === 'failed' && 'bg-red-50',
            isJobRunning && (isVector ? 'bg-blue-50' : 'bg-purple-50')
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {isJobRunning ? (
              <Loader2 className={cn(
                'w-5 h-5 animate-spin',
                isVector ? 'text-blue-600' : 'text-purple-600'
              )} />
            ) : currentJob.status === 'completed' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            
            <div>
              <span className="font-medium text-sm">
                {isJobRunning 
                  ? `מחפש עבור ${currentJob.targetName || 'מועמד'}...`
                  : currentJob.status === 'completed' 
                    ? `נמצאו ${currentJob.result?.matches.length || 0} התאמות!`
                    : 'החיפוש נכשל'
                }
              </span>
              {isJobRunning && (
                <div className="text-xs text-gray-500">
                  {isVector ? 'חיפוש מהיר' : 'AI מתקדם'}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )}
            {(currentJob.status === 'completed' || currentJob.status === 'failed') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
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
              <div className="p-3 space-y-3">
                {/* Progress for running jobs */}
                {isJobRunning && (
                  <>
                    <Progress 
                      value={currentJob.progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{currentJob.progressMessage || 'מעבד...'}</span>
                      <span>{currentJob.progress}%</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelJob}
                      className="w-full text-gray-600"
                    >
                      <X className="w-4 h-4 ml-2" />
                      בטל חיפוש
                    </Button>
                  </>
                )}

                {/* Results for completed jobs */}
                {currentJob.status === 'completed' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>עבור: {currentJob.targetName}</span>
                    </div>
                    <Button
                      onClick={handleViewResults}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    >
                      <Sparkles className="w-4 h-4 ml-2" />
                      הצג תוצאות
                    </Button>
                  </>
                )}

                {/* Error for failed jobs */}
                {currentJob.status === 'failed' && (
                  <p className="text-sm text-red-600">
                    {currentJob.error || 'אירעה שגיאה בחיפוש'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default MatchingJobFloatingStatus;
