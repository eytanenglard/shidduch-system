// src/components/suggestions/hooks/useSuggestions.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { MatchSuggestion } from '@prisma/client';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsDictionary } from '@/types/dictionary';
import { SYSTEM_MATCHMAKER_ID, ACTIVE_PROCESS_STATUSES } from '../constants';

interface UseSuggestionsOptions {
  userId: string;
  suggestionsDict: SuggestionsDictionary;
}

export function useSuggestions({ userId, suggestionsDict }: UseSuggestionsOptions) {
  // --- Core state ---
  const [activeSuggestions, setActiveSuggestions] = useState<ExtendedMatchSuggestion[]>([]);
  const [historySuggestions, setHistorySuggestions] = useState<ExtendedMatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [isUserInActiveProcess, setIsUserInActiveProcess] = useState(false);

  // --- Fetching ---
  const fetchSuggestions = useCallback(
    async (showLoadingState = true) => {
      try {
        if (showLoadingState) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        const [activeResponse, historyResponse] = await Promise.all([
          fetch('/api/suggestions/active'),
          fetch('/api/suggestions/history'),
        ]);

        if (!activeResponse.ok || !historyResponse.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const activeData = await activeResponse.json();
        const historyData = await historyResponse.json();

        if (
          !showLoadingState &&
          activeData.suggestions.length > activeSuggestions.length
        ) {
          setHasNewSuggestions(true);
          toast.success(suggestionsDict.container.toasts.newSuggestionsTitle, {
            description: suggestionsDict.container.toasts.newSuggestionsDescription,
            duration: 5000,
          });
        }

        setActiveSuggestions(activeData.suggestions);
        setHistorySuggestions(historyData.suggestions);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : suggestionsDict.container.main.unknownError;
        setError(
          suggestionsDict.container.main.errorLoading.replace('{error}', errorMessage)
        );
        toast.error(suggestionsDict.container.toasts.errorTitle, {
          description: suggestionsDict.container.toasts.errorDescription,
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeSuggestions.length, suggestionsDict]
  );

  // --- Auto-fetch + polling ---
  useEffect(() => {
    fetchSuggestions();
    const intervalId = setInterval(() => fetchSuggestions(false), 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [userId, fetchSuggestions]);

  // --- Track active process ---
  useEffect(() => {
    const activeProcessStatuses: MatchSuggestion['status'][] = [
      'FIRST_PARTY_APPROVED',
      'SECOND_PARTY_APPROVED',
      'AWAITING_MATCHMAKER_APPROVAL',
      'CONTACT_DETAILS_SHARED',
      'AWAITING_FIRST_DATE_FEEDBACK',
      'THINKING_AFTER_DATE',
      'PROCEEDING_TO_SECOND_DATE',
      'MEETING_PENDING',
      'MEETING_SCHEDULED',
      'MATCH_APPROVED',
      'DATING',
      'ENGAGED',
    ];
    setIsUserInActiveProcess(
      activeSuggestions.some((s) => activeProcessStatuses.includes(s.status))
    );
  }, [activeSuggestions]);

  // --- Derived data ---
  const activeProcessSuggestion = useMemo(
    () => activeSuggestions.find((s) => ACTIVE_PROCESS_STATUSES.includes(s.status as any)) || null,
    [activeSuggestions]
  );

  const interestedSuggestions = useMemo(
    () =>
      activeSuggestions
        .filter((s) => s.status === 'FIRST_PARTY_INTERESTED' && s.firstPartyId === userId)
        .sort((a, b) => ((a as any).firstPartyRank ?? 999) - ((b as any).firstPartyRank ?? 999)),
    [activeSuggestions, userId]
  );

  const nonInterestedActiveSuggestions = useMemo(
    () =>
      activeSuggestions.filter(
        (s) =>
          s.status !== 'FIRST_PARTY_INTERESTED' &&
          !ACTIVE_PROCESS_STATUSES.includes(s.status as any)
      ),
    [activeSuggestions]
  );

  const sortedActiveSuggestions = useMemo(() => {
    const urgent: ExtendedMatchSuggestion[] = [];
    const others: ExtendedMatchSuggestion[] = [];

    nonInterestedActiveSuggestions.forEach((s) => {
      const isFirstParty = s.firstPartyId === userId;
      const isMyTurn =
        (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
        (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty);
      if (isMyTurn) urgent.push(s);
      else others.push(s);
    });

    return [...urgent, ...others];
  }, [nonInterestedActiveSuggestions, userId]);

  const urgentCount = useMemo(
    () =>
      sortedActiveSuggestions.filter((s) => {
        const isFirstParty = s.firstPartyId === userId;
        return (
          (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
          (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
        );
      }).length,
    [sortedActiveSuggestions, userId]
  );

  const dailySuggestion = useMemo(
    () =>
      activeSuggestions.find((s) => {
        if (s.matchmakerId !== SYSTEM_MATCHMAKER_ID) return false;
        const isFirstParty = s.firstPartyId === userId;
        return (
          (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
          (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
        );
      }),
    [activeSuggestions, userId]
  );

  const autoSuggestionHistory = useMemo(
    () =>
      historySuggestions.filter(
        (s) => s.matchmakerId === SYSTEM_MATCHMAKER_ID || (s as any).isAutoSuggestion === true
      ),
    [historySuggestions]
  );

  const matchmakerActiveSuggestions = useMemo(
    () =>
      activeSuggestions.filter(
        (s) => s.matchmakerId !== SYSTEM_MATCHMAKER_ID && (s as any).isAutoSuggestion !== true
      ),
    [activeSuggestions]
  );

  const matchmakerHistorySuggestions = useMemo(
    () =>
      historySuggestions.filter(
        (s) => s.matchmakerId !== SYSTEM_MATCHMAKER_ID && (s as any).isAutoSuggestion !== true
      ),
    [historySuggestions]
  );

  const datingSuggestion = useMemo(() => {
    const dateFeedbackStatuses = ['CONTACT_DETAILS_SHARED', 'AWAITING_FIRST_DATE_FEEDBACK', 'DATING'];
    return activeSuggestions.find((s) => dateFeedbackStatuses.includes(s.status)) || null;
  }, [activeSuggestions]);

  // --- Refresh ---
  const handleRefresh = useCallback(async () => {
    await fetchSuggestions(false);
    toast.success(suggestionsDict.container.toasts.refreshSuccessTitle, {
      description: suggestionsDict.container.toasts.refreshSuccessDescription,
    });
  }, [fetchSuggestions, suggestionsDict]);

  const clearNewSuggestions = useCallback(() => setHasNewSuggestions(false), []);

  return {
    // State
    isLoading,
    isRefreshing,
    error,
    hasNewSuggestions,
    isUserInActiveProcess,

    // Derived
    activeProcessSuggestion,
    interestedSuggestions,
    sortedActiveSuggestions,
    urgentCount,
    dailySuggestion,
    autoSuggestionHistory,
    matchmakerActiveSuggestions,
    matchmakerHistorySuggestions,
    datingSuggestion,

    // Actions
    fetchSuggestions,
    handleRefresh,
    clearNewSuggestions,
  };
}
