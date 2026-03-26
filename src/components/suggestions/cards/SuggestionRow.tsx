// src/components/suggestions/cards/SuggestionRow.tsx

import React from 'react';
import Image from 'next/image';
import { User, Sparkles, Clock, AlertTriangle, MapPin, Briefcase, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, getRelativeCloudinaryPath, calculateAge } from '@/lib/utils';
import {
  getEnhancedStatusInfo,
  getPartyIndicator,
} from '@/lib/utils/suggestionUtils';
import CompactCardActions from './CompactCardActions';
import { SYSTEM_MATCHMAKER_ID } from '../constants';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

interface SuggestionRowProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onClick: (suggestion: ExtendedMatchSuggestion) => void;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onInterested?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  className?: string;
  isHistory?: boolean;
  isUserInActiveProcess?: boolean;
  isViewed?: boolean;
  actionLoading?: string | null;
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const SuggestionRow: React.FC<SuggestionRowProps> = ({
  suggestion,
  userId,
  onClick,
  onApprove,
  onInterested,
  onInquiry,
  onDecline,
  className,
  isHistory = false,
  isUserInActiveProcess = false,
  isViewed = true,
  actionLoading,
  dict,
  locale,
}) => {
  const isRtl = locale === 'he';
  const isFirstParty = suggestion.firstPartyId === userId;
  const targetParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;

  if (!targetParty || !targetParty.profile) return null;

  const mainImage = targetParty.images?.find((img) => img.isMain);
  const age = calculateAge(targetParty.profile.birthDate);
  const isDaily = suggestion.matchmakerId === SYSTEM_MATCHMAKER_ID;

  const statusInfo = getEnhancedStatusInfo(suggestion.status, isFirstParty, dict);
  const partyIndicator = getPartyIndicator(suggestion.status, isFirstParty, dict);

  const hasDeadline =
    suggestion.decisionDeadline &&
    new Date(suggestion.decisionDeadline) > new Date();
  const deadline = hasDeadline ? new Date(suggestion.decisionDeadline!) : null;
  const hoursLeft = deadline
    ? Math.max(0, Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60)))
    : null;
  const isUrgent = hoursLeft !== null && hoursLeft < 12;

  const matchingReason = suggestion.matchingReason
    ? suggestion.matchingReason.length > 100
      ? `${suggestion.matchingReason.substring(0, 100)}...`
      : suggestion.matchingReason
    : null;

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div
      className={cn(
        'group w-full bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        !isViewed && !isHistory ? 'border-teal-200 ring-1 ring-teal-100' : 'border-gray-100',
        isUrgent && !isDaily && 'border-amber-200 ring-1 ring-amber-100',
        isDaily && 'border-violet-200 ring-1 ring-violet-100',
        className,
      )}
    >
      {/* Main clickable area */}
      <button
        type="button"
        onClick={() => onClick(suggestion)}
        className="w-full text-start cursor-pointer focus:outline-none"
      >
        <div className="flex">
          {/* Image Section */}
          <div className="relative flex-shrink-0 w-28 sm:w-36">
            <div className="h-full min-h-[140px]">
              {mainImage?.url ? (
                <Image
                  src={getRelativeCloudinaryPath(mainImage.url)}
                  alt={targetParty.firstName}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 112px, 144px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />

              {/* Daily badge on image */}
              {isDaily && (
                <div className="absolute top-2 start-2">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              )}

              {/* Unread indicator */}
              {!isViewed && !isHistory && (
                <div className="absolute top-2 end-2">
                  <span className="block w-2.5 h-2.5 rounded-full bg-teal-500 shadow-md ring-2 ring-white" />
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col justify-between">
            {/* Top: Name + Status */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    {targetParty.firstName}
                    {targetParty.lastName ? ` ${targetParty.lastName.charAt(0)}.` : ''}
                  </h3>
                  {age > 0 && (
                    <span className="text-sm text-gray-500 font-medium flex-shrink-0">{age}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0 h-5 font-medium border',
                      statusInfo.className,
                    )}
                  >
                    <statusInfo.icon className={cn('w-2.5 h-2.5', isRtl ? 'ml-0.5' : 'mr-0.5')} />
                    {statusInfo.shortLabel}
                  </Badge>
                  {partyIndicator.show && (
                    <Badge className={cn('text-[10px] px-1.5 py-0 h-5 font-semibold', partyIndicator.className)}>
                      {partyIndicator.text}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Location + Occupation */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                {targetParty.profile?.city && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{targetParty.profile.city}</span>
                  </span>
                )}
                {targetParty.profile?.occupation && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <Briefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{targetParty.profile.occupation}</span>
                  </span>
                )}
              </div>

              {/* Matching reason */}
              {matchingReason && (
                <div className={cn(
                  'flex items-start gap-1.5 px-2.5 py-2 rounded-lg text-xs leading-relaxed',
                  isDaily
                    ? 'bg-violet-50/70 text-violet-700'
                    : 'bg-teal-50/70 text-teal-700',
                )}>
                  <Quote className={cn(
                    'w-3 h-3 mt-0.5 flex-shrink-0',
                    isDaily ? 'text-violet-400' : 'text-teal-400',
                  )} />
                  <span>{matchingReason}</span>
                </div>
              )}
            </div>

            {/* Bottom: Deadline + Matchmaker */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {/* Matchmaker info */}
                {!isDaily && suggestion.matchmaker && (
                  <span className="text-[10px] text-gray-400">
                    {dict.suggestedBy} {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
                  </span>
                )}
                {isDaily && (
                  <span className="text-[10px] text-violet-400 font-medium">
                    {locale === 'he' ? 'הצעה חכמה' : 'Smart Match'}
                  </span>
                )}
              </div>

              {/* Deadline */}
              {hasDeadline && !isHistory && hoursLeft !== null && (
                <div className="inline-flex items-center gap-1">
                  {isUrgent ? (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={cn('text-[10px] font-medium', isUrgent ? 'text-amber-600' : 'text-gray-400')}>
                    {hoursLeft < 1
                      ? (locale === 'he' ? 'פוקע בקרוב' : 'Expiring soon')
                      : hoursLeft < 24
                        ? (locale === 'he' ? `עוד ${hoursLeft} שעות` : `${hoursLeft}h left`)
                        : (locale === 'he' ? `עוד ${Math.floor(hoursLeft / 24)} ימים` : `${Math.floor(hoursLeft / 24)}d left`)}
                  </span>
                </div>
              )}

              {/* History arrow */}
              {isHistory && (
                <Chevron className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Action buttons footer */}
      {!isHistory && (
        <div
          className={cn(
            'px-3.5 sm:px-4 py-2.5 border-t flex items-center justify-between',
            isDaily
              ? 'bg-violet-50/30 border-violet-100'
              : 'bg-gray-50/50 border-gray-100',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CompactCardActions
            suggestion={suggestion}
            isFirstParty={isFirstParty}
            isUserInActiveProcess={isUserInActiveProcess}
            onApprove={onApprove}
            onInterested={onInterested}
            onInquiry={onInquiry}
            onDecline={onDecline}
            onClick={onClick}
            isLoading={actionLoading}
            dict={dict}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
};

export default SuggestionRow;
