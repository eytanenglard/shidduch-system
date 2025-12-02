// src/components/suggestions/MatchSuggestionsContainer.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  Heart,
  Zap,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { MatchSuggestion } from '@prisma/client';

import SuggestionsList from './list/SuggestionsList';
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

// =============================================================================
// COLOR PALETTE REFERENCE (Matching HeroSection.tsx)
// =============================================================================
// Primary Colors:
//   - Teal/Emerald: from-teal-400 via-teal-500 to-emerald-500 (Knowledge/New)
//   - Orange/Amber: from-orange-400 via-amber-500 to-yellow-500 (Action/Warmth)
//   - Rose/Pink:    from-rose-400 via-pink-500 to-red-500 (Love/Connection)
//
// Background Gradients:
//   - Page: from-slate-50 via-teal-50/20 to-orange-50/20
//   - Cards: from-teal-50 via-white to-emerald-50 (Teal variant)
//           from-orange-50 via-white to-amber-50 (Orange variant)
//           from-rose-50 via-white to-red-50 (Rose variant)
//
// Text Gradients:
//   - from-teal-600 via-orange-600 to-amber-600
//   - from-teal-600 to-orange-600
//
// Accent Lines:
//   - from-teal-400 via-orange-400 to-rose-400
// =============================================================================

