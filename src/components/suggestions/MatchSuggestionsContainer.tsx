// src/components/suggestions/MatchSuggestionsContainer.tsx

'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
    return <LoadingSkeleton dict={suggestionsDict.container.loading} />;
  }

  // --- Filter labels ---
  const filterLabels = {
    active_process: isRtl ? 'הצעה פעילה' : 'Active',
    backup: isRtl ? 'רשימת גיבוי' : 'Backup',
    pending: isRtl ? 'ממתינות לתגובה' : 'Pending',
  };

  // --- Render ---
  return (
    <div
      className={cn('min-h-screen bg-gray-50', className)}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-[900px] mx-auto px-4 py-6 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {suggestionsDict.container.main.title}
          </h1>
          <div className="flex items-center gap-2">
            {suggestions.hasNewSuggestions && (
              <Badge className="bg-amber-500 text-white border-0 text-xs animate-pulse">
                <Bell className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                {suggestionsDict.container.main.newSuggestions}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={suggestions.handleRefresh}
              disabled={suggestions.isRefreshing}
              className="rounded-lg h-9 w-9 hover:bg-gray-200"
              aria-label={suggestionsDict.container.main.refreshAriaLabel}
            >
              <RefreshCw className={cn('h-4 w-4 text-gray-600', suggestions.isRefreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Auto-Suggestions Zone */}
        <AutoSuggestionsZone
          activeSuggestion={suggestions.dailySuggestion || null}
          historySuggestions={suggestions.autoSuggestionHistory}
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
          <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-800">
                {isRtl ? 'איך היה הדייט?' : 'How was the date?'}
              </h4>
              <p className="text-xs text-rose-600">
                {isRtl ? 'הפידבק שלך יעזור לנו להציע הצעות טובות יותר' : 'Your feedback helps us suggest better matches'}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs px-4"
              onClick={() => actions.setShowDateFeedbackDialog(true)}
            >
              <MessageCircle className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
              {isRtl ? 'שתף/י' : 'Share'}
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => { setActiveTab(val); }}
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
              {suggestions.matchmakerActiveSuggestions.length > 0 && (
                <Badge
                  className={cn(
                    'text-white border-0 px-1.5 py-0 text-[10px] font-bold rounded-full min-w-[20px] h-5',
                    suggestions.urgentCount > 0 ? 'bg-amber-500' : 'bg-teal-600'
                  )}
                >
                  {suggestions.matchmakerActiveSuggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium text-sm"
            >
              <History className="w-4 h-4 text-gray-500" />
              {suggestionsDict.container.main.tabs.history}
              {suggestions.matchmakerHistorySuggestions.length > 0 && (
                <Badge className="bg-gray-500 text-white border-0 px-1.5 py-0 text-[10px] font-bold rounded-full min-w-[20px] h-5">
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

          {/* Active Tab */}
          <TabsContent value="active" className="space-y-4">
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
                      {isRtl ? 'הצג הכל' : 'Show all'}
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

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
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
          </TabsContent>
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
        <AlertDialogContent className="border border-gray-200 shadow-lg rounded-xl z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center">
              {actions.actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveTitle
                : actions.actionType === 'interested'
                  ? isRtl ? 'שמירה לגיבוי' : 'Save for later'
                  : suggestionsDict.container.dialogs.declineTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
              {actions.actionType === 'approve'
                ? suggestionsDict.container.dialogs.approveDescription
                : actions.actionType === 'interested'
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
              onClick={actions.handleConfirmAction}
              className={cn(
                'rounded-lg font-medium transition-all',
                actions.actionType === 'approve'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : actions.actionType === 'interested'
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-rose-600 hover:bg-rose-700'
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
      {showChatFab && (
        <button
          onClick={handleOpenChat}
          className={cn(
            'fixed bottom-6 z-50 w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg',
            'hover:bg-violet-700 hover:shadow-xl hover:scale-105',
            'transition-all duration-200 flex items-center justify-center',
            'animate-in fade-in-0 slide-in-from-bottom-4 duration-300',
            isRtl ? 'left-6' : 'right-6',
          )}
          aria-label={isRtl ? 'עוזר חכם' : 'Smart assistant'}
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default MatchSuggestionsContainer;
