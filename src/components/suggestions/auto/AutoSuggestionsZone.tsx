// src/components/suggestions/auto/AutoSuggestionsZone.tsx
// =============================================================================
// Dedicated zone for auto-suggestions with schedule info, active card,
// feedback dialog integration, and history section
// =============================================================================

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
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

  // Get other party info from active suggestion
  const otherParty = useMemo(() => {
    if (!activeSuggestion) return null;
    const isFirstParty = activeSuggestion.firstPartyId === userId;
    return isFirstParty ? activeSuggestion.secondParty : activeSuggestion.firstParty;
  }, [activeSuggestion, userId]);

  const otherPartyAge = otherParty?.profile?.birthDate
    ? calculateAge(otherParty.profile.birthDate)
    : null;

  const otherPartyImage = useMemo(() => {
    if (!otherParty?.images?.length) return null;
    const mainImg = otherParty.images.find((img: { isMain?: boolean }) => img.isMain);
    return (mainImg || otherParty.images[0])?.url || null;
  }, [otherParty]);

  // Handle action buttons
  const handleAction = useCallback((decision: 'APPROVED' | 'DECLINED' | 'INTERESTED') => {
    setFeedbackDecision(decision);
    setFeedbackOpen(true);
  }, []);

  // Handle feedback submit
  const handleFeedbackSubmit = useCallback(
    async (feedbackData: FeedbackData) => {
      if (!activeSuggestion) return;

      try {
        // 1. Save feedback via API
        const response = await fetch(`/api/suggestions/${activeSuggestion.id}/auto-feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to save feedback (${response.status})`);
        }

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
      } catch (error) {
        console.error('[AutoSuggestion] Feedback submit failed:', error);
        // Re-throw so the dialog can show error state
        throw error;
      }
    },
    [activeSuggestion, userId, onStatusChange]
  );

  // Don't render anything if there's no active suggestion
  if (!activeSuggestion) return null;

  return (
    <div className="mb-6">
      <Card className="border-0 shadow-sm bg-violet-50 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-violet-700">
                {dict.title}
              </h3>
              <p className="text-xs text-gray-500 leading-tight">{dict.subtitle}</p>
            </div>
            <Badge className="bg-violet-600 text-white border-0 text-[10px] px-2 py-0.5 flex-shrink-0">
              AI
            </Badge>
          </div>

          {/* Schedule info banner */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-violet-100 mb-3"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <Calendar className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span className="text-xs text-violet-700 font-medium">{dict.scheduleInfo}</span>
          </div>

          {/* Active auto-suggestion card */}
          {activeSuggestion && (
            <div
              className="rounded-2xl bg-white border border-violet-100 overflow-hidden"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Card with image */}
              <button
                type="button"
                onClick={() => onViewDetails(activeSuggestion)}
                className="w-full text-start cursor-pointer focus:outline-none group"
              >
                <div className="flex">
                  {/* Image */}
                  <div className="relative flex-shrink-0 w-28 sm:w-32 overflow-hidden">
                    <div className="relative h-full min-h-[130px]">
                      {otherPartyImage ? (
                        <Image
                          src={getRelativeCloudinaryPath(otherPartyImage)}
                          alt={otherParty?.firstName || ''}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 112px, 128px"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                          <span className="text-3xl font-bold text-violet-400">
                            {otherParty?.firstName?.[0] || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 p-3.5">
                    <p className="text-base font-bold text-gray-900 truncate">
                      {otherParty?.firstName}
                      {otherPartyAge ? <span className="text-sm font-medium text-gray-500 ms-1.5">{otherPartyAge}</span> : ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {otherParty?.profile?.city || ''}
                      {otherParty?.profile?.occupation ? ` · ${otherParty.profile.occupation}` : ''}
                    </p>

                    {/* Matching reason */}
                    {activeSuggestion.matchingReason && (
                      <p className="mt-2 text-xs text-violet-700 leading-relaxed bg-violet-50 rounded-lg px-2.5 py-1.5 line-clamp-2">
                        {activeSuggestion.matchingReason}
                      </p>
                    )}

                    {/* Deadline */}
                    {activeSuggestion.decisionDeadline && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
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
                </div>
              </button>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2 px-3.5 py-2.5 border-t border-violet-100 bg-violet-50/30">
                <Button
                  size="sm"
                  onClick={() => handleAction('APPROVED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg"
                >
                  <Check className={cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1')} />
                  {dict.approve}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('INTERESTED')}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs rounded-lg"
                >
                  <Bookmark className={cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1')} />
                  {dict.saveForLater}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction('DECLINED')}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs rounded-lg"
                >
                  <X className={cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1')} />
                  {dict.decline}
                </Button>
              </div>
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-violet-50 border border-violet-100 transition-colors text-start"
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
