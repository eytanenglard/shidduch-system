// src/components/suggestions/MatchSuggestionsContainer.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'next/navigation';

import {
  History,
  AlertCircle,
  RefreshCw,
  Bell,
  CheckCircle,
  Target,
  XCircle,
  Loader2,
  Sparkles,
  Bookmark,
  Star,
  Clock,
  Zap,
  Heart,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  User,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { MatchSuggestion } from '@prisma/client';

import SuggestionsList from './list/SuggestionsList';
import InterestedQueue from '@/components/suggestions/interested/InterestedQueue';
import SuggestionDetailPanel from '@/components/suggestions/panels/SuggestionDetailPanel';
import type { ExtendedMatchSuggestion } from '../../types/suggestions';
import { cn, calculateAge, getRelativeCloudinaryPath } from '@/lib/utils';
import { SYSTEM_MATCHMAKER_ID, ACTIVE_PROCESS_STATUSES } from './constants';
import { ErrorBoundary } from '@/components/ui/error-boundary';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';

import FirstPartyPreferenceToggle from '@/components/suggestions/FirstPartyPreferenceToggle';
import AutoSuggestionsZone from '@/components/suggestions/auto/AutoSuggestionsZone';
import AiChatPanel from '@/components/suggestions/chat/AiChatPanel';
import AutoSuggestionFeedbackDialog from '@/components/suggestions/auto/AutoSuggestionFeedbackDialog';
import type { FeedbackData } from '@/components/suggestions/auto/AutoSuggestionFeedbackDialog';
import DateFeedbackDialog from '@/components/suggestions/feedback/DateFeedbackDialog';
import type { DateFeedbackData } from '@/components/suggestions/feedback/DateFeedbackDialog';


// --- Filter Type for the new chip-buttons ---
type ActiveFilter = 'all' | 'active_process' | 'backup' | 'pending';

// --- Action Type ---
type ActionType = 'approve' | 'decline' | 'interested';

// --- Loading Skeleton ---
const LoadingSkeleton: React.FC<{
  dict: SuggestionsDictionary['container']['loading'];
}> = ({ dict }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-[900px] mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">{dict.title}</h3>
          <p className="text-sm text-gray-500">{dict.subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// ============================================================
// Filter Chip Button Component
// ============================================================
interface FilterChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  icon: React.ElementType;
  activeColors: string;
  locale: 'he' | 'en';
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  isActive,
  onClick,
  icon: Icon,
  activeColors,
  locale,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap',
      isActive
        ? `${activeColors} shadow-sm`
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    {count > 0 && (
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold',
          isActive ? 'bg-white/30 text-current' : 'bg-gray-100 text-gray-600'
        )}
      >
        {count}
      </span>
    )}
  </button>
);

// --- Props Interface ---
interface MatchSuggestionsContainerProps {
  userId: string;
  className?: string;
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
  wantsToBeFirstParty?: boolean;
}

