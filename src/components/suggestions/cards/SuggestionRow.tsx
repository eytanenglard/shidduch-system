// src/components/suggestions/cards/SuggestionRow.tsx

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, Sparkles, MapPin, Briefcase, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, getRelativeCloudinaryPath, calculateAge } from '@/lib/utils';
import {
  getEnhancedStatusInfo,
  getPartyIndicator,
} from '@/lib/utils/suggestionUtils';
import CompactCardActions from './CompactCardActions';
import CardCountdown from './CardCountdown';
import MiniTimeline from '../timeline/MiniTimeline';
import { SYSTEM_MATCHMAKER_ID } from '../constants';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict, SuggestionTimelineDict } from '@/types/dictionary';

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
  timelineDict?: SuggestionTimelineDict;
  locale: 'he' | 'en';
  index?: number;
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
  timelineDict,
  locale,
  index = 0,
}) => {
  const isRtl = locale === 'he';
  const [isReasonExpanded, setIsReasonExpanded] = useState(false);

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

  const matchingReason = suggestion.matchingReason || null;
  const isLongReason = matchingReason ? matchingReason.length > 100 : false;

  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay: index * 0.06 }}
    >
      <div
        className={cn(
          'group w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
          !isViewed && !isHistory ? 'border-teal-200 ring-2 ring-teal-100/50 shadow-teal-100/30' : 'border-gray-100/80',
          isDaily && 'border-violet-200 ring-2 ring-violet-100/50 shadow-violet-100/30',
          className,
        )}
      >
        {/* Main clickable area */}
        <button
          type="button"
          onClick={() => onClick(suggestion)}
          className="w-full text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-t-2xl"
        >
          <div className="flex">
            {/* Image Section — bigger with name overlay */}
            <div className="relative flex-shrink-0 w-32 sm:w-40">
              <div className="h-full min-h-[160px]">
                {mainImage?.url ? (
                  <Image
                    src={getRelativeCloudinaryPath(mainImage.url)}
                    alt={targetParty.firstName}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 128px, 160px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-300" />
                  </div>
                )}
                {/* Rich gradient overlay from bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                {/* Name + Age overlay on image */}
                <div className="absolute bottom-0 inset-x-0 p-2.5">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-base font-bold text-white drop-shadow-md truncate">
                      {targetParty.firstName}
                      {targetParty.lastName ? ` ${targetParty.lastName.charAt(0)}.` : ''}
                    </h3>
                    {age > 0 && (
                      <span className="text-sm text-white/80 font-medium flex-shrink-0 drop-shadow-sm">{age}</span>
                    )}
                  </div>
                </div>

                {/* Daily badge on image */}
                {isDaily && (
                  <div className="absolute top-2 start-2">
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center shadow-lg ring-2 ring-white/50">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )}

                {/* Unread indicator with pulse */}
                {!isViewed && !isHistory && (
                  <div className="absolute top-2 end-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500 ring-2 ring-white" />
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col justify-between">
              {/* Top: Status badges */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-2 py-0.5 h-5 font-medium border rounded-lg',
                      statusInfo.className,
                    )}
                  >
                    <statusInfo.icon className={cn('w-2.5 h-2.5', isRtl ? 'ml-0.5' : 'mr-0.5')} />
                    {statusInfo.shortLabel}
                  </Badge>
                  {partyIndicator.show && (
                    <Badge className={cn('text-[10px] px-2 py-0.5 h-5 font-semibold rounded-lg', partyIndicator.className)}>
                      {partyIndicator.text}
                    </Badge>
                  )}
                </div>

                {/* Location + Occupation */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
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

                {/* Matching reason — enriched card-in-card style */}
                {matchingReason && (
                  <div className={cn(
                    'relative flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs leading-relaxed border',
                    isDaily
                      ? 'bg-gradient-to-br from-violet-50/80 to-purple-50/50 border-violet-100/50 text-violet-700'
                      : 'bg-gradient-to-br from-teal-50/80 to-emerald-50/50 border-teal-100/50 text-teal-700',
                  )}>
                    <div className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center mt-0.5',
                      isDaily ? 'bg-violet-100' : 'bg-teal-100',
                    )}>
                      {isDaily
                        ? <Sparkles className="w-3 h-3 text-violet-500" />
                        : <Quote className="w-3 h-3 text-teal-500" />
                      }
                    </div>
                    <span>
                      {isReasonExpanded || !isLongReason
                        ? matchingReason
                        : `${matchingReason.substring(0, 100)}...`}
                      {isLongReason && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsReasonExpanded((prev) => !prev);
                          }}
                          className={cn(
                            'inline font-semibold underline underline-offset-2 ms-1 transition-colors',
                            isDaily ? 'text-violet-600 hover:text-violet-800' : 'text-teal-600 hover:text-teal-800',
                          )}
                        >
                          {isReasonExpanded ? dict.expandLess : dict.expandMore}
                        </button>
                      )}
                    </span>
                  </div>
                )}

                {/* Deadline countdown */}
                {hasDeadline && !isHistory && (
                  <CardCountdown
                    deadline={suggestion.decisionDeadline!}
                    locale={locale}
                    dict={dict.countdown}
                  />
                )}
              </div>

              {/* Bottom: Matchmaker attribution */}
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-2">
                  {!isDaily && suggestion.matchmaker && (
                    <span className="text-[10px] text-gray-400">
                      {dict.suggestedBy} {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
                    </span>
                  )}
                  {isDaily && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 font-medium">
                      <Sparkles className="w-2.5 h-2.5" />
                      {dict.smartMatch}
                    </span>
                  )}
                </div>

                {/* History arrow */}
                {isHistory && (
                  <Chevron className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-all duration-300 group-hover:translate-x-0.5" />
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Mini Timeline */}
        {timelineDict && suggestion.statusHistory && suggestion.statusHistory.length > 1 && (
          <div className="px-3.5 sm:px-4 py-1" onClick={(e) => e.stopPropagation()}>
            <MiniTimeline
              statusHistory={suggestion.statusHistory}
              locale={locale}
              dict={timelineDict}
              className="!shadow-none !border-0 !bg-transparent !p-0"
            />
          </div>
        )}

        {/* Action buttons footer — enriched bg */}
        {!isHistory && (
          <div
            className={cn(
              'px-3.5 sm:px-4 py-3 border-t flex items-center justify-between',
              isDaily
                ? 'bg-gradient-to-r from-violet-50/40 to-purple-50/20 border-violet-100/50'
                : 'bg-gradient-to-r from-gray-50/60 to-white border-gray-100/50',
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
    </motion.div>
  );
};

export default SuggestionRow;
