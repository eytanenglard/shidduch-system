// src/components/suggestions/auto/AutoSuggestionsZone.tsx
// =============================================================================
// Dedicated zone for auto-suggestions with schedule info, active card,
// feedback dialog integration, and history section
// =============================================================================

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  X,
  Bookmark,
  History,
} from 'lucide-react';
import type { ExtendedMatchSuggestion } from '@/types/suggestions';
import AutoSuggestionFeedbackDialog from './AutoSuggestionFeedbackDialog';
import type { FeedbackData } from './AutoSuggestionFeedbackDialog';

// =============================================================================
// TYPES
// =============================================================================

interface AutoSuggestionsZoneProps {
  activeSuggestion: ExtendedMatchSuggestion | null;
  historySuggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
  dict: {
    title: string;
    subtitle: string;
    scheduleInfo: string;
    nextSuggestionIn: string;
    nextSuggestionTomorrow: string;
    nextSuggestionToday: string;
    noActiveSuggestion: string;
    waitingForSuggestion: string;
    viewSuggestion: string;
    approve: string;
    decline: string;
    saveForLater: string;
    history: {
      title: string;
      empty: string;
      approved: string;
      declined: string;
      interested: string;
      expired: string;
    };
    feedbackDialog: {
      titleApprove: string;
      titleDeclineStep1: string;
      titleDeclineStep2: string;
      titleInterested: string;
      subtitleApprove: string;
      subtitleDeclineStep1: string;
      subtitleDeclineStep2: string;
      likedTraits: Record<string, string>;
      missingTraits: Record<string, string>;
      freeTextPlaceholder: string;
      missingFreeTextPlaceholder: string;
      selectAtLeastOne: string;
      next: string;
      back: string;
      submitApprove: string;
      submitDecline: string;
      submitInterested: string;
      thankYou: string;
      thankYouDesc: string;
    };
  };
  onViewDetails: (suggestion: ExtendedMatchSuggestion) => void;
  onStatusChange: (suggestionId: string, newStatus: string, notes?: string) => Promise<void>;
}

// =============================================================================
// HELPERS
// =============================================================================

