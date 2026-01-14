// src/components/suggestions/MatchSuggestionsContainer.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'next/navigation';
import {
  History,
  AlertCircle,
  RefreshCw,
  Bell,
  CheckCircle,
  Target,
  Zap,
  XCircle,
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
// HELPER COMPONENTS
// =============================================================================

// --- Minimal Skeleton Loading ---
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/20 p-4 md:p-8">
    <div className="container mx-auto max-w-6xl space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded-full w-8 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-[400px] border-0 shadow-lg bg-white rounded-2xl animate-pulse"
          ></div>
        ))}
      </div>
    </div>
  </div>
);

interface MatchSuggestionsContainerProps {
  userId: string;
  className?: string;
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const MatchSuggestionsContainer: React.FC<MatchSuggestionsContainerProps> = ({
  userId,
  className,
  suggestionsDict,
  profileCardDict,
}) => {
  const params = useParams();
  
  // נסיון לזהות שפה, ברירת מחדל לעברית אם יש ספק, כדי למנוע בעיות RTL
  const locale = (
    Array.isArray(params.lang) ? params.lang[0] : params.lang || 'he'
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

  // Action Dialog State
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [suggestionForAction, setSuggestionForAction] =
    useState<ExtendedMatchSuggestion | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'decline' | null>(
    null
  );

  // Calculate "My Turn" items (Urgent)
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

        if (showLoadingState) {
          const urgentCount = activeData.suggestions.filter((s: ExtendedMatchSuggestion) => {
            const isFirstParty = s.firstPartyId === userId;
            return (
              (s.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
              (s.status === 'PENDING_SECOND_PARTY' && !isFirstParty)
            );
          }).length;
          
          if (urgentCount > 0) {
             setActiveTab('urgent');
          }
        }

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
    [activeSuggestions.length, suggestionsDict, userId]
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
    fetchSuggestions(true);
    const intervalId = setInterval(
      () => fetchSuggestions(false),
      5 * 60 * 1000
    );
    return () => clearInterval(intervalId);
  }, [fetchSuggestions]);

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
    return <LoadingSkeleton />;
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/20',
        className
      )}
      dir={locale === 'he' ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        
        {/* COMPACT HEADER - FIXED ALIGNMENT */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          
          {/* כותרת: הוספתי text-right ושליטה ברוחב כדי להבטיח שבעברית זה בימין */}
          <div className={cn("flex-1", locale === 'he' ? 'text-right' : 'text-left')}>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
               <Target className="w-6 h-6 text-teal-600 hidden md:block" />
               {suggestionsDict.container.main.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {suggestionsDict.container.stats.subtitle}
            </p>
          </div>

          {/* כפתורים: הוספתי יישור עצמי כדי שבעברית יהיו בשמאל (בסוף השורה) */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {hasNewSuggestions && (
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg animate-pulse transition-all px-3 py-1.5">
                <Bell className={cn('w-3.5 h-3.5', locale === 'he' ? 'ml-1.5' : 'mr-1.5')} />
                {suggestionsDict.container.main.newSuggestions}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-full border-gray-200 hover:bg-white hover:text-teal-600 shadow-sm"
              aria-label={suggestionsDict.container.main.refreshAriaLabel}
            >
               <RefreshCw
                 className={cn(
                   'h-4 w-4',
                   locale === 'he' ? 'ml-2' : 'mr-2',
                   isRefreshing && 'animate-spin'
                 )}
               />
               {isRefreshing ? '...' : suggestionsDict.container.main.refreshAriaLabel}
            </Button>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
            <Alert
              variant="destructive"
              className="border-red-200 bg-red-50 mb-6 shadow-sm"
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

        {/* CONTENT TABS */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className="space-y-6"
        >
          {/* מיכל לטאבים כדי לוודא יישור נכון בעברית (Start = ימין) */}
          <div className={cn("flex pb-2 scrollbar-none", locale === 'he' ? 'justify-start' : 'justify-start')}>
            <TabsList className="bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-gray-100/50 shadow-sm h-auto inline-flex">
              {/* Tab: Urgent */}
              {myTurnCount > 0 && (
                <TabsTrigger
                  value="urgent"
                  className="rounded-xl px-4 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-medium text-gray-600"
                >
                  <Zap className={cn("w-4 h-4", locale === 'he' ? 'ml-2' : 'mr-2')} />
                  {suggestionsDict.container.main.tabs.urgent}
                  <Badge className="bg-white/20 text-white border-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[20px] h-5 mx-2">
                    {myTurnCount}
                  </Badge>
                </TabsTrigger>
              )}

              {/* Tab: Active */}
              <TabsTrigger
                value="active"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-md data-[state=active]:border-teal-100 transition-all font-medium text-gray-600"
              >
                <Target className={cn("w-4 h-4", locale === 'he' ? 'ml-2' : 'mr-2')} />
                {suggestionsDict.container.main.tabs.active}
                {activeSuggestions.length > 0 && (
                  <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[20px] h-5 mx-2">
                    {activeSuggestions.length}
                  </Badge>
                )}
              </TabsTrigger>

              {/* Tab: History */}
              <TabsTrigger
                value="history"
                className="rounded-xl px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:text-gray-800 data-[state=active]:shadow-md transition-all font-medium text-gray-600"
              >
                <History className={cn("w-4 h-4", locale === 'he' ? 'ml-2' : 'mr-2')} />
                {suggestionsDict.container.main.tabs.history}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="space-y-6 mt-0 focus-visible:outline-none">
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

          <TabsContent value="urgent" className="space-y-6 mt-0 focus-visible:outline-none">
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

          <TabsContent value="history" className="space-y-6 mt-0 focus-visible:outline-none">
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
      </div>

      {/* CONFIRMATION DIALOG */}
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
            <AlertDialogCancel className="rounded-xl mt-0">
              {suggestionsDict.container.dialogs.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={cn(
                'rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300',
                actionType === 'approve'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
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