// ===========================================
// src/components/matchmaker/new/hooks/useMatchingJob.ts
// ===========================================
// 🎯 Hook לניהול Background Matching Jobs
// כולל polling, progress tracking, והתראות
// מעודכן: כולל method ב-JobState ותמיכה בחיפוש וירטואלי

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
export type SearchMethod = 'algorithmic' | 'vector' | 'metrics_v2' | 'hybrid';

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
  targetName: string | null;
  method: SearchMethod;
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
  pollingInterval?: number;
  onComplete?: (result: JobState['result']) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: JobState = {
  jobId: null,
  targetName: null,
  method: 'algorithmic',
  status: 'idle',
  progress: 0,
  progressMessage: '',
  result: null,
  error: null,
  fromCache: false,
  meta: {}
};

// ============================================================================
// Helper: Check if result has matches
// ============================================================================

function hasValidMatches(result: JobState['result']): boolean {
  return result !== null && 
         Array.isArray(result.matches) && 
         result.matches.length > 0;
}

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
  const getEndpoint = (method: SearchMethod) => {
  if (method === 'hybrid') return '/api/ai/hybrid-scan';
  return '/api/ai/find-matches-v2';
};
  const pollJobStatus = useCallback(async (jobId: string, methodToCheck: SearchMethod) => {
    try {
      // 1. קביעת ה-Endpoint הנכון לפי השיטה
      const endpoint = getEndpoint(methodToCheck);
      
      // 2. ביצוע הקריאה לשרת
      const response = await fetch(`${endpoint}?jobId=${jobId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get job status');
      }

      // 3. נרמול מבנה התוצאות (Result Normalization)
      // זה נועד למנוע קריסות אם ה-API מחזיר מערך ישירות או אובייקט עטוף
      let resultData: JobState['result'] = null;
      if (data.result) {
        if (Array.isArray(data.result)) {
          // אם התוצאה היא מערך של התאמות
          resultData = { matches: data.result };
        } else if (data.result.matches) {
          // אם התוצאה היא אובייקט שמכיל מערך matches
          resultData = data.result;
        } else {
          // Fallback למקרה של אובייקט ריק או לא תקין
          resultData = { matches: [] };
        }
      }

      // 4. עדכון ה-State המקומי עם המידע העדכני
      setState(prev => ({
        ...prev,
        status: data.status,
        method: methodToCheck, // שמירה על עקביות השיטה
        progress: data.progress || 0,
        progressMessage: data.progressMessage || '',
        result: resultData,
        error: data.error || null,
        fromCache: data.fromCache || false,
        meta: {
          createdAt: data.meta?.createdAt ? new Date(data.meta.createdAt) : undefined,
          completedAt: data.meta?.completedAt ? new Date(data.meta.completedAt) : undefined,
          // לוקח את מספר ההתאמות מהמטא או מאורך המערך בפועל
          matchesFound: data.meta?.matchesFound ?? (resultData?.matches?.length || 0),
          totalCandidates: data.meta?.totalCandidates
        }
      }));

      // 5. טיפול בסיום מוצלח (Completed)
      if (data.status === 'completed') {
        stopPolling(); // עצירת הבדיקות החוזרות
        
        if (showToasts) {
          const matchCount = resultData?.matches?.length || data.meta?.matchesFound || 0;
          toast.success(`✅ הסריקה הסתיימה בהצלחה!`, {
            description: `נמצאו ${matchCount} התאמות`,
            duration: 5000, // 5 שניות
          });
        }
        
        // הפעלת ה-Callback החיצוני אם קיים
        onComplete?.(resultData);
      } 
      // 6. טיפול בכישלון (Failed)
      else if (data.status === 'failed') {
        stopPolling(); // עצירת הבדיקות החוזרות
        
        if (showToasts) {
          toast.error('❌ החיפוש נכשל', {
            description: data.error || 'אירעה שגיאה בעיבוד',
            duration: 5000,
          });
        }
        
        // הפעלת ה-Callback החיצוני לשגיאות
        onError?.(data.error || 'Unknown error');
      }

    } catch (error) {
      // טיפול בשגיאות רשת או שגיאות בתוך ה-Poll עצמו
      console.error('[useMatchingJob] Poll error:', error);
      // הערה: בדרך כלל לא עוצרים פולינג על שגיאת רשת בודדת כדי להיות חסינים לנפילות רגעיות,
      // אבל אם השגיאה חוזרת על עצמה, הלוגיקה תמשיך לרוץ עד שהמשתמש יבטל או שהדף ייסגר.
    }
  }, [stopPolling, onComplete, onError, showToasts]);


  // ============================================================================
  // Start Polling
  // ============================================================================
  
const startPolling = useCallback((jobId: string, method: SearchMethod) => {
    // מניעת כפילויות בפולינג
    if (isPollingRef.current) return;
    
    isPollingRef.current = true;

    // קריאה ראשונה מיידית (מעבירים גם את ה-method)
    pollJobStatus(jobId, method);
    
    // הגדרת האינטרוול (מעבירים גם את ה-method)
    pollingRef.current = setInterval(() => {
      pollJobStatus(jobId, method);
    }, pollingInterval);
  }, [pollJobStatus, pollingInterval]);


  // ============================================================================
  // Start Job
  // ============================================================================
  
  const startJob = useCallback(async (
    targetUserId: string,
    targetName: string,
    method: SearchMethod = 'algorithmic',
    forceRefresh: boolean = false,
    extraParams: MatchingJobOptions = {}
  ): Promise<JobState['jobId']> => {
    
    // איפוס state
    setState({
      ...initialState,
      targetName,
      method,
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
          ...extraParams 
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start job');
      }

      // 🔧 תיקון: המרת result למבנה הנכון
      let resultData: JobState['result'] = null;
      if (data.result) {
        if (Array.isArray(data.result)) {
          resultData = { matches: data.result };
        } else if (data.result.matches) {
          resultData = data.result;
        } else {
          resultData = { matches: [] };
        }
      }

      // עדכון state עם ה-jobId
      setState(prev => ({
        ...prev,
        jobId: data.jobId,
        status: data.status,
        progress: data.progress || 0,
        progressMessage: data.progressMessage || '',
        fromCache: data.fromCache || false,
        result: resultData,
        meta: {
          ...prev.meta,
          completedAt: data.meta?.completedAt ? new Date(data.meta.completedAt) : undefined,
          matchesFound: data.matchesFound ?? data.meta?.matchesFound,
          totalCandidates: data.meta?.totalCandidates
        }
      }));

      // תרחיש 1: תוצאה מיידית (מ-cache או חיפוש מהיר)
      if (data.status === 'completed') {
        const matchCount = resultData?.matches?.length || data.matchesFound || 0;
        
        if (showToasts) {
          const msg = data.fromCache ? 'נטענו תוצאות מהזיכרון' : 'החיפוש הסתיים בהצלחה';
          toast.success(`✅ ${msg}`, {
            description: `נמצאו ${matchCount} התאמות`,
            duration: 5000,
          });
        }

        onComplete?.(resultData);
        return data.jobId;
      }

      // תרחיש 2: חיפוש ארוך - מתחילים polling
      if (showToasts) {
        toast.info('🔍 החיפוש התחיל', {
          description: 'זה עשוי לקחת כמה דקות',
          duration: 3000,
        });
      }

      startPolling(data.jobId, method); 
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
    currentJob: state,
    isJobRunning: state.status === 'pending' || state.status === 'processing',
    isLoading: state.status === 'pending' || state.status === 'processing',
    isComplete: state.status === 'completed',
    hasResults: hasValidMatches(state.result),
    isFailed: state.status === 'failed',
    isIdle: state.status === 'idle',
    hasResult: hasValidMatches(state.result),
    
    // Actions
    startJob,
    cancelJob,
    reset,
    
    // For debugging
    _state: state
  };
}

export default useMatchingJob;