const calculateAge = (dateOfBirth?: Date | string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/** Calculate days until next Sunday (0) or Wednesday (3) */
const getNextSuggestionDay = (): { days: number; dayName: string } => {
  const now = new Date();
  const currentDay = now.getUTCDay();

  // Auto-suggestion days: Sunday (0) and Wednesday (3)
  const targetDays = [0, 3];
  let minDays = 7;

  for (const target of targetDays) {
    const diff = (target - currentDay + 7) % 7;
    const daysUntil = diff === 0 ? 0 : diff; // 0 means today
    if (daysUntil < minDays) minDays = daysUntil;
  }

  return {
    days: minDays,
    dayName: minDays === 0 ? 'today' : minDays === 1 ? 'tomorrow' : `${minDays}`,
  };
};

const getHistoryStatusBadge = (
  status: string,
  dict: { approved: string; declined: string; interested: string; expired: string }
) => {
  const statusMap: Record<string, { label: string; className: string }> = {
    FIRST_PARTY_APPROVED: { label: dict.approved, className: 'bg-green-100 text-green-700' },
    SECOND_PARTY_APPROVED: { label: dict.approved, className: 'bg-green-100 text-green-700' },
    FIRST_PARTY_DECLINED: { label: dict.declined, className: 'bg-rose-100 text-rose-700' },
    SECOND_PARTY_DECLINED: { label: dict.declined, className: 'bg-rose-100 text-rose-700' },
    FIRST_PARTY_INTERESTED: { label: dict.interested, className: 'bg-amber-100 text-amber-700' },
    EXPIRED: { label: dict.expired, className: 'bg-gray-100 text-gray-600' },
    CLOSED: { label: dict.declined, className: 'bg-gray-100 text-gray-600' },
    CANCELLED: { label: dict.declined, className: 'bg-gray-100 text-gray-600' },
  };
  return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
};

// =============================================================================
// COMPONENT
// =============================================================================

const AutoSuggestionsZone: React.FC<AutoSuggestionsZoneProps> = ({
  activeSuggestion,
  historySuggestions,
  userId,
  locale,
  dict,
  onViewDetails,
  onStatusChange,
}) => {
  const isRtl = locale === 'he';
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackDecision, setFeedbackDecision] = useState<'APPROVED' | 'DECLINED' | 'INTERESTED'>('APPROVED');

  const nextSuggestion = useMemo(() => getNextSuggestionDay(), []);

  // Get other party info from active suggestion
  const otherParty = useMemo(() => {
    if (!activeSuggestion) return null;
    const isFirstParty = activeSuggestion.firstPartyId === userId;
    return isFirstParty ? activeSuggestion.secondParty : activeSuggestion.firstParty;
  }, [activeSuggestion, userId]);

  const otherPartyAge = otherParty?.profile?.birthDate
    ? calculateAge(otherParty.profile.birthDate)
    : null;

  // Countdown text
  const countdownText = useMemo(() => {
    if (nextSuggestion.days === 0) return dict.nextSuggestionToday;
    if (nextSuggestion.days === 1) return dict.nextSuggestionTomorrow;
    return dict.nextSuggestionIn.replace('{days}', `${nextSuggestion.days}`);
  }, [nextSuggestion, dict]);

  // Handle action buttons
  const handleAction = useCallback((decision: 'APPROVED' | 'DECLINED' | 'INTERESTED') => {
    setFeedbackDecision(decision);
    setFeedbackOpen(true);
  }, []);

  // Handle feedback submit
  const handleFeedbackSubmit = useCallback(
    async (feedbackData: FeedbackData) => {
      if (!activeSuggestion) return;

      // 1. Save feedback via API
      await fetch(`/api/suggestions/${activeSuggestion.id}/auto-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      // 2. Transition status
      const statusMap: Record<string, string> = {
        APPROVED: activeSuggestion.firstPartyId === userId
          ? 'FIRST_PARTY_APPROVED'
          : 'SECOND_PARTY_APPROVED',
        DECLINED: activeSuggestion.firstPartyId === userId
          ? 'FIRST_PARTY_DECLINED'
          : 'SECOND_PARTY_DECLINED',
        INTERESTED: 'FIRST_PARTY_INTERESTED',
      };

      await onStatusChange(activeSuggestion.id, statusMap[feedbackData.decision]);
    },
    [activeSuggestion, userId, onStatusChange]
  );

  return (
    <div className="mb-6">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-indigo-50/80 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {dict.title}
              </h3>
              <p className="text-xs text-gray-500 leading-tight">{dict.subtitle}</p>
            </div>
            <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 text-[10px] px-2 py-0.5 flex-shrink-0">
              AI
            </Badge>
          </div>

          {/* Schedule info banner */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-violet-100/50 mb-3"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <Calendar className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span className="text-xs text-violet-700 font-medium">{dict.scheduleInfo}</span>
          </div>

          {/* Active auto-suggestion card */}
          {activeSuggestion ? (
            <div
              className="rounded-xl bg-white/80 border border-violet-100/50 p-4 space-y-3"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Other party info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-200 to-purple-300 flex items-center justify-center text-lg font-bold text-violet-700 flex-shrink-0">
                  {otherParty?.firstName?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {otherParty?.firstName}
                    {otherPartyAge ? ` (${otherPartyAge})` : ''}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {otherParty?.profile?.city || ''}
                    {otherParty?.profile?.occupation ? ` • ${otherParty.profile.occupation}` : ''}
                  </p>
                </div>
              </div>

              {/* Matching reason */}
              {activeSuggestion.matchingReason && (
                <p className="text-sm text-gray-600 leading-relaxed bg-violet-50/50 rounded-lg px-3 py-2">
                  {activeSuggestion.matchingReason}
                </p>
              )}

              {/* View details */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={() => onViewDetails(activeSuggestion)}
              >
                {dict.viewSuggestion}
              </Button>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAction('APPROVED')}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs"
                >
                  <Check className={cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1')} />
                  {dict.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('INTERESTED')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                >
                  <Bookmark className={cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1')} />
                  {dict.saveForLater}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('DECLINED')}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                >
                  <X className={cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1')} />
                  {dict.decline}
                </Button>
              </div>

              {/* Deadline */}
              {activeSuggestion.decisionDeadline && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {isRtl ? 'יש להגיב עד' : 'Respond by'}{' '}
                    {new Date(activeSuggestion.decisionDeadline).toLocaleDateString(
                      isRtl ? 'he-IL' : 'en-US',
                      { day: 'numeric', month: 'short' }
                    )}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* No active suggestion - show countdown */
            <div
              className="rounded-xl bg-white/60 border border-violet-100/50 p-4 text-center space-y-2"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <p className="text-sm text-gray-500">{dict.noActiveSuggestion}</p>
              <div className="flex items-center justify-center gap-1.5 text-violet-600 font-medium text-sm">
                <Clock className="w-4 h-4" />
                <span>{countdownText}</span>
              </div>
              <p className="text-xs text-gray-400">{dict.waitingForSuggestion}</p>
            </div>
          )}

          {/* History section (collapsible) */}
          {historySuggestions.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 w-full text-xs text-violet-600 hover:text-violet-700 font-medium py-1"
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <History className="w-3.5 h-3.5" />
                <span>{dict.history.title} ({historySuggestions.length})</span>
                {showHistory ? (
                  <ChevronUp className="w-3.5 h-3.5 mr-auto" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 mr-auto" />
                )}
              </button>

              {showHistory && (
                <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                  {historySuggestions.map((s) => {
                    const isFirstParty = s.firstPartyId === userId;
                    const party = isFirstParty ? s.secondParty : s.firstParty;
                    const age = calculateAge(party?.profile?.birthDate);
                    const badge = getHistoryStatusBadge(s.status, dict.history);

                    return (
                      <button
                        key={s.id}
                        onClick={() => onViewDetails(s)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 hover:bg-white/80 border border-violet-100/30 transition-colors text-start"
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600 flex-shrink-0">
                          {party?.firstName?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {party?.firstName}{age ? ` (${age})` : ''}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(s.createdAt).toLocaleDateString(
                              isRtl ? 'he-IL' : 'en-US',
                              { day: 'numeric', month: 'short' }
                            )}
                          </p>
                        </div>
                        <Badge className={cn('text-[10px] px-1.5 py-0 border-0', badge.className)}>
                          {badge.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <AutoSuggestionFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        suggestionId={activeSuggestion?.id || ''}
        decision={feedbackDecision}
        locale={locale}
        dict={dict.feedbackDialog}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default AutoSuggestionsZone;
