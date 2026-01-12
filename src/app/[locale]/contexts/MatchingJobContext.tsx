// ===========================================
// src/app/[locale]/contexts/MatchingJobContext.tsx
// ===========================================
// 🎯 Context גלובלי לניהול Background Matching Jobs
// מאפשר להמשיך לעבוד בזמן שהחיפוש רץ ולקבל התראות מכל מקום

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type JobStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed';
export type SearchMethod = 'algorithmic' | 'vector';

export interface MatchResult {
  userId: string;
  firstName?: string;
  lastName?: string;
  firstPassScore?: number;
  finalScore?: number;
  score?: number;
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
  reasoning?: string;
  rank?: number;
  backgroundMultiplier?: number;
  backgroundCompatibility?: string;
  similarity?: number;
}

export interface JobState {
  jobId: string | null;
  targetUserId: string | null;
  targetName: string | null;
  method: SearchMethod;
  status: JobStatus;
  progress: number;
  progressMessage: string;
  result: {
    matches: MatchResult[];
    meta?: {
      algorithmVersion?: string;
      totalCandidatesScanned?: number;
      durationMs?: number;
    };
  } | null;
  error: string | null;
  fromCache: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
}

interface MatchingJobContextType {
  // Current job state
  currentJob: JobState;
  
  // Actions
  startJob: (
    targetUserId: string,
    targetName: string,
    method: SearchMethod,
    forceRefresh?: boolean
  ) => Promise<string | null>;
  cancelJob: () => void;
  clearJob: () => void;
  
  // Computed
  isJobRunning: boolean;
  hasResults: boolean;
  
  // For components that want to listen to completion
  onJobComplete: (callback: (result: JobState['result']) => void) => () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialJobState: JobState = {
  jobId: null,
  targetUserId: null,
  targetName: null,
  method: 'algorithmic',
  status: 'idle',
  progress: 0,
  progressMessage: '',
  result: null,
  error: null,
  fromCache: false,
  startedAt: null,
  completedAt: null,
};

// ============================================================================
// CONTEXT
// ============================================================================

const MatchingJobContext = createContext<MatchingJobContextType | null>(null);

export const useMatchingJobContext = () => {
  const context = useContext(MatchingJobContext);
  if (!context) {
    throw new Error('useMatchingJobContext must be used within MatchingJobProvider');
  }
  return context;
};

// Optional hook that doesn't throw if context is missing
export const useMatchingJobContextOptional = () => {
  return useContext(MatchingJobContext);
};

// ============================================================================
// PROVIDER
// ============================================================================

export function MatchingJobProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [currentJob, setCurrentJob] = useState<JobState>(initialJobState);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const completionCallbacksRef = useRef<Set<(result: JobState['result']) => void>>(new Set());

