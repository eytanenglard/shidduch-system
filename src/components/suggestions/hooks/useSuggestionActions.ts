// src/components/suggestions/hooks/useSuggestionActions.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsDictionary } from '@/types/dictionary';
import type { FeedbackData } from '@/components/suggestions/auto/AutoSuggestionFeedbackDialog';
import type { DateFeedbackData } from '@/components/suggestions/feedback/DateFeedbackDialog';

type ActionType = 'approve' | 'decline' | 'interested';

interface UseSuggestionActionsOptions {
  userId: string;
  isRtl: boolean;
  suggestionsDict: SuggestionsDictionary;
  fetchSuggestions: (showLoading?: boolean) => Promise<void>;
}

export function useSuggestionActions({
  userId,
  isRtl,
  suggestionsDict,
  fetchSuggestions,
}: UseSuggestionActionsOptions) {
  // --- Dialog state ---
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [suggestionForAction, setSuggestionForAction] = useState<ExtendedMatchSuggestion | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackDecision, setFeedbackDecision] = useState<'APPROVED' | 'DECLINED' | 'INTERESTED'>('APPROVED');
  const [showDateFeedbackDialog, setShowDateFeedbackDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- Panel state ---
  const [selectedSuggestion, setSelectedSuggestion] = useState<ExtendedMatchSuggestion | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // --- Status change ---
  const handleStatusChange = useCallback(
    async (suggestionId: string, newStatus: string, notes?: string) => {
      const loadingKey = newStatus.includes('APPROVED')
        ? 'approve'
        : newStatus.includes('DECLINED')
          ? 'decline'
          : newStatus === 'FIRST_PARTY_INTERESTED'
            ? 'interested'
            : null;
      if (loadingKey) setActionLoading(loadingKey);

      try {
        const response = await fetch(`/api/suggestions/${suggestionId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, notes }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update suggestion status');
        }

        await fetchSuggestions(false);

        const statusMessages: Record<string, string> = {
          FIRST_PARTY_APPROVED: suggestionsDict.container.toasts.approvedSuccess,
          SECOND_PARTY_APPROVED: suggestionsDict.container.toasts.approvedSuccess,
          FIRST_PARTY_DECLINED: suggestionsDict.container.toasts.declinedSuccess,
          SECOND_PARTY_DECLINED: suggestionsDict.container.toasts.declinedSuccess,
        };

        let description: string;
        if (newStatus === 'FIRST_PARTY_APPROVED') {
          description = suggestionsDict.container.toasts.approvedFirstPartyDesc;
        } else if (newStatus === 'SECOND_PARTY_APPROVED') {
          description = suggestionsDict.container.toasts.approvedSecondPartyDesc;
        } else if (newStatus.includes('DECLINED')) {
          description = suggestionsDict.container.toasts.declinedDesc;

          // Undo decline: show toast with undo action for 30 seconds
          const undoLabel = (suggestionsDict.container.toasts as Record<string, string>).undoDecline || (isRtl ? 'ביטול דחייה' : 'Undo');
          const undoSuccessLabel = (suggestionsDict.container.toasts as Record<string, string>).undoDeclineSuccess || (isRtl ? 'הדחייה בוטלה' : 'Decline undone');
          const restoreStatus = newStatus === 'FIRST_PARTY_DECLINED' ? 'PENDING_FIRST_PARTY' : 'PENDING_SECOND_PARTY';

          toast.success(
            statusMessages[newStatus] || suggestionsDict.container.toasts.statusUpdateSuccess,
            {
              description,
              duration: 30000,
              action: {
                label: undoLabel,
                onClick: async () => {
                  try {
                    const undoRes = await fetch(`/api/suggestions/${suggestionId}/status`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: restoreStatus }),
                    });
                    if (undoRes.ok) {
                      await fetchSuggestions(false);
                      toast.success(undoSuccessLabel);
                    }
                  } catch {
                    // Silently fail — undo is best-effort
                  }
                },
              },
            }
          );
          return; // Skip the default toast below
        } else if (newStatus === 'FIRST_PARTY_INTERESTED') {
          description = isRtl
            ? 'ההצעה נשמרה ברשימת ההמתנה שלך'
            : 'Suggestion saved to your waitlist';
        } else {
          description = suggestionsDict.container.toasts.matchmakerNotified;
        }

        toast.success(
          statusMessages[newStatus] || suggestionsDict.container.toasts.statusUpdateSuccess,
          { description }
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : suggestionsDict.container.main.unknownError;
        toast.error(
          suggestionsDict.container.toasts.statusUpdateError.replace('{error}', errorMessage)
        );
      } finally {
        setActionLoading(null);
      }
    },
    [fetchSuggestions, suggestionsDict, isRtl]
  );

  // --- Action request (opens confirmation) ---
  const handleRequestAction = useCallback(
    (suggestion: ExtendedMatchSuggestion, action: ActionType) => {
      setSuggestionForAction(suggestion);
      setActionType(action);
      setShowConfirmDialog(true);
    },
    []
  );

  // --- Confirm action ---
  const handleConfirmAction = useCallback(async () => {
    if (!suggestionForAction || !actionType) return;

    if (!suggestionForAction.isAutoSuggestion) {
      const decisionMap: Record<ActionType, 'APPROVED' | 'DECLINED' | 'INTERESTED'> = {
        approve: 'APPROVED',
        decline: 'DECLINED',
        interested: 'INTERESTED',
      };
      setFeedbackDecision(decisionMap[actionType]);
      setShowConfirmDialog(false);
      setShowFeedbackDialog(true);
      return;
    }

    const isFirstParty = suggestionForAction.firstPartyId === userId;
    let newStatus = '';
    if (actionType === 'approve') {
      newStatus = isFirstParty ? 'FIRST_PARTY_APPROVED' : 'SECOND_PARTY_APPROVED';
    } else if (actionType === 'decline') {
      newStatus = isFirstParty ? 'FIRST_PARTY_DECLINED' : 'SECOND_PARTY_DECLINED';
    } else if (actionType === 'interested') {
      newStatus = 'FIRST_PARTY_INTERESTED';
    }

    await handleStatusChange(suggestionForAction.id, newStatus);
    setShowConfirmDialog(false);
    setSuggestionForAction(null);
    setActionType(null);
  }, [suggestionForAction, actionType, userId, handleStatusChange]);

  // --- Feedback submit ---
  const handleFeedbackSubmit = useCallback(
    async (feedbackData: FeedbackData) => {
      if (!suggestionForAction) return;

      await fetch(`/api/suggestions/${suggestionForAction.id}/auto-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      const isFirstParty = suggestionForAction.firstPartyId === userId;
      const statusMap: Record<string, string> = {
        APPROVED: isFirstParty ? 'FIRST_PARTY_APPROVED' : 'SECOND_PARTY_APPROVED',
        DECLINED: isFirstParty ? 'FIRST_PARTY_DECLINED' : 'SECOND_PARTY_DECLINED',
        INTERESTED: 'FIRST_PARTY_INTERESTED',
      };

      await handleStatusChange(suggestionForAction.id, statusMap[feedbackData.decision]);
      setSuggestionForAction(null);
      setActionType(null);
    },
    [suggestionForAction, userId, handleStatusChange]
  );

  // --- Rank update ---
  const handleRankUpdate = useCallback(
    async (rankedIds: string[]) => {
      const response = await fetch('/api/suggestions/interested/rank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankedSuggestionIds: rankedIds }),
      });
      if (!response.ok) throw new Error('Failed to update ranks');
      await fetchSuggestions(false);
    },
    [fetchSuggestions]
  );

  // --- Date feedback ---
  const handleDateFeedbackSubmit = useCallback(
    async (feedback: DateFeedbackData) => {
      try {
        const response = await fetch(
          `/api/suggestions/${feedback.suggestionId}/date-feedback`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedback),
          }
        );
        if (!response.ok) throw new Error('Failed to submit feedback');
        await fetchSuggestions(false);
        toast.success(isRtl ? 'תודה על הפידבק!' : 'Thanks for your feedback!', {
          description: isRtl
            ? 'זה יעזור לנו לשפר את ההצעות הבאות'
            : 'This will help us improve future suggestions',
        });
      } catch {
        toast.error(isRtl ? 'שגיאה בשליחת הפידבק' : 'Error submitting feedback');
      }
    },
    [fetchSuggestions, isRtl]
  );

  // --- Interested queue actions ---
  const handleRemoveFromInterested = useCallback((suggestion: ExtendedMatchSuggestion) => {
    setSuggestionForAction(suggestion);
    setActionType('decline');
    setShowConfirmDialog(true);
  }, []);

  const handleActivateInterested = useCallback((suggestion: ExtendedMatchSuggestion) => {
    setSuggestionForAction(suggestion);
    setActionType('approve');
    setShowConfirmDialog(true);
  }, []);

  // --- Panel handlers ---
  const handleViewDetails = useCallback((suggestion: ExtendedMatchSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowDetailsPanel(true);
  }, []);

  const handleCloseDetailsPanel = useCallback(() => {
    setShowDetailsPanel(false);
    setSelectedSuggestion(null);
  }, []);

  // --- Reset dialog state ---
  const resetDialogState = useCallback(() => {
    setSuggestionForAction(null);
    setActionType(null);
  }, []);

  return {
    // Dialog state
    showConfirmDialog,
    setShowConfirmDialog,
    suggestionForAction,
    actionType,
    showFeedbackDialog,
    setShowFeedbackDialog,
    feedbackDecision,
    showDateFeedbackDialog,
    setShowDateFeedbackDialog,
    actionLoading,

    // Panel state
    selectedSuggestion,
    showDetailsPanel,

    // Handlers
    handleStatusChange,
    handleRequestAction,
    handleConfirmAction,
    handleFeedbackSubmit,
    handleRankUpdate,
    handleDateFeedbackSubmit,
    handleRemoveFromInterested,
    handleActivateInterested,
    handleViewDetails,
    handleCloseDetailsPanel,
    resetDialogState,
  };
}
