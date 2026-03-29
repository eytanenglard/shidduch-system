// src/components/suggestions/MatchSuggestionsContainer.tsx

'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'next/navigation';

import {
  History,
  AlertCircle,
  RefreshCw,
  Bell,
  CheckCircle,
  Target,
  XCircle,
  Bookmark,
  Star,
  Clock,
  Zap,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import SuggestionsList from './list/SuggestionsList';
import InterestedQueue from '@/components/suggestions/interested/InterestedQueue';
import SuggestionDetailsModal from '@/components/suggestions/modals/SuggestionDetailsModal';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import { cn } from '@/lib/utils';
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
import ActiveSuggestionHero from '@/components/suggestions/ActiveSuggestionHero';
import AutoSuggestionFeedbackDialog from '@/components/suggestions/auto/AutoSuggestionFeedbackDialog';
import DateFeedbackDialog from '@/components/suggestions/feedback/DateFeedbackDialog';

import { useSuggestions } from './hooks/useSuggestions';
import { useSuggestionActions } from './hooks/useSuggestionActions';


// --- Filter Type ---
type ActiveFilter = 'all' | 'active_process' | 'backup' | 'pending';


// --- Filter Chip ---
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
  label, count, isActive, onClick, icon: Icon, activeColors,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap',
      isActive
        ? `${activeColors} shadow-md scale-[1.02]`
        : 'bg-white/80 backdrop-blur-sm text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm hover:scale-[1.01]'
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    {count > 0 && (
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold transition-colors',
          isActive ? 'bg-white/30 text-current' : 'bg-gray-100 text-gray-600'
        )}
      >
        {count}
      </span>
    )}
  </button>
);

// --- Stats Summary ---
interface StatsSummaryProps {
  active: number;
  interested: number;
  pending: number;
  history: number;
  locale: 'he' | 'en';
}