  // ============================================================================
  // STOP POLLING
  // ============================================================================
  
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ============================================================================
  // POLL JOB STATUS
  // ============================================================================
  
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/ai/find-matches-v2?jobId=${jobId}`);
      const data = await response.json();

      if (!data.success) {
        console.error('[MatchingJobContext] Poll error:', data.error);
        return;
      }

      setCurrentJob(prev => ({
        ...prev,
        status: data.status,
        progress: data.progress || 0,
        progressMessage: data.progressMessage || '',
        error: data.error || null,
      }));

      // Job completed
      if (data.status === 'completed') {
        stopPolling();
        
        const result = data.result || null;
        
        setCurrentJob(prev => ({
          ...prev,
          status: 'completed',
          progress: 100,
          result,
          fromCache: data.fromCache || false,
          completedAt: new Date(),
        }));

        // Show global notification
        const matchCount = result?.matches?.length || 0;
        toast.success(`✅ נמצאו ${matchCount} התאמות!`, {
          description: `החיפוש עבור ${currentJob.targetName || 'המועמד'} הושלם`,
          duration: 10000,
          action: {
            label: 'הצג',
            onClick: () => {
              // Scroll to results or navigate
              window.dispatchEvent(new CustomEvent('matching-job-view-results'));
            },
          },
        });

        // Notify all listeners
        completionCallbacksRef.current.forEach(callback => {
          try {
            callback(result);
          } catch (err) {
            console.error('[MatchingJobContext] Callback error:', err);
          }
        });
      } 
      // Job failed
      else if (data.status === 'failed') {
        stopPolling();
        
        setCurrentJob(prev => ({
          ...prev,
          status: 'failed',
          error: data.error || 'Unknown error',
        }));

        toast.error('❌ החיפוש נכשל', {
          description: data.error || 'אירעה שגיאה',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('[MatchingJobContext] Poll error:', error);
      // Don't stop polling on network errors - retry
    }
  }, [stopPolling, currentJob.targetName]);

  // ============================================================================
  // START POLLING
  // ============================================================================
  
  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    
    // Initial poll
    pollJobStatus(jobId);
    
    // Start interval
    pollingRef.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 3000);
  }, [pollJobStatus, stopPolling]);

  // ============================================================================
  // START JOB
  // ============================================================================
  
  const startJob = useCallback(async (
    targetUserId: string,
    targetName: string,
    method: SearchMethod,
    forceRefresh: boolean = false
  ): Promise<string | null> => {
    if (!session?.user?.id) {
      toast.error('יש להתחבר למערכת');
      return null;
    }

    // Cancel any existing job
    stopPolling();

    // Update state
    setCurrentJob({
      ...initialJobState,
      targetUserId,
      targetName,
      method,
      status: 'pending',
      progressMessage: 'מתחיל...',
      startedAt: new Date(),
    });

    try {
      const response = await fetch('/api/ai/find-matches-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, method, forceRefresh }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start job');
      }

      // Update with jobId
      setCurrentJob(prev => ({
        ...prev,
        jobId: data.jobId,
        status: data.status,
        progress: data.progress || 0,
        progressMessage: data.progressMessage || '',
        fromCache: data.fromCache || false,
      }));

      // If got cached result immediately
      if (data.status === 'completed' && data.result) {
        setCurrentJob(prev => ({
          ...prev,
          result: data.result,
          completedAt: new Date(),
        }));

        const matchCount = data.result?.matches?.length || 0;
        toast.success(`✅ נטענו ${matchCount} התאמות מהזיכרון`, {
          duration: 5000,
        });

        // Notify listeners
        completionCallbacksRef.current.forEach(callback => {
          try {
            callback(data.result);
          } catch (err) {
            console.error('[MatchingJobContext] Callback error:', err);
          }
        });

        return data.jobId;
      }

      // Otherwise start polling
      toast.info(`🔍 מחפש התאמות עבור ${targetName}...`, {
        description: 'החיפוש רץ ברקע, תקבל התראה כשיסתיים',
        duration: 4000,
      });

      startPolling(data.jobId);
      return data.jobId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setCurrentJob(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
      }));

      toast.error('❌ שגיאה בהפעלת החיפוש', {
        description: errorMessage,
      });

      return null;
    }
  }, [session?.user?.id, stopPolling, startPolling]);

  // ============================================================================
  // CANCEL JOB
  // ============================================================================
  
  const cancelJob = useCallback(async () => {
    stopPolling();

    if (currentJob.jobId) {
      try {
        await fetch(`/api/ai/find-matches-v2?jobId=${currentJob.jobId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('[MatchingJobContext] Cancel error:', error);
      }
    }

    setCurrentJob(prev => ({
      ...prev,
      status: 'idle',
      progress: 0,
      progressMessage: '',
    }));

    toast.info('החיפוש בוטל');
  }, [currentJob.jobId, stopPolling]);

  // ============================================================================
  // CLEAR JOB
  // ============================================================================
  
  const clearJob = useCallback(() => {
    stopPolling();
    setCurrentJob(initialJobState);
  }, [stopPolling]);

  // ============================================================================
  // SUBSCRIBE TO COMPLETION
  // ============================================================================
  
  const onJobComplete = useCallback((callback: (result: JobState['result']) => void) => {
    completionCallbacksRef.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      completionCallbacksRef.current.delete(callback);
    };
  }, []);

  // ============================================================================
  // CLEANUP ON UNMOUNT
  // ============================================================================
  
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const isJobRunning = currentJob.status === 'pending' || currentJob.status === 'processing';
  const hasResults = currentJob.result !== null && currentJob.result.matches.length > 0;

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const value: MatchingJobContextType = {
    currentJob,
    startJob,
    cancelJob,
    clearJob,
    isJobRunning,
    hasResults,
    onJobComplete,
  };

  return (
    <MatchingJobContext.Provider value={value}>
      {children}
    </MatchingJobContext.Provider>
  );
}

export default MatchingJobContext;
