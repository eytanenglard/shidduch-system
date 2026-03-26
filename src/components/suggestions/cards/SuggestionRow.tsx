// src/components/suggestions/cards/SuggestionRow.tsx

import React from 'react';
import Image from 'next/image';
import { User, Sparkles, Clock, AlertTriangle } from 'lucide-react';
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
    ? suggestion.matchingReason.length > 60
      ? `${suggestion.matchingReason.substring(0, 60)}...`
      : suggestion.matchingReason
    : null;

  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      className={cn(
        'w-full bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer text-start',
        !isViewed && !isHistory && 'border-teal-300 bg-teal-50/30',
        isUrgent && !isDaily && 'border-amber-300',
        className,
      )}
    >
      <div className="flex items-center gap-3 p-4 sm:gap-4">
        {/* Unread dot */}
        <div className="flex-shrink-0 w-2">
          {!isViewed && !isHistory && (
            <span className="block w-2 h-2 rounded-full bg-teal-500" />
          )}
        </div>

        {/* Photo */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
            {mainImage?.url ? (
              <Image
                src={getRelativeCloudinaryPath(mainImage.url)}
                alt={targetParty.firstName}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>
          {isDaily && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {targetParty.firstName}
              {targetParty.lastName ? ` ${targetParty.lastName.charAt(0)}.` : ''}
            </h3>
            {age > 0 && (
              <span className="text-sm text-gray-500">{age}</span>
            )}
            {/* Status badge */}
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

          {/* Location + Occupation */}
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
            {targetParty.profile?.city && (
              <span className="truncate max-w-[120px]">{targetParty.profile.city}</span>
            )}
            {targetParty.profile?.city && targetParty.profile?.occupation && (
              <span className="text-gray-300">·</span>
            )}
            {targetParty.profile?.occupation && (
              <span className="truncate max-w-[120px]">{targetParty.profile.occupation}</span>
            )}
          </div>

          {/* Matching reason */}
          {matchingReason && (
            <p className="mt-1 text-xs text-gray-400 truncate leading-snug">
              {matchingReason}
            </p>
          )}

          {/* Deadline badge */}
          {hasDeadline && !isHistory && hoursLeft !== null && (
            <div className="mt-1.5 inline-flex items-center gap-1">
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
        </div>

        {/* Actions */}
        {!isHistory && (
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

        {/* History status indicator */}
        {isHistory && (
          <div className="flex-shrink-0">
            <Badge
              variant="outline"
              className={cn('text-xs font-medium', statusInfo.className)}
            >
              {statusInfo.shortLabel}
            </Badge>
          </div>
        )}
      </div>

      {/* Matchmaker info (subtle) */}
      {!isDaily && suggestion.matchmaker && (
        <div className="px-4 pb-3 -mt-1">
          <span className="text-[10px] text-gray-400">
            {dict.suggestedBy} {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
          </span>
        </div>
      )}
    </button>
  );
};

export default SuggestionRow;
