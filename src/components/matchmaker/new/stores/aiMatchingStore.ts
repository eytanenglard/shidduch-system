// Store for AI matching state: target candidate, matches, comparison, existing suggestions
import { create } from 'zustand';
import type { SetStateAction } from 'react';
import type { Candidate } from '../types/candidates';
import type { AiMatch, ScoreBreakdown, BackgroundCompatibility } from '../types/shared';

// Re-export for consumers that import from store
export type { AiMatch, ScoreBreakdown, BackgroundCompatibility };

interface AiMatchingState {
  aiTargetCandidate: Candidate | null;
  aiMatches: AiMatch[];
  isAiLoading: boolean;
  comparisonSelection: Record<string, Candidate>;
  existingSuggestions: Record<string, { status: string; createdAt: string }>;
}

interface AiMatchingActions {
  setAiTarget: (candidate: Candidate | null) => void;
  clearAiTarget: () => void;
  setAiMatches: (matches: SetStateAction<AiMatch[]>) => void;
  setIsAiLoading: (loading: SetStateAction<boolean>) => void;
  toggleComparison: (candidate: Candidate) => void;
  clearComparison: () => void;
  setExistingSuggestions: (
    suggestions: Record<string, { status: string; createdAt: string }>
  ) => void;
}

export const useAiMatchingStore = create<AiMatchingState & AiMatchingActions>(
  (set) => ({
    // Initial state
    aiTargetCandidate: null,
    aiMatches: [],
    isAiLoading: false,
    comparisonSelection: {},
    existingSuggestions: {},

    // Actions
    setAiTarget: (candidate) =>
      set({
        aiTargetCandidate: candidate,
        aiMatches: [],
        comparisonSelection: {},
        existingSuggestions: {},
      }),

    clearAiTarget: () =>
      set({
        aiTargetCandidate: null,
        aiMatches: [],
        comparisonSelection: {},
        existingSuggestions: {},
      }),

    setAiMatches: (matches) =>
      set((state) => ({
        aiMatches:
          typeof matches === 'function' ? matches(state.aiMatches) : matches,
      })),
    setIsAiLoading: (loading) =>
      set((state) => ({
        isAiLoading:
          typeof loading === 'function' ? loading(state.isAiLoading) : loading,
      })),

    toggleComparison: (candidate) =>
      set((state) => {
        const newSelection = { ...state.comparisonSelection };
        if (newSelection[candidate.id]) {
          delete newSelection[candidate.id];
        } else {
          newSelection[candidate.id] = candidate;
        }
        return { comparisonSelection: newSelection };
      }),

    clearComparison: () => set({ comparisonSelection: {} }),

    setExistingSuggestions: (suggestions) =>
      set({ existingSuggestions: suggestions }),
  })
);
