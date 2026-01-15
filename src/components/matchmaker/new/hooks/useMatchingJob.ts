// ===========================================
// src/components/matchmaker/new/hooks/useMatchingJob.ts
// ===========================================
// 🎯 Hook לניהול Background Matching Jobs
// כולל polling, progress tracking, והתראות
// מעודכן: תמיכה בחיפוש וירטואלי (Virtual Search)

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
export type SearchMethod = 'algorithmic' | 'vector';

export interface MatchResult {
  userId: string;
  firstName?: string;
  lastName?: string;
  firstPassScore?: number;
  finalScore?: number;
  scoreBreakdown?: {
    religious: number;
    careerFamily: number;
    lifestyle: number;
    ambition: number;
    communication: number;
    values: number;
  };
  shortReasoning?: string;
  detailedReasoning?: string;
  rank?: number;
  backgroundMultiplier?: number;
  backgroundCompatibility?: string;
  similarity?: number;
}

// 🆕 אפשרויות נוספות לחיפוש (עבור חיפוש וירטואלי)
export interface MatchingJobOptions {
  isVirtualSearch?: boolean;
  virtualProfileId?: string;
  virtualProfile?: any;
  gender?: string;
  religiousLevel?: string;
  editedSummary?: string;
}

export interface JobState {
  jobId: string | null;
  targetName: string | null; // 🆕 הוספנו את שם המועמד לסטייט
  status: JobStatus;
  progress: number;
  progressMessage: string;
  result: {
    matches: MatchResult[];
    meta?: any;
  } | null;
  error: string | null;
  fromCache: boolean;
  meta: {
    createdAt?: Date;
    completedAt?: Date;
    matchesFound?: number;
    totalCandidates?: number;
  };
}

