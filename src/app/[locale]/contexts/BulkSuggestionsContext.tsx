// ============================================================================
// src/app/[locale]/contexts/BulkSuggestionsContext.tsx
// ============================================================================
// 🎯 Context גלובלי לשליחת הצעות שידוך ברקע
// מאפשר לסגור את הדיאלוג בזמן שההצעות נשלחות
// ============================================================================

'use client';

import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type BulkSendStatus = 'idle' | 'sending' | 'done';
export type ItemResult = 'success' | 'error' | 'blocked';

export interface BulkSuggestionPayload {
  firstPartyId: string;
  secondPartyId: string;
  secondPartyName: string;
  priority: string;
  decisionDeadline: Date;
  firstPartyLanguage: string;
  secondPartyLanguage: string;
  notes?: Record<string, string>;
}

export interface BulkSendJob {
  id: string;
  firstPartyName: string;
  items: BulkSuggestionPayload[];
  status: BulkSendStatus;
  progress: number;
  total: number;
  results: Record<string, ItemResult>;
  startedAt: Date;
}

interface BulkSuggestionsContextType {
  // Current job state
  currentJob: BulkSendJob | null;
  
  // Actions
  startBulkSend: (
    firstPartyName: string,
    items: BulkSuggestionPayload[]
  ) => void;
  
  // Computed
  isSending: boolean;
  lastResults: Record<string, ItemResult> | null;
  
  // Clear completed job
  clearJob: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const BulkSuggestionsContext = createContext<BulkSuggestionsContextType | null>(null);

export const useBulkSuggestionsContext = () => {
  const context = useContext(BulkSuggestionsContext);
  if (!context) {
    throw new Error('useBulkSuggestionsContext must be used within BulkSuggestionsProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export function BulkSuggestionsProvider({ children }: { children: ReactNode }) {
  const [currentJob, setCurrentJob] = useState<BulkSendJob | null>(null);
  const abortRef = useRef(false);

  const startBulkSend = useCallback(
    (firstPartyName: string, items: BulkSuggestionPayload[]) => {
      if (items.length === 0) {
        toast.error('אין הצעות לשליחה');
        return;
      }

      abortRef.current = false;

      const jobId = Date.now().toString();
      const job: BulkSendJob = {
        id: jobId,
        firstPartyName,
        items,
        status: 'sending',
        progress: 0,
        total: items.length,
        results: {},
        startedAt: new Date(),
      };

      setCurrentJob(job);

      // הצגת toast עם progress - נשאר גלוי גם אחרי סגירת הדיאלוג
      const toastId = toast.loading(
        `שולח ${items.length} הצעות עבור ${firstPartyName}...`,
        {
          duration: Infinity,
          position: 'bottom-left',
        }
      );

      // רץ ברקע - לא חוסם את ה-UI
      (async () => {
        const results: Record<string, ItemResult> = {};

        for (let i = 0; i < items.length; i++) {
          if (abortRef.current) break;

          const item = items[i];

          try {
            const res = await fetch('/api/matchmaker/suggestions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstPartyId: item.firstPartyId,
                secondPartyId: item.secondPartyId,
                priority: item.priority,
                decisionDeadline: item.decisionDeadline,
                firstPartyLanguage: item.firstPartyLanguage,
                secondPartyLanguage: item.secondPartyLanguage,
                notes: item.notes ?? {},
              }),
            });

            if (res.ok) {
              results[item.secondPartyId] = 'success';
            } else {
              const err = await res.json().catch(() => ({}));
              const msg: string = err?.error ?? '';
              results[item.secondPartyId] =
                msg.includes('הצעה פעילה') ? 'blocked' : 'error';
            }
          } catch {
            results[item.secondPartyId] = 'error';
          }

          // עדכון progress
          const progress = i + 1;
          setCurrentJob((prev) =>
            prev
              ? { ...prev, progress, results: { ...results } }
              : null
          );

          toast.loading(
            `שולח הצעות... ${progress}/${items.length} (${item.secondPartyName})`,
            { id: toastId }
          );
        }

        // סיום
        const successCount = Object.values(results).filter((r) => r === 'success').length;
        const blockedCount = Object.values(results).filter((r) => r === 'blocked').length;
        const errorCount = Object.values(results).filter((r) => r === 'error').length;

        setCurrentJob((prev) =>
          prev ? { ...prev, status: 'done', results: { ...results } } : null
        );

        // הודעת סיום
        if (successCount > 0 && errorCount === 0 && blockedCount === 0) {
          toast.success(`${successCount} הצעות נשלחו בהצלחה עבור ${firstPartyName}! 💌`, {
            id: toastId,
            duration: 5000,
          });
        } else if (successCount > 0) {
          const parts: string[] = [`${successCount} הצלחות`];
          if (blockedCount) parts.push(`${blockedCount} חסומות`);
          if (errorCount) parts.push(`${errorCount} שגיאות`);
          toast.warning(`${firstPartyName}: ${parts.join(' · ')}`, {
            id: toastId,
            duration: 6000,
          });
        } else {
          toast.error(`שליחת ההצעות נכשלה עבור ${firstPartyName}. נסה שוב.`, {
            id: toastId,
            duration: 5000,
          });
        }
      })();
    },
    []
  );

  const clearJob = useCallback(() => {
    abortRef.current = true;
    setCurrentJob(null);
  }, []);

  const value: BulkSuggestionsContextType = {
    currentJob,
    startBulkSend,
    isSending: currentJob?.status === 'sending',
    lastResults: currentJob?.status === 'done' ? currentJob.results : null,
    clearJob,
  };

  return (
    <BulkSuggestionsContext.Provider value={value}>
      {children}
    </BulkSuggestionsContext.Provider>
  );
}

export default BulkSuggestionsContext;