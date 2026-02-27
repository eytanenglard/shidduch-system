// src/components/suggestions/MatchSuggestionsContainer.tsx

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { MatchSuggestion } from '@prisma/client';

import SuggestionsList from './list/SuggestionsList';
import InterestedQueue from '@/components/suggestions/interested/InterestedQueue';
import type { ExtendedMatchSuggestion } from './types';
import { cn } from '@/lib/utils';

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

// =============================================================================
// COLOR PALETTE REFERENCE (Matching HeroSection.tsx)
// =============================================================================
// Primary Colors:
//   - Teal/Emerald: from-teal-400 via-teal-500 to-emerald-500 (Knowledge/New)
//   - Orange/Amber: from-orange-400 via-amber-500 to-yellow-500 (Action/Warmth)
//   - Rose/Pink:    from-rose-400 via-pink-500 to-red-500 (Love/Connection)
//   - Violet/Purple: from-violet-500 via-purple-500 to-indigo-500 (Daily AI Suggestion)
//
// Background Gradients:
//   - Page: from-slate-50 via-teal-50/20 to-orange-50/20
//   - Cards: from-teal-50 via-white to-emerald-50 (Teal variant)
//
// Text Gradients:
//   - from-teal-600 via-orange-600 to-amber-600
//
// Accent Lines:
//   - from-teal-400 via-orange-400 to-rose-400
// =============================================================================

const SYSTEM_MATCHMAKER_ID = 'system-matchmaker-neshamatech';

// --- Action Type (extended to include 'interested') ---
type ActionType = 'approve' | 'decline' | 'interested';

