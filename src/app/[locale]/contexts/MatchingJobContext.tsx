// ===========================================
// src/app/[locale]/contexts/MatchingJobContext.tsx
// ===========================================
// 🎯 Context גלובלי לניהול Background Matching Jobs
// מעודכן: משתמש ב-useMatchingJob Hook כדי לתמוך בחיפוש וירטואלי ופרמטרים נוספים

'use client';

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import useMatchingJob, { 
  type JobStatus, 
  type SearchMethod, 
  type MatchResult, 
  type JobState,
  type MatchingJobOptions 
} from '@/components/matchmaker/new/hooks/useMatchingJob';

// ============================================================================
// RE-EXPORT TYPES
// ============================================================================
// מייצאים מחדש את הטיפוסים כדי שקומפוננטות אחרות יוכלו להשתמש בהם דרך ה-Context
export type { JobStatus, SearchMethod, MatchResult, JobState, MatchingJobOptions };

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

interface MatchingJobContextType {
  // Current job state
  currentJob: JobState;
  
  // Actions
  startJob: (
    targetUserId: string,
    targetName: string,
    method?: SearchMethod,
    forceRefresh?: boolean,
    extraParams?: MatchingJobOptions // 🆕 הפרמטר החדש לחיפוש וירטואלי
  ) => Promise<string | null>;
  
  cancelJob: () => Promise<void>;
  reset: () => void; // מקביל ל-clearJob
  
  // Computed values
  isJobRunning: boolean;
  isLoading: boolean;
  isComplete: boolean;
  hasResults: boolean;
  isFailed: boolean;
  isIdle: boolean;
  
  // For components that want to listen to completion
  onJobComplete: (callback: (result: any) => void) => () => void;
}

// ============================================================================
// CREATE CONTEXT
// ============================================================================

const MatchingJobContext = createContext<MatchingJobContextType | null>(null);

export const useMatchingJobContext = () => {
  const context = useContext(MatchingJobContext);
  if (!context) {
    throw new Error('useMatchingJobContext must be used within a MatchingJobProvider');
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

export function MatchingJobProvider({ children }: { children: ReactNode }) {
  // ניהול רשימת מאזינים לאירוע סיום (כדי לאפשר מספר קומפוננטות מאזינות במקביל)
  const completionCallbacksRef = useRef<Set<(result: any) => void>>(new Set());

  // שימוש ב-Hook המרכזי שמכיל את כל הלוגיקה (כולל תמיכה ב-extraParams)
  const matchingJob = useMatchingJob({
    onComplete: (result) => {
      // הפעלת כל המאזינים הרשומים ב-Context
      completionCallbacksRef.current.forEach((callback) => {
        try {
          callback(result);
        } catch (err) {
          console.error('[MatchingJobContext] Listener callback error:', err);
        }
      });
    },
    onError: (error) => {
      console.error('[MatchingJobContext] Job failed:', error);
    },
    showToasts: true // הצגת התראות גלובליות
  });

  // פונקציית הרשמה לאירועים (מחזירה פונקציית ניקוי/Unsubscribe)
  const onJobComplete = (callback: (result: any) => void) => {
    completionCallbacksRef.current.add(callback);
    return () => {
      completionCallbacksRef.current.delete(callback);
    };
  };

  // בניית הערך של ה-Context
  const value: MatchingJobContextType = {
    // State
    currentJob: matchingJob.currentJob, // מגיע מה-Hook (תאימות לאחור לשם המשתנה)
    
    // Actions (ה-Hook כבר מכיל את החתימה המעודכנת עם extraParams)
    startJob: matchingJob.startJob,
    cancelJob: matchingJob.cancelJob,
    reset: matchingJob.reset,
    
    // Computed
    isJobRunning: matchingJob.isJobRunning,
    isLoading: matchingJob.isLoading,
    isComplete: matchingJob.isComplete,
    hasResults: matchingJob.hasResults,
    isFailed: matchingJob.isFailed,
    isIdle: matchingJob.isIdle,
    
    // Subscriptions
    onJobComplete
  };

  return (
    <MatchingJobContext.Provider value={value}>
      {children}
    </MatchingJobContext.Provider>
  );
}

export default MatchingJobContext;