// --- Main Container ---
const MatchSuggestionsContainer: React.FC<MatchSuggestionsContainerProps> = ({
  userId,
  className,
  suggestionsDict,
  profileCardDict,
  wantsToBeFirstParty = true,
}) => {
  const params = useParams();

  // --- Locale Resolution ---
  const rawParam = params?.locale || params?.lang;
  const localeString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const locale: 'he' | 'en' = localeString === 'he' ? 'he' : 'en';
  const isRtl = locale === 'he';

  // --- State ---
  const [activeSuggestions, setActiveSuggestions] = useState<
    ExtendedMatchSuggestion[]
  >([]);
  const [historySuggestions, setHistorySuggestions] = useState<
    ExtendedMatchSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [isUserInActiveProcess, setIsUserInActiveProcess] = useState(false);

  // --- NEW: Active filter state ---
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  // --- Confirmation Dialog State ---
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [suggestionForAction, setSuggestionForAction] =
    useState<ExtendedMatchSuggestion | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  // --- Feedback Dialog State (for regular suggestions) ---
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackDecision, setFeedbackDecision] = useState<'APPROVED' | 'DECLINED' | 'INTERESTED'>('APPROVED');

  // --- Date Feedback Dialog State ---
  const [showDateFeedbackDialog, setShowDateFeedbackDialog] = useState(false);

  // --- Details Modal State ---
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<ExtendedMatchSuggestion | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // --- Derived: Active Process Suggestion (Hero Card) ---
  const activeProcessSuggestion = useMemo(() => {
    return (
      activeSuggestions.find((s) =>
        ACTIVE_PROCESS_STATUSES.includes(s.status as any)
      ) || null
    );
  }, [activeSuggestions]);

  // --- Derived: INTERESTED suggestions (sorted by rank) ---
  const interestedSuggestions = useMemo(() => {
    return activeSuggestions
      .filter(
        (s) =>
          s.status === 'FIRST_PARTY_INTERESTED' && s.firstPartyId === userId
      )
      .sort(
        (a, b) =>
          ((a as any).firstPartyRank ?? 999) -
          ((b as any).firstPartyRank ?? 999)
      );
  }, [activeSuggestions, userId]);

  // --- Derived: active suggestions WITHOUT interested AND WITHOUT active process ---
  const nonInterestedActiveSuggestions = useMemo(() => {
    return activeSuggestions.filter(
      (s) =>
        s.status !== 'FIRST_PARTY_INTERESTED' &&
        !ACTIVE_PROCESS_STATUSES.includes(s.status as any)
    );
  }, [activeSuggestions]);

  // --- Derived: sorted active suggestions ---
  const sortedActiveSuggestions = useMemo(() => {
    const urgent: ExtendedMatchSuggestion[] = [];
    const others: ExtendedMatchSuggestion[] = [];

    nonInterestedActiveSuggestions.forEach((s) => {
      const isFirstParty = s.firstPartyId === userId;
      const isMyTurn =
        (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
        (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty);

      if (isMyTurn) {
        urgent.push(s);
      } else {
        others.push(s);
      }
    });

    return [...urgent, ...others];
  }, [nonInterestedActiveSuggestions, userId]);

  // --- Derived: urgent count ---
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

  // --- Derived: daily AI suggestion ---
  const dailySuggestion = useMemo(() => {
    return activeSuggestions.find((s) => {
      if (s.matchmakerId !== SYSTEM_MATCHMAKER_ID) return false;
      const isFirstParty = s.firstPartyId === userId;
      return (
        (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
        (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
      );
    });
  }, [activeSuggestions, userId]);

  // --- Derived: auto-suggestion history (for AutoSuggestionsZone) ---
  const autoSuggestionHistory = useMemo(() => {
    return historySuggestions.filter(
      (s) => s.matchmakerId === SYSTEM_MATCHMAKER_ID || (s as any).isAutoSuggestion === true
    );
  }, [historySuggestions]);

  // --- Derived: matchmaker-only suggestions (exclude auto-suggestions from tabs) ---
  const matchmakerActiveSuggestions = useMemo(() => {
    return activeSuggestions.filter(
      (s) => s.matchmakerId !== SYSTEM_MATCHMAKER_ID && (s as any).isAutoSuggestion !== true
    );
  }, [activeSuggestions]);

  const matchmakerHistorySuggestions = useMemo(() => {
    return historySuggestions.filter(
      (s) => s.matchmakerId !== SYSTEM_MATCHMAKER_ID && (s as any).isAutoSuggestion !== true
    );
  }, [historySuggestions]);

  // --- Derived: questionnaire for selected suggestion ---
  const selectedQuestionnaireData = useMemo(() => {
    if (!selectedSuggestion) return null;
    const isFirstParty = selectedSuggestion.firstPartyId === userId;
    const targetParty = isFirstParty
      ? selectedSuggestion.secondParty
      : selectedSuggestion.firstParty;
    return targetParty?.questionnaireResponses?.[0] ?? null;
  }, [selectedSuggestion, userId]);

  // --- Derived: Suggestion in dating status that needs feedback ---
  const datingSuggestion = useMemo(() => {
    const dateFeedbackStatuses = [
      'CONTACT_DETAILS_SHARED',
      'AWAITING_FIRST_DATE_FEEDBACK',
      'DATING',
    ];
    return (
      activeSuggestions.find((s) =>
        dateFeedbackStatuses.includes(s.status)
      ) || null
    );
  }, [activeSuggestions]);

  // --- Data Fetching ---
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
            description:
              suggestionsDict.container.toasts.newSuggestionsDescription,
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
          suggestionsDict.container.main.errorLoading.replace(
            '{error}',
            errorMessage
          )
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

  // --- Status Change Handler ---
  const handleStatusChange = useCallback(
    async (suggestionId: string, newStatus: string, notes?: string) => {
      try {
        const response = await fetch(
          `/api/suggestions/${suggestionId}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, notes }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || 'Failed to update suggestion status'
          );
        }

        await fetchSuggestions(false);

        const statusMessages: Record<string, string> = {
          FIRST_PARTY_APPROVED:
            suggestionsDict.container.toasts.approvedSuccess,
          SECOND_PARTY_APPROVED:
            suggestionsDict.container.toasts.approvedSuccess,
          FIRST_PARTY_DECLINED:
            suggestionsDict.container.toasts.declinedSuccess,
          SECOND_PARTY_DECLINED:
            suggestionsDict.container.toasts.declinedSuccess,
        };

        let description: string;
        if (newStatus === 'FIRST_PARTY_APPROVED') {
          description = suggestionsDict.container.toasts.approvedFirstPartyDesc;
        } else if (newStatus === 'SECOND_PARTY_APPROVED') {
          description =
            suggestionsDict.container.toasts.approvedSecondPartyDesc;
        } else if (newStatus.includes('DECLINED')) {
          description = suggestionsDict.container.toasts.declinedDesc;
        } else if (newStatus === 'FIRST_PARTY_INTERESTED') {
          description = isRtl
            ? 'ההצעה נשמרה ברשימת ההמתנה שלך'
            : 'Suggestion saved to your waitlist';
        } else {
          description = suggestionsDict.container.toasts.matchmakerNotified;
        }

        toast.success(
          statusMessages[newStatus] ||
            suggestionsDict.container.toasts.statusUpdateSuccess,
          { description }
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : suggestionsDict.container.main.unknownError;
        toast.error(
          suggestionsDict.container.toasts.statusUpdateError.replace(
            '{error}',
            errorMessage
          )
        );
      }
    },
    [fetchSuggestions, suggestionsDict, isRtl]
  );

  // --- Action Request (opens confirmation dialog) ---
  const handleRequestAction = useCallback(
    (
      suggestion: ExtendedMatchSuggestion,
      action: 'approve' | 'decline' | 'interested'
    ) => {
      setSuggestionForAction(suggestion);
      setActionType(action);
      setShowConfirmDialog(true);
    },
    []
  );

  // --- Confirm Action (opens feedback dialog for non-auto suggestions) ---
  const handleConfirmAction = useCallback(async () => {
    if (!suggestionForAction || !actionType) return;

    // For non-auto suggestions, show feedback dialog
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

    // For auto suggestions, proceed normally (they have their own feedback flow in AutoSuggestionsZone)
    const isFirstParty = suggestionForAction.firstPartyId === userId;
    let newStatus = '';

    if (actionType === 'approve') {
      newStatus = isFirstParty
        ? 'FIRST_PARTY_APPROVED'
        : 'SECOND_PARTY_APPROVED';
    } else if (actionType === 'decline') {
      newStatus = isFirstParty
        ? 'FIRST_PARTY_DECLINED'
        : 'SECOND_PARTY_DECLINED';
    } else if (actionType === 'interested') {
      newStatus = 'FIRST_PARTY_INTERESTED';
    }

    await handleStatusChange(suggestionForAction.id, newStatus);

    setShowConfirmDialog(false);
    setSuggestionForAction(null);
    setActionType(null);
  }, [suggestionForAction, actionType, userId, handleStatusChange]);

  // --- Handle Feedback Submit (for regular suggestions) ---
  const handleFeedbackSubmit = useCallback(
    async (feedbackData: FeedbackData) => {
      if (!suggestionForAction) return;

      // 1. Save feedback via API
      await fetch(`/api/suggestions/${suggestionForAction.id}/auto-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      // 2. Transition status
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

  // --- Rank Update Handler ---
  const handleRankUpdate = useCallback(
    async (rankedIds: string[]) => {
      const response = await fetch('/api/suggestions/interested/rank', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankedSuggestionIds: rankedIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ranks');
      }

      await fetchSuggestions(false);
    },
    [fetchSuggestions]
  );

  // --- Date Feedback Submit Handler ---
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
        toast.success(
          isRtl ? 'תודה על הפידבק!' : 'Thanks for your feedback!',
          {
            description: isRtl
              ? 'זה יעזור לנו לשפר את ההצעות הבאות'
              : 'This will help us improve future suggestions',
          }
        );
      } catch (err) {
        toast.error(
          isRtl ? 'שגיאה בשליחת הפידבק' : 'Error submitting feedback'
        );
      }
    },
    [fetchSuggestions, isRtl]
  );

  // --- Remove from INTERESTED ---
  const handleRemoveFromInterested = useCallback(
    (suggestion: ExtendedMatchSuggestion) => {
      setSuggestionForAction(suggestion);
      setActionType('decline');
      setShowConfirmDialog(true);
    },
    []
  );

  // --- Activate INTERESTED ---
  const handleActivateInterested = useCallback(
    (suggestion: ExtendedMatchSuggestion) => {
      setSuggestionForAction(suggestion);
      setActionType('approve');
      setShowConfirmDialog(true);
    },
    []
  );

  // --- View Details Handler (opens slide-over panel) ---
  const handleViewDetails = useCallback(
    (suggestion: ExtendedMatchSuggestion) => {
      setSelectedSuggestion(suggestion);
      setShowDetailsPanel(true);
    },
    []
  );

  // --- Close Details Panel ---
  const handleCloseDetailsPanel = useCallback(() => {
    setShowDetailsPanel(false);
    setSelectedSuggestion(null);
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchSuggestions();
    const intervalId = setInterval(
      () => fetchSuggestions(false),
      5 * 60 * 1000
    );
    return () => clearInterval(intervalId);
  }, [userId, fetchSuggestions]);

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
    const hasActiveProcess = activeSuggestions.some((s) =>
      activeProcessStatuses.includes(s.status)
    );
    setIsUserInActiveProcess(hasActiveProcess);
  }, [activeSuggestions]);

  useEffect(() => {
    if (activeTab === 'active') {
      setHasNewSuggestions(false);
    }
  }, [activeTab]);

  // --- Manual Refresh ---
  const handleRefresh = useCallback(async () => {
    await fetchSuggestions(false);
    toast.success(suggestionsDict.container.toasts.refreshSuccessTitle, {
      description: suggestionsDict.container.toasts.refreshSuccessDescription,
    });
  }, [fetchSuggestions, suggestionsDict]);

  // --- Filter chip toggle handler ---
  const handleFilterToggle = useCallback((filter: ActiveFilter) => {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter));
  }, []);

  // --- Active process banner data ---
  const activeProcessParty = useMemo(() => {
    if (!activeProcessSuggestion) return null;
    const isFirst = activeProcessSuggestion.firstPartyId === userId;
    return isFirst ? activeProcessSuggestion.secondParty : activeProcessSuggestion.firstParty;
  }, [activeProcessSuggestion, userId]);

  const activeProcessImage = activeProcessParty?.images?.find((img) => img.isMain);
  const activeProcessAge = calculateAge(activeProcessParty?.profile?.birthDate ?? null);

  // --- Loading State ---
  if (isLoading) {
    return <LoadingSkeleton dict={suggestionsDict.container.loading} />;
  }

  // --- i18n texts for daily suggestion section ---
  const dailyDict = (suggestionsDict.container as any).dailySuggestion as
    | {
        cardTitle?: string;
        cardSubtitle?: string;
        matchingNote?: string;
        aiPowered?: string;
        basedOnLearning?: string;
      }
    | undefined;

  // --- Filter chip labels ---
  const filterLabels = {
    active_process: isRtl ? 'הצעה פעילה' : 'Active',
    backup: isRtl ? 'רשימת גיבוי' : 'Backup',
    pending: isRtl ? 'ממתינות לתגובה' : 'Pending',
  };

  // --- Determine what to show based on filter ---
  const showHero = activeFilter === 'all' || activeFilter === 'active_process';
  const showInterestedQueue =
    activeFilter === 'all' || activeFilter === 'backup';
  const showPendingSuggestions =
    activeFilter === 'all' || activeFilter === 'pending';

  // --- Render ---
  return (
    <div
      className={cn('min-h-screen bg-gray-50', className)}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-[900px] mx-auto px-4 py-6 space-y-6">

        {/* ===== Page Header ===== */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {suggestionsDict.container.main.title}
          </h1>
          <div className="flex items-center gap-2">
            {hasNewSuggestions && (
              <Badge className="bg-amber-500 text-white border-0 text-xs animate-pulse">
                <Bell className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                {suggestionsDict.container.main.newSuggestions}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-lg h-9 w-9 hover:bg-gray-200"
              aria-label={suggestionsDict.container.main.refreshAriaLabel}
            >
              <RefreshCw className={cn('h-4 w-4 text-gray-600', isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* ===== Auto-Suggestions Zone ===== */}
        <AutoSuggestionsZone
          activeSuggestion={dailySuggestion || null}
          historySuggestions={autoSuggestionHistory}
          userId={userId}
          locale={locale}
          dict={(suggestionsDict.container as any).autoSuggestions || {
            title: locale === 'he' ? 'הצעות חכמות' : 'Smart Suggestions',
            subtitle: locale === 'he' ? 'המערכת לומדת מהתגובות שלך' : 'System learns from your responses',
            scheduleInfo: locale === 'he' ? 'הצעות נשלחות ביום ראשון ורביעי' : 'Suggestions sent Sunday & Wednesday',
            nextSuggestionIn: locale === 'he' ? 'ההצעה הבאה בעוד {days} ימים' : 'Next suggestion in {days} days',
            nextSuggestionTomorrow: locale === 'he' ? 'ההצעה הבאה מחר' : 'Next suggestion tomorrow',
            nextSuggestionToday: locale === 'he' ? 'ההצעה הבאה היום' : 'Next suggestion today',
            noActiveSuggestion: locale === 'he' ? 'אין הצעה חכמה פעילה' : 'No active smart suggestion',
            waitingForSuggestion: locale === 'he' ? 'המערכת מחפשת עבורך' : 'System is searching for you',
            viewSuggestion: locale === 'he' ? 'צפה בהצעה' : 'View Suggestion',
            approve: locale === 'he' ? 'מעוניין/ת' : 'Interested',
            decline: locale === 'he' ? 'לא מתאים' : 'Not a Match',
            saveForLater: locale === 'he' ? 'שמור' : 'Save',
            history: { title: '', empty: '', approved: '', declined: '', interested: '', expired: '' },
            feedbackDialog: {
              titleApprove: '', titleDeclineStep1: '', titleDeclineStep2: '', titleInterested: '',
              subtitleApprove: '', subtitleDeclineStep1: '', subtitleDeclineStep2: '',
              likedTraits: {}, missingTraits: {},
              freeTextPlaceholder: '', missingFreeTextPlaceholder: '', selectAtLeastOne: '',
              next: '', back: '', submitApprove: '', submitDecline: '', submitInterested: '',
              thankYou: '', thankYouDesc: '',
            },
          }}
          onViewDetails={handleViewDetails}
          onStatusChange={handleStatusChange}
        />

        {/* ===== AI Chat Assistant ===== */}
        <AiChatPanel locale={locale} />

        {/* ===== Preference Toggle ===== */}
        <FirstPartyPreferenceToggle
          initialValue={wantsToBeFirstParty}
          locale={locale}
        />

        {/* ===== Active Process Banner (replaces Hero Card) ===== */}
        {activeProcessSuggestion && activeProcessParty && (
          <button
            type="button"
            onClick={() => handleViewDetails(activeProcessSuggestion)}
            className="w-full flex items-center gap-3 p-4 bg-white border border-teal-200 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer text-start"
          >
            {/* Photo */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {activeProcessImage?.url ? (
                <Image
                  src={getRelativeCloudinaryPath(activeProcessImage.url)}
                  alt={activeProcessParty.firstName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {activeProcessParty.firstName}
                  {activeProcessParty.lastName ? ` ${activeProcessParty.lastName.charAt(0)}.` : ''}
                </span>
                {activeProcessAge > 0 && (
                  <span className="text-sm text-gray-500">{activeProcessAge}</span>
                )}
              </div>
              <p className="text-xs text-teal-600 font-medium mt-0.5">
                {isRtl ? 'הצעה פעילה — לחצ/י לצפייה' : 'Active suggestion — tap to view'}
              </p>
            </div>
            {/* Arrow */}
            <Badge className="bg-teal-600 text-white border-0 text-xs">
              {isRtl ? 'פעיל' : 'Active'}
            </Badge>
            {isRtl ? (
              <ChevronLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </button>
        )}

        {/* ===== Date Feedback CTA ===== */}
        {datingSuggestion && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-800">
                {isRtl ? 'איך היה הדייט?' : 'How was the date?'}
              </h4>
              <p className="text-xs text-rose-600">
                {isRtl
                  ? 'הפידבק שלך יעזור לנו להציע הצעות טובות יותר'
                  : 'Your feedback helps us suggest better matches'}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs px-4"
              onClick={() => setShowDateFeedbackDialog(true)}
            >
              <MessageCircle className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
              {isRtl ? 'שתף/י' : 'Share'}
            </Button>
          </div>
        )}

        {/* ===== Tabs ===== */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setActiveFilter('all');
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 bg-gray-100 rounded-lg p-1 h-11 w-full">
            <TabsTrigger
              value="active"
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-sm"
            >
              <Target className="w-4 h-4 text-teal-600" />
              {suggestionsDict.container.main.tabs.active}
              {matchmakerActiveSuggestions.length > 0 && (
                <Badge
                  className={cn(
                    'text-white border-0 px-1.5 py-0 text-[10px] font-bold rounded-full min-w-[20px] h-5',
                    urgentCount > 0 ? 'bg-amber-500' : 'bg-teal-600'
                  )}
                >
                  {matchmakerActiveSuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-sm"
            >
              <History className="w-4 h-4 text-gray-500" />
              {suggestionsDict.container.main.tabs.history}
              {matchmakerHistorySuggestions.length > 0 && (
                <Badge className="bg-gray-500 text-white border-0 px-1.5 py-0 text-[10px] font-bold rounded-full min-w-[20px] h-5">
                  {matchmakerHistorySuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50" dir={isRtl ? 'rtl' : 'ltr'}>
              <AlertCircle className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
              <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Active Tab Content */}
          <TabsContent value="active" className="space-y-4">
            <ErrorBoundary>
              {/* Filter Chips */}
              {(activeProcessSuggestion || interestedSuggestions.length > 0 || sortedActiveSuggestions.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    label={filterLabels.active_process}
                    count={activeProcessSuggestion ? 1 : 0}
                    isActive={activeFilter === 'active_process'}
                    onClick={() => handleFilterToggle('active_process')}
                    icon={Star}
                    activeColors="bg-teal-600 text-white border-teal-600"
                    locale={locale}
                  />
                  <FilterChip
                    label={filterLabels.backup}
                    count={interestedSuggestions.length}
                    isActive={activeFilter === 'backup'}
                    onClick={() => handleFilterToggle('backup')}
                    icon={Bookmark}
                    activeColors="bg-amber-500 text-white border-amber-500"
                    locale={locale}
                  />
                  <FilterChip
                    label={filterLabels.pending}
                    count={sortedActiveSuggestions.length}
                    isActive={activeFilter === 'pending'}
                    onClick={() => handleFilterToggle('pending')}
                    icon={Zap}
                    activeColors="bg-blue-600 text-white border-blue-600"
                    locale={locale}
                  />
                  {activeFilter !== 'all' && (
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {isRtl ? 'הצג הכל' : 'Show all'}
                    </button>
                  )}
                </div>
              )}

              {/* Interested Queue */}
              {showInterestedQueue && interestedSuggestions.length > 0 && (
                <InterestedQueue
                  suggestions={interestedSuggestions}
                  userId={userId}
                  locale={locale}
                  isUserInActiveProcess={isUserInActiveProcess}
                  onActivate={handleActivateInterested}
                  onRemove={handleRemoveFromInterested}
                  onViewDetails={handleViewDetails}
                  onRankUpdate={handleRankUpdate}
                />
              )}

              {/* Regular Suggestions */}
              {showPendingSuggestions && (
                <SuggestionsList
                  locale={locale}
                  suggestions={sortedActiveSuggestions}
                  userId={userId}
                  isLoading={isRefreshing}
                  onActionRequest={handleRequestAction}
                  onOpenDetails={handleViewDetails}
                  isUserInActiveProcess={isUserInActiveProcess}
                  suggestionsDict={suggestionsDict}
                />
              )}

              {/* Empty state when filter shows nothing */}
              {activeFilter !== 'all' &&
                ((activeFilter === 'active_process' && !activeProcessSuggestion) ||
                  (activeFilter === 'backup' && interestedSuggestions.length === 0) ||
                  (activeFilter === 'pending' && sortedActiveSuggestions.length === 0)) && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      {activeFilter === 'active_process' && <Star className="w-7 h-7 text-gray-300" />}
                      {activeFilter === 'backup' && <Bookmark className="w-7 h-7 text-gray-300" />}
                      {activeFilter === 'pending' && <Clock className="w-7 h-7 text-gray-300" />}
                    </div>
                    <h3 className="text-base font-semibold text-gray-600 mb-2">
                      {activeFilter === 'active_process' && (isRtl ? 'אין הצעה פעילה כרגע' : 'No active suggestion')}
                      {activeFilter === 'backup' && (isRtl ? 'אין הצעות ברשימת הגיבוי' : 'No backup suggestions')}
                      {activeFilter === 'pending' && (isRtl ? 'אין הצעות ממתינות לתגובה' : 'No pending suggestions')}
                    </h3>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
                    >
                      {isRtl ? 'חזור לתצוגה מלאה' : 'Back to full view'}
                    </button>
                  </div>
                )}
            </ErrorBoundary>
          </TabsContent>

          {/* History Tab Content */}
          <TabsContent value="history" className="space-y-4">
            <ErrorBoundary>
              <SuggestionsList
                locale={locale}
                suggestions={matchmakerHistorySuggestions}
                userId={userId}
                isLoading={isRefreshing}
                isHistory={true}
                onActionRequest={handleRequestAction}
                onOpenDetails={handleViewDetails}
                isUserInActiveProcess={isUserInActiveProcess}
                suggestionsDict={suggestionsDict}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===== Detail Panel (slide-over) ===== */}
      <SuggestionDetailPanel
        suggestion={selectedSuggestion}
        userId={userId}
        isOpen={showDetailsPanel}
        onClose={handleCloseDetailsPanel}
        onActionRequest={handleRequestAction}
        isUserInActiveProcess={isUserInActiveProcess}
        locale={locale}
        dict={{
          suggestions: suggestionsDict,
          profileCard: profileCardDict,
        }}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border border-gray-200 shadow-lg rounded-xl z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveTitle
                : actionType === 'interested'
                  ? isRtl
                    ? 'שמירה לגיבוי'
                    : 'Save for later'
                  : suggestionsDict.container.dialogs.declineTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
              {actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveDescription
                : actionType === 'interested'
                  ? isRtl
                    ? 'ההצעה תישמר ברשימת ההמתנה שלך. תוכל/י לאשר אותה מאוחר יותר כשתהיה פנוי/ה.'
                    : "This suggestion will be saved to your waitlist. You can approve it later when you're available."
                  : suggestionsDict.container.dialogs.declineDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl">
              {suggestionsDict.container.dialogs.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(
                'rounded-lg font-medium transition-all',
                actionType === 'approve'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : actionType === 'interested'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-rose-600 hover:bg-rose-700'
              )}
            >
              {actionType === 'approve' ? (
                <>
                  <CheckCircle
                    className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')}
                  />
                  {suggestionsDict.container.dialogs.confirmApproval}
                </>
              ) : actionType === 'interested' ? (
                <>
                  <Bookmark
                    className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')}
                  />
                  {isRtl ? 'שמור/י לגיבוי' : 'Save for later'}
                </>
              ) : (
                <>
                  <XCircle className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')} />
                  {suggestionsDict.container.dialogs.confirmDecline}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback Dialog for Regular Suggestions */}
      <AutoSuggestionFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={(open) => {
          setShowFeedbackDialog(open);
          if (!open) {
            setSuggestionForAction(null);
            setActionType(null);
          }
        }}
        suggestionId={suggestionForAction?.id || ''}
        decision={feedbackDecision}
        locale={locale}
        dict={{
          titleApprove: isRtl ? 'מה אהבת?' : 'What did you like?',
          titleDeclineStep1: isRtl ? 'לפני שנמשיך...' : 'Before we continue...',
          titleDeclineStep2: isRtl ? 'מה חסר?' : 'What was missing?',
          titleInterested: isRtl ? 'מה מעניין אותך?' : 'What interests you?',
          subtitleApprove: isRtl ? 'הפידבק שלך עוזר לנו להציע הצעות טובות יותר' : 'Your feedback helps us suggest better matches',
          subtitleDeclineStep1: isRtl ? 'ספר/י לנו מה כן אהבת' : 'Tell us what you did like',
          subtitleDeclineStep2: isRtl ? 'מה היה חסר כדי שתאשר/י?' : 'What was missing for you to approve?',
          likedTraits: {
            religious_match: isRtl ? 'התאמה דתית' : 'Religious match',
            personality_match: isRtl ? 'אישיות מתאימה' : 'Personality match',
            age_appropriate: isRtl ? 'גיל מתאים' : 'Age appropriate',
            shared_values: isRtl ? 'ערכים משותפים' : 'Shared values',
            similar_background: isRtl ? 'רקע דומה' : 'Similar background',
            attractive_profile: isRtl ? 'פרופיל מושך' : 'Attractive profile',
            good_career: isRtl ? 'קריירה/השכלה' : 'Good career',
            interesting_person: isRtl ? 'בנאדם מעניין' : 'Interesting person',
          },
          missingTraits: {
            age_gap: isRtl ? 'פער גילאים' : 'Age gap',
            religious_gap: isRtl ? 'פער דתי' : 'Religious gap',
            geographic_gap: isRtl ? 'מרחק גאוגרפי' : 'Geographic gap',
            not_attracted: isRtl ? 'חוסר חיבור חיצוני' : 'Not attracted',
            no_connection: isRtl ? 'חוסר חיבור כללי' : 'No connection',
            background_gap: isRtl ? 'פער ברקע' : 'Background gap',
            education_gap: isRtl ? 'פער השכלתי' : 'Education gap',
            gut_feeling: isRtl ? 'תחושת בטן' : 'Gut feeling',
          },
          freeTextPlaceholder: isRtl ? 'ספר/י עוד (אופציונלי)...' : 'Tell us more (optional)...',
          missingFreeTextPlaceholder: isRtl ? 'מה היית רוצה אחרת? (אופציונלי)' : 'What would you want differently? (optional)',
          selectAtLeastOne: isRtl ? 'נא לבחור לפחות אפשרות אחת' : 'Please select at least one option',
          next: isRtl ? 'הבא' : 'Next',
          back: isRtl ? 'חזרה' : 'Back',
          submitApprove: isRtl ? 'אישור' : 'Approve',
          submitDecline: isRtl ? 'דחייה' : 'Decline',
          submitInterested: isRtl ? 'שמירה' : 'Save',
          thankYou: isRtl ? 'תודה על הפידבק!' : 'Thanks for your feedback!',
          thankYouDesc: isRtl ? 'זה יעזור לנו לדייק את ההצעות הבאות שלך' : "This will help us fine-tune your future suggestions",
        }}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Date Feedback Dialog */}
      <DateFeedbackDialog
        open={showDateFeedbackDialog}
        onOpenChange={setShowDateFeedbackDialog}
        suggestion={datingSuggestion}
        userId={userId}
        locale={locale}
        onSubmit={handleDateFeedbackSubmit}
      />
    </div>
  );
};

export default MatchSuggestionsContainer;