// --- Loading Skeleton ---
const LoadingSkeleton: React.FC<{
  dict: SuggestionsDictionary['container']['loading'];
}> = ({ dict }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/20">
    <div className="container mx-auto px-4 py-8">
      <div className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl">
        <div className="px-8 py-6 bg-gradient-to-r from-teal-50/80 via-white to-orange-50/30 border-b border-gray-100">
          <div className="flex items-center justify-center">
            <div className="h-7 bg-gray-200 rounded-lg w-48 animate-pulse" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-2 bg-teal-50/50 rounded-2xl p-1 h-14 w-fit gap-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="px-6 py-3 rounded-xl bg-gray-200 animate-pulse w-28 h-10"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 via-orange-100 to-rose-100 animate-pulse border-4 border-white shadow-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                {dict.title}
              </h3>
              <p className="text-gray-600 max-w-md leading-relaxed">
                {dict.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-orange-500 animate-bounce"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);
  const [isUserInActiveProcess, setIsUserInActiveProcess] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [suggestionForAction, setSuggestionForAction] =
    useState<ExtendedMatchSuggestion | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

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

  // --- Derived: active suggestions WITHOUT interested ---
  const nonInterestedActiveSuggestions = useMemo(() => {
    return activeSuggestions.filter(
      (s) => s.status !== 'FIRST_PARTY_INTERESTED'
    );
  }, [activeSuggestions]);

  // --- Derived: sorted active suggestions (urgent first, excluding INTERESTED) ---
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

  // --- Derived: daily AI suggestion awaiting user response ---
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

  // --- Confirm Action ---
  const handleConfirmAction = useCallback(async () => {
    if (!suggestionForAction || !actionType) return;

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

  // --- Rank Update Handler (for InterestedQueue drag-and-drop) ---
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

  // --- Remove suggestion from INTERESTED queue ---
  const handleRemoveFromInterested = useCallback(
    (suggestion: ExtendedMatchSuggestion) => {
      setSuggestionForAction(suggestion);
      setActionType('decline');
      setShowConfirmDialog(true);
    },
    []
  );

  // --- Activate an INTERESTED suggestion ---
  const handleActivateInterested = useCallback(
    (suggestion: ExtendedMatchSuggestion) => {
      setSuggestionForAction(suggestion);
      setActionType('approve');
      setShowConfirmDialog(true);
    },
    []
  );

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
      // NOT: FIRST_PARTY_INTERESTED - it's not an active process
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

  // --- Render ---
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/20',
        className
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl">
          {/* Card Header */}
          <CardHeader className="pb-4 bg-gradient-to-r from-white via-teal-50/30 to-orange-50/30 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="rounded-full h-10 w-10 hover:bg-teal-100 transition-colors"
                  aria-label={suggestionsDict.container.main.refreshAriaLabel}
                >
                  <RefreshCw
                    className={cn(
                      'h-5 w-5 text-teal-600',
                      isRefreshing && 'animate-spin'
                    )}
                  />
                </Button>
                {hasNewSuggestions && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-xl animate-pulse">
                    <Bell className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                    {suggestionsDict.container.main.newSuggestions}
                  </Badge>
                )}
              </div>
              <div className="text-center flex-grow">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {suggestionsDict.container.main.title}
                </CardTitle>
              </div>
              <div className="w-16" />
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* ===== Daily Suggestion Highlight Section ===== */}
            {dailySuggestion && (
              <div className="mb-6 p-5 bg-gradient-to-r from-violet-50 via-purple-50/50 to-indigo-50 border border-violet-200/50 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      {dailyDict?.cardTitle ||
                        (isRtl ? '✨ ההצעה היומית שלך' : '✨ Your Daily Match')}
                    </h3>
                    <p className="text-sm text-violet-600/80">
                      {dailyDict?.cardSubtitle ||
                        (isRtl
                          ? 'כל יום אנחנו מחפשים עבורך את ההתאמה הכי טובה'
                          : 'Every day we search for your best possible match')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  {dailyDict?.matchingNote ||
                    (isRtl
                      ? 'הצעה זו נבחרה על סמך ניתוח מעמיק של הפרופיל שלך, תשובותיך לשאלון, והעדפותיך. המערכת שלנו לומדת ומשתפרת כל הזמן.'
                      : 'This match was selected based on deep analysis of your profile, questionnaire answers, and preferences. Our system learns and improves continuously.')}
                </p>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 text-xs">
                    {dailyDict?.aiPowered ||
                      (isRtl ? 'מותאם אישית ע"י AI' : 'AI-Personalized')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-violet-300 text-violet-700 text-xs"
                  >
                    {dailyDict?.basedOnLearning ||
                      (isRtl
                        ? 'מבוסס על למידת המערכת'
                        : 'Based on system learning')}
                  </Badge>
                </div>
              </div>
            )}

            {/* ===== Preference Toggle: Auto-Scan ===== */}
            <FirstPartyPreferenceToggle
              initialValue={wantsToBeFirstParty}
              locale={locale}
              className="mb-6"
            />

            {/* ===== Tabs ===== */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-2 bg-teal-50/50 rounded-2xl p-1 h-14 w-fit">
                  {/* Tab: Active (Teal) */}
                  <TabsTrigger
                    value="active"
                    className="relative flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <Target className="w-5 h-5 text-teal-500" />
                    <span className="group-data-[state=active]:text-teal-700">
                      {suggestionsDict.container.main.tabs.active}
                    </span>
                    {activeSuggestions.length > 0 && (
                      <Badge
                        className={cn(
                          'text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6',
                          urgentCount > 0
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 animate-pulse'
                            : 'bg-teal-500'
                        )}
                      >
                        {activeSuggestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>

                  {/* Tab: History (Gray) */}
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <History className="w-5 h-5 text-gray-500" />
                    <span>{suggestionsDict.container.main.tabs.history}</span>
                    {historySuggestions.length > 0 && (
                      <Badge className="bg-gray-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {historySuggestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                  dir={isRtl ? 'rtl' : 'ltr'}
                >
                  <AlertCircle
                    className={cn('h-5 w-5', isRtl ? 'ml-2' : 'mr-2')}
                  />
                  <AlertDescription className="text-red-800 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Active Tab Content */}
              <TabsContent value="active" className="space-y-6">
                {/* ===== Interested Queue ===== */}
                {interestedSuggestions.length > 0 && (
                  <InterestedQueue
                    suggestions={interestedSuggestions}
                    userId={userId}
                    locale={locale}
                    isUserInActiveProcess={isUserInActiveProcess}
                    onActivate={handleActivateInterested}
                    onRemove={handleRemoveFromInterested}
                    onViewDetails={() => {
                      // TODO: open SuggestionDetailsModal
                    }}
                    onRankUpdate={handleRankUpdate}
                    className="mb-4"
                  />
                )}

                <SuggestionsList
                  locale={locale}
                  suggestions={sortedActiveSuggestions}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isRefreshing}
                  onStatusChange={handleStatusChange}
                  onActionRequest={handleRequestAction}
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                  suggestionsDict={suggestionsDict}
                  profileCardDict={profileCardDict}
                />
              </TabsContent>

              {/* History Tab Content */}
              <TabsContent value="history" className="space-y-6">
                <SuggestionsList
                  locale={locale}
                  suggestions={historySuggestions}
                  userId={userId}
                  viewMode={viewMode}
                  isLoading={isRefreshing}
                  isHistory={true}
                  onStatusChange={handleStatusChange}
                  onActionRequest={handleRequestAction}
                  onRefresh={handleRefresh}
                  isUserInActiveProcess={isUserInActiveProcess}
                  suggestionsDict={suggestionsDict}
                  profileCardDict={profileCardDict}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-0 shadow-2xl rounded-2xl z-[9999]">
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
                'rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300',
                actionType === 'approve'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'
                  : actionType === 'interested'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
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
    </div>
  );
};

export default MatchSuggestionsContainer;