// --- Skeleton Loading (Hero Teal/Orange Palette) ---
const LoadingSkeleton: React.FC<{
  dict: SuggestionsDictionary['container']['loading'];
}> = ({ dict }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/20">
    <div className="container mx-auto px-4 py-8">
      {/* Hero Skeleton */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-teal-100 to-orange-100 animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl mx-auto w-80 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-xl mx-auto w-96 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="border-0 shadow-lg overflow-hidden bg-white rounded-2xl animate-pulse"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-200 w-12 h-12"></div>
                  <div className="text-right">
                    <div className="w-16 h-8 bg-gray-200 rounded-lg mb-2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Card Skeleton */}
      <div className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl">
        <div className="px-8 py-6 bg-gradient-to-r from-teal-50/80 via-white to-orange-50/30 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            <div className="w-16 h-4"></div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="grid grid-cols-3 bg-teal-50/50 rounded-2xl p-1 h-14 w-fit gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="px-6 py-3 rounded-xl bg-gray-200 animate-pulse w-24 h-10"
                ></div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 via-orange-100 to-rose-100 animate-pulse border-4 border-white shadow-xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 via-orange-400 to-rose-400 opacity-20 animate-ping"></div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
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
                  className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-orange-500 animate-bounce"
                  style={{ animationDelay: `${index * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Stats Component (Hero Teal/Orange Palette) ---
const WelcomeStats: React.FC<{
  activeSuggestions: ExtendedMatchSuggestion[];
  historySuggestions: ExtendedMatchSuggestion[];
  userId: string;
  dict: SuggestionsDictionary['container']['stats'];
}> = ({ activeSuggestions, historySuggestions, userId, dict }) => {
  const approvedCount = [...activeSuggestions, ...historySuggestions].filter(
    (s) =>
      s.status === 'FIRST_PARTY_APPROVED' ||
      s.status === 'SECOND_PARTY_APPROVED'
  ).length;

  const myTurnCount = activeSuggestions.filter((s) => {
    const isFirstParty = s.firstPartyId === userId;
    return (
      (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
      (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
    );
  }).length;

  const stats = [
    {
      label: dict.new,
      value: activeSuggestions.length,
      icon: <Sparkles className="w-5 h-5" />,
      // Teal/Emerald -> New/Fresh (Knowledge)
      gradient: 'from-teal-400 via-teal-500 to-emerald-500',
      shadowColor: 'shadow-teal-500/25',
      glowColor: 'shadow-teal-400/30',
      bgGradient: 'from-teal-50 via-white to-emerald-50',
      description: dict.newDesc,
    },
    {
      label: dict.yourTurn,
      value: myTurnCount,
      icon: <Zap className="w-5 h-5" />,
      // Orange/Amber -> Action/Warmth (Focus)
      gradient: 'from-orange-400 via-amber-500 to-yellow-500',
      shadowColor: 'shadow-orange-500/25',
      glowColor: 'shadow-orange-400/30',
      bgGradient: 'from-orange-50 via-white to-amber-50',
      description: dict.yourTurnDesc,
      pulse: myTurnCount > 0,
    },
    {
      label: dict.approved,
      value: approvedCount,
      icon: <Heart className="w-5 h-5" />,
      // Rose/Pink -> Love/Connection (Personal)
      gradient: 'from-rose-400 via-pink-500 to-red-500',
      shadowColor: 'shadow-rose-500/25',
      glowColor: 'shadow-rose-400/30',
      bgGradient: 'from-rose-50 via-white to-red-50',
      description: dict.approvedDesc,
    },
  ];

  return (
    <div className="mb-8">
      {/* Header with Hero gradient text */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-gradient-to-r from-teal-100 to-orange-100">
            <Target className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">
          {dict.title}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {dict.subtitle}
        </p>
        {/* Decorative divider matching Hero */}
        <div className="relative mt-4">
          <div className="w-16 h-0.5 bg-gradient-to-r from-teal-400 via-orange-400 to-rose-400 rounded-full mx-auto" />
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-orange-400" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={cn(
              'border-0 shadow-lg overflow-hidden bg-gradient-to-br hover:shadow-xl transition-all duration-300 group',
              stat.bgGradient,
              stat.shadowColor
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    'p-3 rounded-xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500',
                    stat.gradient,
                    stat.glowColor,
                    stat.pulse && 'animate-pulse'
                  )}
                >
                  {stat.icon}
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      'text-3xl font-bold text-gray-900',
                      stat.pulse && 'animate-bounce'
                    )}
                  >
                    {stat.value}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-800">
                  {stat.label}
                </h3>
                <p className="text-sm text-gray-600">{stat.description}</p>
              </div>
              {/* Subtle decorative element */}
              <div className="mt-4 w-8 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface MatchSuggestionsContainerProps {
  userId: string;
  className?: string;
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
}

// --- Main Container (Hero Teal/Orange Palette) ---
const MatchSuggestionsContainer: React.FC<MatchSuggestionsContainerProps> = ({
  userId,
  className,
  suggestionsDict,
  profileCardDict,
}) => {
  const params = useParams();
  const locale = (
    Array.isArray(params.lang) ? params.lang[0] : params.lang || 'en'
  ) as 'he' | 'en';

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
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(
    null
  );

  const myTurnCount = activeSuggestions.filter((s) => {
    const isFirstParty = s.firstPartyId === userId;
    return (
      (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
      (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
    );
  }).length;

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
          fetch(`/api/suggestions/active`),
          fetch(`/api/suggestions/history`),
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
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
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
        } else {
          description = suggestionsDict.container.toasts.matchmakerNotified;
        }

        toast.success(
          statusMessages[newStatus] ||
            suggestionsDict.container.toasts.statusUpdateSuccess,
          { description }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : suggestionsDict.container.main.unknownError;
        toast.error(
          suggestionsDict.container.toasts.statusUpdateError.replace(
            '{error}',
            errorMessage
          )
        );
      }
    },
    [fetchSuggestions, suggestionsDict]
  );

  const handleRequestAction = useCallback(
    (suggestion: ExtendedMatchSuggestion, action: 'approve' | 'decline') => {
      setSuggestionForAction(suggestion);
      setActionType(action);
      setShowConfirmDialog(true);
    },
    []
  );

  const handleConfirmAction = useCallback(async () => {
    if (!suggestionForAction || !actionType) return;

    const isFirstParty = suggestionForAction.firstPartyId === userId;
    let newStatus = '';
    if (actionType === 'approve') {
      newStatus = isFirstParty
        ? 'FIRST_PARTY_APPROVED'
        : 'SECOND_PARTY_APPROVED';
    } else {
      newStatus = isFirstParty
        ? 'FIRST_PARTY_DECLINED'
        : 'SECOND_PARTY_DECLINED';
    }

    await handleStatusChange(suggestionForAction.id, newStatus);

    setShowConfirmDialog(false);
    setSuggestionForAction(null);
    setActionType(null);
  }, [suggestionForAction, actionType, userId, handleStatusChange]);

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

  const handleRefresh = useCallback(async () => {
    await fetchSuggestions(false);
    toast.success(suggestionsDict.container.toasts.refreshSuccessTitle, {
      description: suggestionsDict.container.toasts.refreshSuccessDescription,
    });
  }, [fetchSuggestions, suggestionsDict]);

  if (isLoading) {
    return <LoadingSkeleton dict={suggestionsDict.container.loading} />;
  }

  return (
    <div
      className={cn(
        // Background matching Hero: slate -> teal -> orange
        'min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/20',
        className
      )}
      dir={locale === 'he' ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-8">
        <WelcomeStats
          activeSuggestions={activeSuggestions}
          historySuggestions={historySuggestions}
          userId={userId}
          dict={suggestionsDict.container.stats}
        />

        {/* Main Card with glassmorphism effect */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl">
          {/* Card Header with Hero gradient */}
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
                    <Bell
                      className={cn(
                        'w-3 h-3',
                        locale === 'he' ? 'ml-1' : 'mr-1'
                      )}
                    />
                    {suggestionsDict.container.main.newSuggestions}
                  </Badge>
                )}
              </div>
              <div className="text-center flex-grow">
                <CardTitle className="text-xl font-bold text-gray-800">
                  {suggestionsDict.container.main.title}
                </CardTitle>
              </div>
              <div className="w-16"></div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              dir={locale === 'he' ? 'rtl' : 'ltr'}
              className="space-y-6"
            >
              <div className="flex justify-center">
                <TabsList className="grid grid-cols-3 bg-teal-50/50 rounded-2xl p-1 h-14 w-fit">
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
                      <Badge className="bg-teal-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {activeSuggestions.length}
                      </Badge>
                    )}
                  </TabsTrigger>

                  {/* Tab: Urgent (Orange) */}
                  {myTurnCount > 0 && (
                    <TabsTrigger
                      value="urgent"
                      className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                    >
                      <Zap className="w-5 h-5 text-orange-500" />
                      <span className="group-data-[state=active]:text-orange-700">
                        {suggestionsDict.container.main.tabs.urgent}
                      </span>
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6 animate-pulse shadow-lg">
                        {myTurnCount}
                      </Badge>
                    </TabsTrigger>
                  )}

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

              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                  dir={locale === 'he' ? 'rtl' : 'ltr'}
                >
                  <AlertCircle
                    className={cn('h-5 w-5', locale === 'he' ? 'ml-2' : 'mr-2')}
                  />
                  <AlertDescription className="text-red-800 font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="active" className="space-y-6">
                <SuggestionsList
                  locale={locale}
                  suggestions={activeSuggestions}
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

              <TabsContent value="urgent" className="space-y-6">
                <SuggestionsList
                  locale={locale}
                  suggestions={activeSuggestions.filter((s) => {
                    const isFirstParty = s.firstPartyId === userId;
                    return (
                      (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
                      (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
                    );
                  })}
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog with Hero-matching gradients */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="border-0 shadow-2xl rounded-2xl z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveTitle
                : suggestionsDict.container.dialogs.declineTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
              {actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveDescription
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
                  ? // Approve: Teal/Emerald gradient (matching Hero)
                    'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'
                  : // Decline: Rose/Red gradient (matching Hero)
                    'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
              )}
            >
              {actionType === 'approve' ? (
                <>
                  <CheckCircle
                    className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                  />
                  {suggestionsDict.container.dialogs.confirmApproval}
                </>
              ) : (
                <>
                  <XCircle
                    className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                  />
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