export interface UseMatchingJobOptions {
  pollingInterval?: number;      // מרווח בין בדיקות (ברירת מחדל: 3000ms)
  onComplete?: (result: JobState['result']) => void;  // callback כשמסתיים
  onError?: (error: string) => void;                  // callback כשנכשל
  showToasts?: boolean;          // האם להציג התראות (ברירת מחדל: true)
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: JobState = {
  jobId: null,
  targetName: null,
  status: 'idle',
  progress: 0,
  progressMessage: '',
  result: null,
  error: null,
  fromCache: false,
  meta: {}
};

// ============================================================================
// Hook
// ============================================================================

export function useMatchingJob(options: UseMatchingJobOptions = {}) {
  const {
    pollingInterval = 3000,
    onComplete,
    onError,
    showToasts = true
  } = options;

  const [state, setState] = useState<JobState>(initialState);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // ============================================================================
  // Stop Polling
  // ============================================================================
  
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // ============================================================================
  // Poll Job Status
  // ============================================================================
  
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/ai/find-matches-v2?jobId=${jobId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get job status');
      }

      setState(prev => ({
        ...prev,
        status: data.status,
        progress: data.progress || 0,
        progressMessage: data.progressMessage || '',
        result: data.result || null,
        error: data.error || null,
        fromCache: data.fromCache || false,
        meta: {
          createdAt: data.meta?.createdAt ? new Date(data.meta.createdAt) : undefined,
          completedAt: data.meta?.completedAt ? new Date(data.meta.completedAt) : undefined,
          matchesFound: data.meta?.matchesFound,
          totalCandidates: data.meta?.totalCandidates
        }
      }));

      // בדיקה אם Job הסתיים
      if (data.status === 'completed') {
        stopPolling();
        
        if (showToasts) {
          const matchCount = data.result?.matches?.length || data.meta?.matchesFound || 0;
          toast.success(`✅ נמצאו ${matchCount} התאמות!`, {
            description: 'לחץ להצגת התוצאות',
            duration: 10000,
          });
        }
        
        onComplete?.(data.result);
      } 
      else if (data.status === 'failed') {
        stopPolling();
        
        if (showToasts) {
          toast.error('❌ החיפוש נכשל', {
            description: data.error || 'אירעה שגיאה',
            duration: 5000,
          });
        }
        
        onError?.(data.error || 'Unknown error');
      }

    } catch (error) {
      console.error('[useMatchingJob] Poll error:', error);
      // לא עוצרים polling בגלל שגיאת רשת - ננסה שוב
    }
  }, [stopPolling, onComplete, onError, showToasts]);

  // ============================================================================
  // Start Polling
  // ============================================================================
  
  const startPolling = useCallback((jobId: string) => {
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    // בדיקה ראשונה מיידית
    pollJobStatus(jobId);
    
    // התחלת polling
    pollingRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, pollingInterval);
  }, [pollJobStatus, pollingInterval]);

  // ============================================================================
  // Start Job
  // ============================================================================
  
  const startJob = useCallback(async (
    targetUserId: string,
    targetName: string, // 🆕 פרמטר חדש לתצוגה
    method: SearchMethod = 'algorithmic',
    forceRefresh: boolean = false,
    extraParams: MatchingJobOptions = {} // 🆕 פרמטרים לחיפוש וירטואלי
  ): Promise<JobState['jobId']> => {
    // איפוס state
    setState({
      ...initialState,
      targetName, // שמירת השם
      status: 'pending',
      progressMessage: 'מתחיל...'
    });

    try {
      const response = await fetch('/api/ai/find-matches-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserId, 
          method, 
          forceRefresh,
          ...extraParams // 🆕 הוספת הפרמטרים הוירטואליים לבקשה
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start job');
      }

      // עדכון state עם ה-jobId והנתונים הראשוניים
      setState(prev => ({
        ...prev,
        jobId: data.jobId,
        status: data.status,
        progress: data.progress || 0,
        progressMessage: data.progressMessage || '',
        fromCache: data.fromCache || false,
        // אם התקבלו תוצאות מיידיות (כמו בחיפוש וירטואלי או מטמון)
        result: data.result || null,
        meta: {
          ...prev.meta,
          completedAt: data.meta?.completedAt ? new Date(data.meta.completedAt) : undefined,
          matchesFound: data.matchesFound,
          totalCandidates: data.meta?.totalCandidates
        }
      }));

      // תרחיש 1: תוצאה מיידית (מטמון או חיפוש וירטואלי מהיר)
      if (data.status === 'completed' && (data.result || data.matchesFound >= 0)) {
        
        if (showToasts) {
          const matchCount = data.result?.matches?.length || data.matchesFound || 0;
          const msg = data.fromCache ? 'נטענו תוצאות מהזיכרון' : 'החיפוש הסתיים בהצלחה';
          
          toast.success(`✅ ${msg}`, {
            description: `נמצאו ${matchCount} התאמות`,
            duration: 5000,
          });
        }

        // אם יש תוצאות, נקרא ל-callback
        if (data.result) {
            onComplete?.(data.result);
        } else if (data.matchesFound >= 0) {
            // לפעמים בווירטואלי התוצאות מגיעות ישירות
             onComplete?.({ matches: data.result || [] });
        }
        
        return data.jobId;
      }

      // תרחיש 2: חיפוש ארוך - מתחילים polling
      if (showToasts) {
        toast.info('🔍 החיפוש התחיל', {
          description: 'זה עשוי לקחת כמה דקות',
          duration: 3000,
        });
      }

      startPolling(data.jobId);
      return data.jobId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage
      }));

      if (showToasts) {
        toast.error('❌ שגיאה בהפעלת החיפוש', {
          description: errorMessage,
        });
      }

      onError?.(errorMessage);
      throw error;
    }
  }, [startPolling, onComplete, onError, showToasts]);

  // ============================================================================
  // Cancel Job
  // ============================================================================
  
  const cancelJob = useCallback(async () => {
    stopPolling();

    if (state.jobId) {
      try {
        await fetch(`/api/ai/find-matches-v2?jobId=${state.jobId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('[useMatchingJob] Cancel error:', error);
      }
    }

    setState(initialState);
    
    if (showToasts) {
      toast.info('החיפוש בוטל');
    }
  }, [state.jobId, stopPolling, showToasts]);

  // ============================================================================
  // Reset
  // ============================================================================
  
  const reset = useCallback(() => {
    stopPolling();
    setState(initialState);
  }, [stopPolling]);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================
  
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // ============================================================================
  // Return
  // ============================================================================
  
  return {
    // State
    ...state,
    
    // Computed props
    currentJob: state, // תאימות לאחור
    isJobRunning: state.status === 'pending' || state.status === 'processing',
    isLoading: state.status === 'pending' || state.status === 'processing', // Alias
    isComplete: state.status === 'completed',
    hasResults: state.result !== null && state.result.matches.length > 0, // תאימות לאחור
    isFailed: state.status === 'failed',
    isIdle: state.status === 'idle',
    hasResult: state.result !== null && state.result.matches.length > 0,
    
    // Actions
    startJob,
    cancelJob,
    reset,
    
    // For debugging
    _state: state
  };
}

// ============================================================================
// Export default
// ============================================================================

export default useMatchingJob;