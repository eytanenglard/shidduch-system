import { useState, useMemo, useCallback } from 'react';
import type { Candidate } from '../types/candidates';
import type { FilterState } from '../types/filters';

interface UseSmartSegmentsOptions {
  candidates: Candidate[];
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

export function useSmartSegments({ candidates, setFilters, resetFilters }: UseSmartSegmentsOptions) {
  const [activeSmartSegment, setActiveSmartSegment] = useState<string | null>(null);

  const smartSegments = useMemo(() => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    return {
      newThisWeek: candidates.filter(
        (c) => now - new Date(c.createdAt).getTime() <= oneWeek
      ).length,
      waitingForSuggestion: candidates.filter(
        (c) => !c.suggestionStatus && c.isProfileComplete && c.profile.availabilityStatus === 'AVAILABLE'
      ).length,
      incompleteProfile: candidates.filter(
        (c) => !c.isProfileComplete
      ).length,
      activeToday: candidates.filter((c) => {
        const lastActive = c.profile.lastActiveAt
          ? new Date(c.profile.lastActiveAt).getTime()
          : new Date(c.createdAt).getTime();
        return now - lastActive <= oneDay;
      }).length,
    };
  }, [candidates]);

  const handleSmartSegmentClick = useCallback((segment: string) => {
    if (activeSmartSegment === segment) {
      setActiveSmartSegment(null);
      resetFilters();
      return;
    }
    setActiveSmartSegment(segment);
    switch (segment) {
      case 'newThisWeek':
        setFilters({ lastActiveDays: 7 });
        break;
      case 'waitingForSuggestion':
        setFilters({ hasNoSuggestions: true, availabilityStatus: 'AVAILABLE', isProfileComplete: true });
        break;
      case 'incompleteProfile':
        setFilters({ isProfileComplete: false });
        break;
      case 'activeToday':
        setFilters({ lastActiveDays: 1 });
        break;
    }
  }, [activeSmartSegment, resetFilters, setFilters]);

  return {
    smartSegments,
    activeSmartSegment,
    handleSmartSegmentClick,
  };
}