const StatsSummary: React.FC<StatsSummaryProps> = ({
  active, interested, pending, history, locale,
}) => {
  const stats = locale === 'he'
    ? [
      { label: 'פעילות', value: active, color: 'text-teal-600' },
      { label: 'בהמתנה', value: interested, color: 'text-amber-600' },
      { label: 'ממתינות', value: pending, color: 'text-blue-600' },
      { label: 'היסטוריה', value: history, color: 'text-gray-500' },
    ]
    : [
      { label: 'Active', value: active, color: 'text-teal-600' },
      { label: 'Saved', value: interested, color: 'text-amber-600' },
      { label: 'Pending', value: pending, color: 'text-blue-600' },
      { label: 'History', value: history, color: 'text-gray-500' },
    ];

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-1.5">
          <span className={cn('text-lg font-bold', stat.color)}>{stat.value}</span>
          <span className="text-xs text-gray-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

// --- Props ---
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
  const rawParam = params?.locale || params?.lang;
  const localeString = Array.isArray(rawParam) ? rawParam[0] : rawParam;
  const locale: 'he' | 'en' = localeString === 'he' ? 'he' : 'en';
  const isRtl = locale === 'he';

  // --- Hooks ---
  const suggestions = useSuggestions({ userId, suggestionsDict });
  const actions = useSuggestionActions({
    userId,
    isRtl,
    suggestionsDict,
    fetchSuggestions: suggestions.fetchSuggestions,
  });

  // --- Questionnaire for modal ---
  const selectedQuestionnaire = useMemo(() => {
    if (!actions.selectedSuggestion) return null;
    const isFirst = actions.selectedSuggestion.firstPartyId === userId;
    const target = isFirst
      ? actions.selectedSuggestion.secondParty
      : actions.selectedSuggestion.firstParty;
    return target?.questionnaireResponses?.[0] ?? null;
  }, [actions.selectedSuggestion, userId]);

  // --- Local UI state ---
  const [activeTab, setActiveTab] = useState('active');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showChatFab, setShowChatFab] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);

  // Show FAB when chat panel is scrolled out of view and chat is closed
  useEffect(() => {
    const el = chatPanelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowChatFab(!entry.isIntersecting && !isChatOpen),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isChatOpen]);

  const handleOpenChat = useCallback(() => {
    chatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Small delay for scroll, then the panel will pick up the open state
    setTimeout(() => {
      setIsChatOpen(true);
    }, 300);
  }, []);

  const handleFilterToggle = (filter: ActiveFilter) => {
    setActiveFilter((prev) => (prev === filter ? 'all' : filter));
  };

  // --- Filter visibility ---
  const showInterestedQueue = activeFilter === 'all' || activeFilter === 'backup';
  const showPendingSuggestions = activeFilter === 'all' || activeFilter === 'pending';

  // --- Loading ---
  if (suggestions.isLoading) {
    return (
      <StandardizedLoadingSpinner
        text={suggestionsDict.container.loading.title}
        subtext={suggestionsDict.container.loading.subtitle}
        className="min-h-[60vh]"
      />
    );
  }

  // --- Filter labels ---
  const filterLabels = {
    active_process: suggestionsDict.container.filters.activeProcess,
    backup: suggestionsDict.container.filters.backup,
    pending: suggestionsDict.container.filters.pending,
  };

  // --- Render ---
  return (
    <div
      className={cn('min-h-screen bg-gradient-to-b from-slate-50 via-gray-50 to-white', className)}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-[900px] mx-auto px-4 py-6 space-y-6">

        {/* Page Header — hero style with gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-teal-50/30 border border-gray-100/80 p-5 shadow-sm">
          {/* Subtle background orbs */}
          <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-amber-100/20 blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {suggestionsDict.container.main.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {suggestions.hasNewSuggestions && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs shadow-md shadow-amber-500/25">
                    <Bell className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                    {suggestionsDict.container.main.newSuggestions}
                  </Badge>
                </motion.div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={suggestions.handleRefresh}
                disabled={suggestions.isRefreshing}
                className="rounded-xl h-9 w-9 hover:bg-white/80 backdrop-blur-sm"
                aria-label={suggestionsDict.container.main.refreshAriaLabel}
              >
                <RefreshCw className={cn('h-4 w-4 text-gray-500', suggestions.isRefreshing && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Stats summary bar */}
          <StatsSummary
            active={suggestions.activeProcessSuggestion ? 1 : 0}
            interested={suggestions.interestedSuggestions.length}
            pending={suggestions.sortedActiveSuggestions.length}
            history={suggestions.matchmakerHistorySuggestions.length}
            locale={locale}
          />
        </div>

        {/* Auto-Suggestions Zone */}
        <AutoSuggestionsZone
          activeSuggestion={suggestions.dailySuggestion || null}
          historySuggestions={suggestions.autoSuggestionHistory}
          userId={userId}
          locale={locale}
          dict={suggestionsDict.container.autoSuggestions}
          onViewDetails={actions.handleViewDetails}
          onStatusChange={actions.handleStatusChange}
        />

        {/* Preference Toggle */}
        <FirstPartyPreferenceToggle initialValue={wantsToBeFirstParty} locale={locale} />

        {/* Active Process Banner */}
        {suggestions.activeProcessSuggestion && (
          <ActiveSuggestionHero
            suggestion={suggestions.activeProcessSuggestion}
            userId={userId}
            locale={locale}
            onViewDetails={actions.handleViewDetails}
            onContactMatchmaker={(s) => {
              actions.handleViewDetails(s);
            }}
          />
        )}

        {/* Date Feedback CTA */}
        {suggestions.datingSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden flex items-center gap-3 p-4 rounded-2xl border border-rose-200/50 shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50/50 to-white" />
            <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-rose-100/40 blur-2xl pointer-events-none" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-400/25">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="relative flex-1">
              <h4 className="text-sm font-bold text-rose-800">
                {suggestionsDict.container.dateFeedback.title}
              </h4>
              <p className="text-xs text-rose-600/80">
                {suggestionsDict.container.dateFeedback.description}
              </p>
            </div>
            <Button
              size="sm"
              className="relative bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs px-4 shadow-md shadow-rose-500/25 hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              onClick={() => actions.setShowDateFeedbackDialog(true)}
            >
              <MessageCircle className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
              {suggestionsDict.container.dateFeedback.shareButton}
            </Button>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => { setActiveTab(val); }}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-2 bg-white/80 backdrop-blur-sm rounded-xl p-1.5 h-12 w-full shadow-sm border border-gray-100/80">
            <TabsTrigger
              value="active"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-teal-500/25 font-medium text-sm"
            >
              <Target className="w-4 h-4" />
              {suggestionsDict.container.main.tabs.active}
              {suggestions.matchmakerActiveSuggestions.length > 0 && (
                <Badge
                  className={cn(
                    'border-0 px-1.5 py-0 text-[10px] font-bold rounded-full min-w-[20px] h-5',
                    suggestions.urgentCount > 0 ? 'bg-amber-500 text-white' : 'bg-white/30 text-current'
                  )}
                >
                  {suggestions.matchmakerActiveSuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-gray-700 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-500/25 font-medium text-sm"
            >
              <History className="w-4 h-4" />
              {suggestionsDict.container.main.tabs.history}
              {suggestions.matchmakerHistorySuggestions.length > 0 && (
                <Badge className="bg-white/30 text-current border-0 px-1.5 py-0 text-[10px] font-bold rounded-full min-w-[20px] h-5">
                  {suggestions.matchmakerHistorySuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Error */}
          {suggestions.error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50" dir={isRtl ? 'rtl' : 'ltr'}>
              <AlertCircle className={cn('h-4 w-4', isRtl ? 'ml-2' : 'mr-2')} />
              <AlertDescription className="text-red-800 text-sm">{suggestions.error}</AlertDescription>
            </Alert>
          )}

          {/* Tab Content with Animation */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-4"
            >
              {activeTab === 'active' ? (
                <ErrorBoundary>
                  {/* Filter Chips */}
                  {(suggestions.activeProcessSuggestion || suggestions.interestedSuggestions.length > 0 || suggestions.sortedActiveSuggestions.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        label={filterLabels.active_process}
                        count={suggestions.activeProcessSuggestion ? 1 : 0}
                        isActive={activeFilter === 'active_process'}
                        onClick={() => handleFilterToggle('active_process')}
                        icon={Star}
                        activeColors="bg-teal-600 text-white border-teal-600"
                        locale={locale}
                      />
                      <FilterChip
                        label={filterLabels.backup}
                        count={suggestions.interestedSuggestions.length}
                        isActive={activeFilter === 'backup'}
                        onClick={() => handleFilterToggle('backup')}
                        icon={Bookmark}
                        activeColors="bg-amber-500 text-white border-amber-500"
                        locale={locale}
                      />
                      <FilterChip
                        label={filterLabels.pending}
                        count={suggestions.sortedActiveSuggestions.length}
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
                          {suggestionsDict.container.filters.showAll}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Interested Queue */}
                  {showInterestedQueue && suggestions.interestedSuggestions.length > 0 && (
                    <InterestedQueue
                      suggestions={suggestions.interestedSuggestions}
                      userId={userId}
                      locale={locale}
                      isUserInActiveProcess={suggestions.isUserInActiveProcess}
                      onActivate={actions.handleActivateInterested}
                      onRemove={actions.handleRemoveFromInterested}
                      onViewDetails={actions.handleViewDetails}
                      onRankUpdate={actions.handleRankUpdate}
                    />
                  )}

                  {/* Suggestions List */}
                  {showPendingSuggestions && (
                    <SuggestionsList
                      locale={locale}
                      suggestions={suggestions.sortedActiveSuggestions}
                      userId={userId}
                      isLoading={suggestions.isRefreshing}
                      onActionRequest={actions.handleRequestAction}
                      onOpenDetails={actions.handleViewDetails}
                      isUserInActiveProcess={suggestions.isUserInActiveProcess}
                      suggestionsDict={suggestionsDict}
                    />
                  )}

                  {/* Empty filter state */}
                  {activeFilter !== 'all' &&
                    ((activeFilter === 'active_process' && !suggestions.activeProcessSuggestion) ||
                      (activeFilter === 'backup' && suggestions.interestedSuggestions.length === 0) ||
                      (activeFilter === 'pending' && suggestions.sortedActiveSuggestions.length === 0)) && (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          {activeFilter === 'active_process' && <Star className="w-7 h-7 text-gray-300" />}
                          {activeFilter === 'backup' && <Bookmark className="w-7 h-7 text-gray-300" />}
                          {activeFilter === 'pending' && <Clock className="w-7 h-7 text-gray-300" />}
                        </div>
                        <h3 className="text-base font-semibold text-gray-600 mb-2">
                          {activeFilter === 'active_process' && suggestionsDict.container.filters.emptyActiveProcess}
                          {activeFilter === 'backup' && suggestionsDict.container.filters.emptyBackup}
                          {activeFilter === 'pending' && suggestionsDict.container.filters.emptyPending}
                        </h3>
                        <button
                          onClick={() => setActiveFilter('all')}
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2"
                        >
                          {suggestionsDict.container.filters.backToFullView}
                        </button>
                      </div>
                    )}
                </ErrorBoundary>
              ) : (
                <ErrorBoundary>
                  <SuggestionsList
                    locale={locale}
                    suggestions={suggestions.matchmakerHistorySuggestions}
                    userId={userId}
                    isLoading={suggestions.isRefreshing}
                    isHistory={true}
                    onActionRequest={actions.handleRequestAction}
                    onOpenDetails={actions.handleViewDetails}
                    isUserInActiveProcess={suggestions.isUserInActiveProcess}
                    suggestionsDict={suggestionsDict}
                  />
                </ErrorBoundary>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* AI Chat - at the bottom */}
        <AiChatPanel
          locale={locale}
          panelRef={chatPanelRef}
          initialOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
        />
      </div>

      {/* Detail Modal */}
      <SuggestionDetailsModal
        suggestion={actions.selectedSuggestion}
        userId={userId}
        isOpen={actions.showDetailsPanel}
        onClose={actions.handleCloseDetailsPanel}
        onActionRequest={actions.handleRequestAction}
        onRefresh={() => suggestions.fetchSuggestions(false)}
        isUserInActiveProcess={suggestions.isUserInActiveProcess}
        questionnaire={selectedQuestionnaire}
        locale={locale}
        dict={{ suggestions: suggestionsDict, profileCard: profileCardDict }}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={actions.showConfirmDialog} onOpenChange={actions.setShowConfirmDialog}>
        <AlertDialogContent className="border border-gray-100 shadow-2xl rounded-2xl z-[9999]">
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shadow-md',
                actions.actionType === 'approve'
                  ? 'bg-gradient-to-br from-teal-400 to-emerald-400 shadow-teal-400/25'
                  : actions.actionType === 'interested'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-amber-400/25'
                    : 'bg-gradient-to-br from-rose-400 to-pink-400 shadow-rose-400/25'
              )}>
                {actions.actionType === 'approve'
                  ? <CheckCircle className="w-7 h-7 text-white" />
                  : actions.actionType === 'interested'
                    ? <Bookmark className="w-7 h-7 text-white" />
                    : <XCircle className="w-7 h-7 text-white" />
                }
              </div>
            </div>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {actions.actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveTitle
                : actions.actionType === 'interested'
                  ? suggestionsDict.container.dialogs.interestedTitle
                  : suggestionsDict.container.dialogs.declineTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-500 leading-relaxed">
              {actions.actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveDescription
                : actions.actionType === 'interested'
                  ? suggestionsDict.container.dialogs.interestedDescription
                  : suggestionsDict.container.dialogs.declineDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-2">
            <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50">
              {suggestionsDict.container.dialogs.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={actions.handleConfirmAction}
              className={cn(
                'rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                actions.actionType === 'approve'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/25'
                  : actions.actionType === 'interested'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 shadow-amber-400/25'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-rose-500/25'
              )}
            >
              {actions.actionType === 'approve' ? (
                <>
                  <CheckCircle className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')} />
                  {suggestionsDict.container.dialogs.confirmApproval}
                </>
              ) : actions.actionType === 'interested' ? (
                <>
                  <Bookmark className={cn('w-4 h-4', isRtl ? 'ml-2' : 'mr-2')} />
                  {suggestionsDict.container.dialogs.confirmInterested}
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

      {/* Feedback Dialog */}
      <AutoSuggestionFeedbackDialog
        open={actions.showFeedbackDialog}
        onOpenChange={(open) => {
          actions.setShowFeedbackDialog(open);
          if (!open) actions.resetDialogState();
        }}
        suggestionId={actions.suggestionForAction?.id || ''}
        decision={actions.feedbackDecision}
        locale={locale}
        dict={suggestionsDict.container.autoSuggestions.feedbackDialog}
        onSubmit={actions.handleFeedbackSubmit}
      />

      {/* Date Feedback Dialog */}
      <DateFeedbackDialog
        open={actions.showDateFeedbackDialog}
        onOpenChange={actions.setShowDateFeedbackDialog}
        suggestion={suggestions.datingSuggestion}
        userId={userId}
        locale={locale}
        onSubmit={actions.handleDateFeedbackSubmit}
      />

      {/* Floating AI Chat FAB */}
      <AnimatePresence>
        {showChatFab && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={handleOpenChat}
            className={cn(
              'fixed bottom-6 z-50 w-14 h-14 rounded-2xl',
              'bg-gradient-to-br from-violet-500 to-purple-600 text-white',
              'shadow-xl shadow-violet-500/30',
              'hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-110',
              'transition-all duration-200 flex items-center justify-center',
              isRtl ? 'left-6' : 'right-6',
            )}
            aria-label={suggestionsDict.container.chatFab.ariaLabel}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchSuggestionsContainer;
