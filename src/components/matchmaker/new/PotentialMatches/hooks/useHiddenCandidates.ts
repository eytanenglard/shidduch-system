// src/hooks/useHiddenCandidates.ts

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

export interface HiddenCandidateInfo {
  id: string; // ID של רשומת ההסתרה
  candidateId: string;
  reason: string | null;
  hiddenAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    mainImage: string | null;
    gender: 'MALE' | 'FEMALE' | null;
    city: string | null;
    religiousLevel: string | null;
    availabilityStatus: string | null;
  };
}

interface UseHiddenCandidatesReturn {
  // State
  hiddenCandidates: HiddenCandidateInfo[];
  hiddenCandidateIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  hideCandidate: (candidateId: string, reason?: string) => Promise<boolean>;
  unhideCandidate: (hiddenRecordId: string) => Promise<boolean>;
  updateReason: (hiddenRecordId: string, reason: string) => Promise<boolean>;
  refreshHiddenCandidates: () => Promise<void>;
  
  // Helpers
  isHidden: (candidateId: string) => boolean;
  getHiddenRecord: (candidateId: string) => HiddenCandidateInfo | undefined;
}

// =============================================================================
// HOOK
// =============================================================================

export function useHiddenCandidates(): UseHiddenCandidatesReturn {
  const [hiddenCandidates, setHiddenCandidates] = useState<HiddenCandidateInfo[]>([]);
  const [hiddenCandidateIds, setHiddenCandidateIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =============================================================================
  // FETCH HIDDEN CANDIDATES
  // =============================================================================
  const refreshHiddenCandidates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/matchmaker/hidden-candidates');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch hidden candidates');
      }

      setHiddenCandidates(data.hiddenCandidates);
      setHiddenCandidateIds(new Set(data.hiddenCandidates.map((hc: HiddenCandidateInfo) => hc.candidateId)));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching hidden candidates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshHiddenCandidates();
  }, [refreshHiddenCandidates]);

  // =============================================================================
  // HIDE CANDIDATE
  // =============================================================================
  const hideCandidate = useCallback(async (candidateId: string, reason?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/matchmaker/hidden-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, reason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to hide candidate');
      }

      // Optimistic update
      setHiddenCandidateIds(prev => new Set([...prev, candidateId]));
      
      // Refresh full list
      await refreshHiddenCandidates();

      toast.success(data.message || 'המועמד הוסתר בהצלחה');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`שגיאה בהסתרת המועמד: ${errorMessage}`);
      console.error('Error hiding candidate:', err);
      return false;
    }
  }, [refreshHiddenCandidates]);

  // =============================================================================
  // UNHIDE CANDIDATE
  // =============================================================================
  const unhideCandidate = useCallback(async (hiddenRecordId: string): Promise<boolean> => {
    try {
      // Find the candidate ID before deletion for optimistic update
      const record = hiddenCandidates.find(hc => hc.id === hiddenRecordId);
      const candidateId = record?.candidateId;

      const response = await fetch(`/api/matchmaker/hidden-candidates/${hiddenRecordId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unhide candidate');
      }

      // Optimistic update
      if (candidateId) {
        setHiddenCandidateIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(candidateId);
          return newSet;
        });
        setHiddenCandidates(prev => prev.filter(hc => hc.id !== hiddenRecordId));
      }

      toast.success(data.message || 'המועמד הוחזר לרשימה');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`שגיאה בהחזרת המועמד: ${errorMessage}`);
      console.error('Error unhiding candidate:', err);
      return false;
    }
  }, [hiddenCandidates]);

  // =============================================================================
  // UPDATE REASON
  // =============================================================================
  const updateReason = useCallback(async (hiddenRecordId: string, reason: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/matchmaker/hidden-candidates/${hiddenRecordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update reason');
      }

      // Update local state
      setHiddenCandidates(prev => 
        prev.map(hc => 
          hc.id === hiddenRecordId 
            ? { ...hc, reason } 
            : hc
        )
      );

      toast.success('הסיבה עודכנה בהצלחה');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`שגיאה בעדכון הסיבה: ${errorMessage}`);
      console.error('Error updating reason:', err);
      return false;
    }
  }, []);

  // =============================================================================
  // HELPERS
  // =============================================================================
  const isHidden = useCallback((candidateId: string): boolean => {
    return hiddenCandidateIds.has(candidateId);
  }, [hiddenCandidateIds]);

  const getHiddenRecord = useCallback((candidateId: string): HiddenCandidateInfo | undefined => {
    return hiddenCandidates.find(hc => hc.candidateId === candidateId);
  }, [hiddenCandidates]);

  // =============================================================================
  // RETURN
  // =============================================================================
  return {
    hiddenCandidates,
    hiddenCandidateIds,
    isLoading,
    error,
    hideCandidate,
    unhideCandidate,
    updateReason,
    refreshHiddenCandidates,
    isHidden,
    getHiddenRecord,
  };
}

export default useHiddenCandidates;