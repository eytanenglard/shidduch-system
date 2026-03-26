// src/components/suggestions/cards/MinimalSuggestionCard.tsx

import React from 'react';
import Image from 'next/image';
import { subDays } from 'date-fns';
import {
  User,
  Quote,
  Sparkles,
  Heart,
  Star,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn, getRelativeCloudinaryPath, calculateAge } from '@/lib/utils';
import {
  getEnhancedStatusInfo,
  getPartyIndicator,
} from '@/lib/utils/suggestionUtils';
import CardHeader from './CardHeader';
import CardActions from './CardActions';
import CardCountdown from './CardCountdown';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

import { SYSTEM_MATCHMAKER_ID } from '../constants';

const isDailySuggestion = (suggestion: ExtendedMatchSuggestion): boolean => {
  return suggestion.matchmakerId === SYSTEM_MATCHMAKER_ID;
};

interface MinimalSuggestionCardProps {
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
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const MinimalSuggestionCard: React.FC<MinimalSuggestionCardProps> = ({
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
  dict,
  locale,
}) => {
  const targetParty =
    suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;
  const isFirstParty = suggestion.firstPartyId === userId;

  if (!targetParty || !targetParty.profile) {
    return null;
  }

  const mainImage = targetParty.images?.find((img) => img.isMain);
  const age = calculateAge(targetParty.profile.birthDate);
  const statusInfo = getEnhancedStatusInfo(
    suggestion.status,
    isFirstParty,
    dict
  );
  const partyIndicator = getPartyIndicator(
    suggestion.status,
    isFirstParty,
    dict
  );

  const hasDeadline =
    suggestion.decisionDeadline &&
    new Date(suggestion.decisionDeadline) > new Date();
  const isUrgent =
    hasDeadline &&
    subDays(new Date(suggestion.decisionDeadline!), 2) < new Date();

  const isDaily = isDailySuggestion(suggestion);

  // Build matching reasons list from matchingReason field
  const matchingReasons = buildMatchingReasons(suggestion, targetParty, locale);

  const handleCardClick = () => {
    onClick(suggestion);
  };

  return (
    <Card
      className={cn(
        'group w-full rounded-2xl overflow-hidden shadow-lg border-0 bg-white transition-all duration-500 hover:shadow-xl hover:-translate-y-1',
        isUrgent && !isDaily && 'ring-2 ring-orange-400 ring-opacity-60',
        isDaily && 'ring-2 ring-violet-400 ring-opacity-60',
        // Unread indicator: subtle glow effect
        !isViewed && !isHistory && 'ring-2 ring-teal-400 ring-opacity-80 shadow-teal-100/50',
        className
      )}
    >
      {/* Unread dot indicator */}
      {!isViewed && !isHistory && (
        <div className="absolute top-3 left-3 z-10">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500" />
          </span>
        </div>
      )}

      {/* Header */}
      <CardHeader
        suggestion={suggestion}
        targetParty={targetParty}
        isDaily={isDaily}
        isUrgent={!!isUrgent}
        statusInfo={statusInfo}
        partyIndicator={partyIndicator}
        dict={dict}
        locale={locale}
      />

      {/* Image Section */}
      <button
        type="button"
        onClick={handleCardClick}
        aria-label={dict.viewDetailsAria.replace(
          '{{name}}',
          targetParty.firstName
        )}
        className="block w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
      >
        <div className="relative h-64">
          {mainImage?.url ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={`תמונה של ${targetParty.firstName}`}
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <User className="w-20 h-20 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 right-4 left-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                  {targetParty.firstName}{targetParty.lastName ? ` ${targetParty.lastName.charAt(0)}.` : ''}
                </h3>
                {age && (
                  <p className="text-lg font-medium text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                    {age}
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'p-2 rounded-full backdrop-blur-sm',
                  isDaily ? 'bg-violet-500/30' : 'bg-white/20'
                )}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </button>

      <div onClick={handleCardClick} className="cursor-pointer">
        <CardContent className="p-5 space-y-3">
          {/* Countdown Timer */}
          {hasDeadline && !isHistory && (
            <CardCountdown
              deadline={suggestion.decisionDeadline!}
              locale={locale}
            />
          )}

          {/* Status Description Box */}
          {statusInfo.description && (
            <div className="p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
              <div className="flex items-start gap-2">
                <statusInfo.icon className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          )}

          {/* "Why You'd Connect" - Expanded matching reasons */}
          <div
            className={cn(
              'relative p-4 border rounded-xl',
              isDaily
                ? 'bg-gradient-to-r from-violet-50/50 to-purple-50/50 border-violet-100/50'
                : 'bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-orange-100/50'
            )}
          >
            <div className="flex items-start gap-3">
              <Quote
                className={cn(
                  'w-4 h-4 mt-1 flex-shrink-0',
                  isDaily ? 'text-violet-500' : 'text-orange-500'
                )}
              />
              <div className="flex-1">
                <h4
                  className={cn(
                    'text-sm font-bold mb-2',
                    isDaily ? 'text-violet-800' : 'text-orange-800'
                  )}
                >
                  {dict.whySpecial}
                </h4>

                {/* Expanded reasons list */}
                {matchingReasons.length > 0 ? (
                  <ul className="space-y-1.5">
                    {matchingReasons.slice(0, 3).map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <reason.icon
                          className={cn(
                            'w-3.5 h-3.5 mt-0.5 flex-shrink-0',
                            isDaily ? 'text-violet-500' : 'text-orange-500'
                          )}
                        />
                        <span
                          className={cn(
                            'text-sm leading-snug',
                            isDaily ? 'text-violet-900/80' : 'text-orange-900/80'
                          )}
                        >
                          {reason.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p
                    className={cn(
                      'text-sm leading-relaxed',
                      isDaily ? 'text-violet-900/80' : 'text-orange-900/80'
                    )}
                  >
                    {dict.reasonTeaserDefault}
                  </p>
                )}
              </div>
            </div>
            {/* Decorative corner */}
            <div
              className={cn(
                'absolute top-0 right-0 w-6 h-6 rounded-bl-xl',
                isDaily
                  ? 'bg-gradient-to-br from-violet-200/50 to-purple-200/50'
                  : 'bg-gradient-to-br from-orange-200/50 to-amber-200/50'
              )}
            />
          </div>

          <div className="text-center py-1">
            <p className="text-xs text-gray-500 font-medium">
              {dict.clickForDetails}
            </p>
          </div>
        </CardContent>
      </div>

      {/* Footer Actions */}
      {!isHistory && (
        <CardFooter className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 border-t border-gray-100">
          <CardActions
            suggestion={suggestion}
            isFirstParty={isFirstParty}
            isUserInActiveProcess={isUserInActiveProcess}
            onApprove={onApprove}
            onInterested={onInterested}
            onInquiry={onInquiry}
            onDecline={onDecline}
            onClick={onClick}
            dict={dict}
            locale={locale}
          />
        </CardFooter>
      )}
    </Card>
  );
};

// =============================================================================
// Helper: Build matching reasons from suggestion data
// =============================================================================
interface MatchingReason {
  icon: React.ElementType;
  text: string;
}

function buildMatchingReasons(
  suggestion: ExtendedMatchSuggestion,
  targetParty: ExtendedMatchSuggestion['firstParty'],
  locale: 'he' | 'en'
): MatchingReason[] {
  const reasons: MatchingReason[] = [];

  // 1. Matchmaker's personal reason (primary)
  if (suggestion.matchingReason) {
    reasons.push({
      icon: Heart,
      text: suggestion.matchingReason.length > 80
        ? `${suggestion.matchingReason.substring(0, 80)}...`
        : suggestion.matchingReason,
    });
  }

  // 2. Location match
  if (targetParty.profile?.city) {
    reasons.push({
      icon: MapPin,
      text: locale === 'he'
        ? `מתגורר/ת ב${targetParty.profile.city}`
        : `Lives in ${targetParty.profile.city}`,
    });
  }

  // 3. Religious level match
  if (targetParty.profile?.religiousLevel) {
    reasons.push({
      icon: Star,
      text: locale === 'he'
        ? `${targetParty.profile.religiousLevel}`
        : `${targetParty.profile.religiousLevel}`,
    });
  }

  // 4. Occupation
  if (targetParty.profile?.occupation) {
    reasons.push({
      icon: Sparkles,
      text: locale === 'he'
        ? `${targetParty.profile.occupation}`
        : `${targetParty.profile.occupation}`,
    });
  }

  return reasons;
}

export default MinimalSuggestionCard;
