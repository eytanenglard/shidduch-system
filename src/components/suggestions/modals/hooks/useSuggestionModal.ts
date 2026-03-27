import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useIsMobile } from '@/components/questionnaire/hooks/useMediaQuery';
import { useFullscreenModal } from './useFullscreenModal';
import type { SuggestionDetailsModalProps, SuggestionModalState } from '../types/modal.types';

export const useSuggestionModal = (
  props: SuggestionDetailsModalProps
): SuggestionModalState => {
  const {
    suggestion,
    userId,
    locale,
    isOpen,
    onClose,
    onActionRequest,
    onRefresh,
    initialTab,
    dict,
  } = props;

  const [activeTab, setActiveTab] = useState('presentation');
  const [tabDirection, setTabDirection] = useState(0);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuestionnaireLoading] = useState(false);
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['presentation']));
  const [actionFeedback, setActionFeedback] = useState<'success' | 'declined' | null>(null);

  const TAB_ORDER = ['presentation', 'profile', 'compatibility', 'details'];

  const isMobile = useIsMobile();
  const { isFullscreen, isTransitioning, toggleFullscreen } = useFullscreenModal(isOpen);
  const searchParams = useSearchParams();
  const isHe = locale === 'he';

  // Body overflow management
  useEffect(() => {
    if (isOpen && (isMobile || isFullscreen)) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, isMobile, isFullscreen]);

  // Tab initialization on open
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else {
        const view = searchParams.get('view');
        setActiveTab(view === 'chat' ? 'details' : 'presentation');
      }
      setIsActionsExpanded(false);
      setActionFeedback(null);
      setVisitedTabs(new Set(['presentation']));
      setIsInitialLoad(true);
      const timer = setTimeout(() => setIsInitialLoad(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, searchParams, suggestion?.id, initialTab]);

  // Directional tab change
  const handleTabChange = useCallback((newTab: string) => {
    const oldIdx = TAB_ORDER.indexOf(activeTab);
    const newIdx = TAB_ORDER.indexOf(newTab);
    setTabDirection(newIdx > oldIdx ? 1 : -1);
    setActiveTab(newTab);
    setVisitedTabs(prev => new Set(prev).add(newTab));
  }, [activeTab, TAB_ORDER]);

  // Keyboard arrow navigation for tabs
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      // In RTL: right = previous, left = next
      const direction = isHe
        ? (e.key === 'ArrowRight' ? -1 : 1)
        : (e.key === 'ArrowLeft' ? -1 : 1);
      const currentIdx = TAB_ORDER.indexOf(activeTab);
      const nextIdx = currentIdx + direction;
      if (nextIdx >= 0 && nextIdx < TAB_ORDER.length) {
        handleTabChange(TAB_ORDER[nextIdx]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, handleTabChange, isHe]);

  // Derived values
  const isFirstParty = suggestion?.firstPartyId === userId;
  const targetParty = suggestion
    ? isFirstParty
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;

  const profileWithUser = useMemo(() => {
    if (!targetParty || !targetParty.profile) {
      return null;
    }
    return {
      ...targetParty.profile,
      user: {
        firstName: targetParty.firstName,
        lastName: targetParty.lastName,
      },
    };
  }, [targetParty]);

  // Handlers
  const handleApprove = useCallback(() => {
    if (!suggestion) return;
    setActionFeedback('success');
    onActionRequest(suggestion, 'approve');
  }, [suggestion, onActionRequest]);

  const handleDecline = useCallback(() => {
    if (!suggestion) return;
    setActionFeedback('declined');
    onActionRequest(suggestion, 'decline');
  }, [suggestion, onActionRequest]);

  const handleInterested = useCallback(() => {
    if (!suggestion) return;
    setActionFeedback('success');
    onActionRequest(suggestion, 'interested');
  }, [suggestion, onActionRequest]);

  const handleWithdraw = useCallback(
    async (type: 'grace_period' | 'before_second_party') => {
      if (!suggestion) return;
      try {
        const response = await fetch(`/api/suggestions/${suggestion.id}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.gracePeriodExpired) {
            toast.error(dict.suggestions.modal.actions.gracePeriodExpired);
            return;
          }
          throw new Error(errorData.error || 'Failed to withdraw');
        }

        const data = await response.json();
        toast.success(data.message);
        onRefresh?.();
        onClose();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : dict.suggestions.modal.actions.withdrawError;
        toast.error(errorMessage);
      }
    },
    [suggestion, dict, onRefresh, onClose]
  );

  const handleSendQuestion = useCallback(
    async (question: string) => {
      if (!suggestion) return;
      setIsSubmitting(true);
      try {
        await fetch(`/api/suggestions/${suggestion.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: question }),
        });
        const detailsDict = dict.suggestions.modal.detailsTab;
        toast.success(detailsDict.toasts.sendSuccess, {
            description: detailsDict.toasts.sendSuccessDescription,
          }
        );
        setShowAskDialog(false);
      } catch {
        toast.error(dict.suggestions.modal.detailsTab.toasts.sendError);
      } finally {
        setIsSubmitting(false);
      }
    },
    [suggestion, dict]
  );

  return {
    activeTab,
    setActiveTab,
    tabDirection,
    handleTabChange,
    showAskDialog,
    setShowAskDialog,
    isSubmitting,
    isQuestionnaireLoading,
    isActionsExpanded,
    setIsActionsExpanded,
    isInitialLoad,
    visitedTabs,
    actionFeedback,
    isMobile,
    isFullscreen,
    isTransitioning,
    toggleFullscreen,
    isFirstParty,
    isHe,
    targetParty,
    profileWithUser,
    handleApprove,
    handleDecline,
    handleInterested,
    handleWithdraw,
    handleSendQuestion,
  };
};
