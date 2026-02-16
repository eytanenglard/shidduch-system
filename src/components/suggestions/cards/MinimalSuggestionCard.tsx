// src/components/suggestions/cards/MinimalSuggestionCard.tsx

import React from 'react';
import Image from 'next/image';
import { subDays } from 'date-fns';
import {
  User,
  Eye,
  XCircle,
  ChevronRight,
  MessageCircle,
  Heart,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  Quote,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getRelativeCloudinaryPath, getInitials } from '@/lib/utils';
import {
  getEnhancedStatusInfo,
  getPartyIndicator,
} from '@/lib/utils/suggestionUtils';
import type { ExtendedMatchSuggestion } from '../types';
import type { SuggestionsCardDict } from '@/types/dictionary';

// =============================================================================
// COLOR PALETTE REFERENCE (Matching HeroSection.tsx)
// =============================================================================
// Primary Colors:
//   - Teal/Emerald: from-teal-400 via-teal-500 to-emerald-500 (Knowledge/New)
//   - Orange/Amber: from-orange-400 via-amber-500 to-yellow-500 (Action/Warmth)
//   - Rose/Pink:    from-rose-400 via-pink-500 to-red-500 (Love/Connection)
//   - Violet/Purple: from-violet-500 via-purple-500 to-indigo-500 (Daily AI Suggestion)
//
// Background Gradients:
//   - Page: from-slate-50 via-teal-50/20 to-orange-50/20
//   - Cards: from-teal-50 via-white to-emerald-50 (Teal variant)
//           from-orange-50 via-white to-amber-50 (Orange variant)
//           from-rose-50 via-white to-red-50 (Rose variant)
//           from-violet-50 via-white to-purple-50 (Daily Suggestion variant)
//
// Buttons:
//   - Primary Action: from-teal-500 to-emerald-500 (Approve/View)
//   - Secondary Action: from-orange-500 to-amber-500 (Urgent/Action)
//   - Decline: from-rose-500 to-red-500
//
// Accents:
//   - Focus ring: ring-teal-500
//   - Hover states: hover:bg-teal-50, hover:border-teal-200
// =============================================================================

// ID של יוזר המערכת שמייצר הצעות יומיות
const SYSTEM_MATCHMAKER_ID = 'system-matchmaker-neshamatech';

/**
 * בדיקה האם ההצעה היא "הצעה יומית" של המערכת
 */
const isDailySuggestion = (suggestion: ExtendedMatchSuggestion): boolean => {
  return suggestion.matchmakerId === SYSTEM_MATCHMAKER_ID;
};

interface MinimalSuggestionCardProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onClick: (suggestion: ExtendedMatchSuggestion) => void;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  className?: string;
  isHistory?: boolean;
  isApprovalDisabled?: boolean;
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
};

const MinimalSuggestionCard: React.FC<MinimalSuggestionCardProps> = ({
  suggestion,
  userId,
  onClick,
  onApprove,
  onInquiry,
  onDecline,
  className,
  isHistory = false,
  isApprovalDisabled = false,
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

  const reasonTeaser = suggestion.matchingReason
    ? suggestion.matchingReason.length > 100
      ? `${suggestion.matchingReason.substring(0, 100)}...`
      : suggestion.matchingReason
    : dict.reasonTeaserDefault;

  const handleCardClick = () => {
    onClick(suggestion);
  };

  // האם זו הצעה יומית אוטומטית?
  const isDaily = isDailySuggestion(suggestion);

  return (
    <Card
      className={cn(
        'group w-full rounded-2xl overflow-hidden shadow-lg border-0 bg-white transition-all duration-500 hover:shadow-xl hover:-translate-y-1',
        // Urgent Ring: Orange (Action/Warmth - matching Hero)
        isUrgent && !isDaily && 'ring-2 ring-orange-400 ring-opacity-60',
        // Daily Suggestion Ring: Violet/Purple
        isDaily && 'ring-2 ring-violet-400 ring-opacity-60',
        className
      )}
    >
      {/* Header Gradient */}
      <div
        className={cn(
          'relative p-4 border-b',
          isDaily
            ? 'bg-gradient-to-r from-violet-50/80 via-white to-purple-50/50 border-violet-100/50'
            : 'bg-gradient-to-r from-teal-50/80 via-white to-orange-50/50 border-teal-100/50'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDaily ? (
              /* ===== Daily Suggestion Header: Violet/Purple ===== */
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center border-2 border-white shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-violet-600 font-medium">
                    {locale === 'he' ? '✨ הצעה יומית' : '✨ Daily Match'}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {locale === 'he'
                      ? 'המערכת החכמה של NeshamaTech'
                      : 'NeshamaTech Smart System'}
                  </p>
                </div>
              </>
            ) : (
              /* ===== Regular Matchmaker Header: Teal ===== */
              <>
                <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-sm">
                    {getInitials(
                      `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-teal-600 font-medium">
                    {dict.suggestedBy}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {suggestion.matchmaker.firstName}{' '}
                    {suggestion.matchmaker.lastName}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              className={cn(
                'flex items-center gap-1.5 border shadow-sm font-semibold text-xs',
                statusInfo.className,
                statusInfo.pulse && 'animate-pulse'
              )}
            >
              <statusInfo.icon className="w-3 h-3" aria-hidden="true" />
              <span>{statusInfo.shortLabel}</span>
            </Badge>
            {partyIndicator.show && (
              <Badge
                className={cn(
                  'text-xs px-2 py-0.5 font-bold shadow-sm',
                  partyIndicator.className
                )}
              >
                {partyIndicator.text === dict.yourTurn && (
                  <Zap
                    className={cn(
                      'w-2.5 h-2.5',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                    aria-hidden="true"
                  />
                )}
                {partyIndicator.text}
              </Badge>
            )}
          </div>
        </div>
        {/* Urgent Badge: Orange -> Red gradient (matching Hero urgent states) */}
        {isUrgent && !isDaily && (
          <div className="absolute top-2 left-2">
            <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-semibold text-xs">{dict.urgent}</span>
            </Badge>
          </div>
        )}
        {/* Daily Suggestion Badge: Violet/Purple */}
        {isDaily && (
          <div
            className={cn(
              'absolute top-2',
              locale === 'he' ? 'left-2' : 'right-2'
            )}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className="flex items-center gap-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white border-0 shadow-lg text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    {locale === 'he' ? 'הצעה יומית' : 'Daily Match'}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {locale === 'he'
                      ? 'הצעה שנבחרה במיוחד עבורך על ידי המערכת החכמה'
                      : 'A match specially selected for you by our smart system'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

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
            // Fallback: Slate gradient (neutral)
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <User className="w-20 h-20 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 right-4 left-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                  {targetParty.firstName}
                </h3>
                {age && (
                  <p className="text-lg font-medium text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                    {age}
                  </p>
                )}
              </div>
              {/* Sparkle icon with glassmorphism */}
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
        <CardContent className="p-5 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            {/* Grid content placeholder */}
          </div>

          {/* "Why Special" / Teaser Box */}
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
                    'text-sm font-bold mb-1',
                    isDaily ? 'text-violet-800' : 'text-orange-800'
                  )}
                >
                  {dict.whySpecial}
                </h4>
                <p
                  className={cn(
                    'text-sm leading-relaxed',
                    isDaily ? 'text-violet-900/80' : 'text-orange-900/80'
                  )}
                >
                  {reasonTeaser}
                </p>
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
            ></div>
          </div>

          <div className="text-center py-2">
            <p className="text-xs text-gray-500 font-medium">
              {dict.clickForDetails}
            </p>
          </div>
        </CardContent>
      </div>

      {/* Footer Actions */}
      {!isHistory && (
        <CardFooter className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 border-t border-gray-100">
          {(suggestion.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
          (suggestion.status === 'PENDING_SECOND_PARTY' && !isFirstParty) ? (
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Decline Button: Rose/Red (matching Hero decline actions) */}
              <Button
                size="sm"
                variant="outline"
                className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 hover:border-rose-300 rounded-xl font-medium transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline?.(suggestion);
                }}
              >
                <XCircle
                  className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                />
                {dict.buttons.decline}
              </Button>

              {/* Approve Button: Teal -> Emerald (matching Hero primary CTA) */}
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                        disabled={isApprovalDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isApprovalDisabled) {
                          toast.info(dict.toasts.approveDisabledTitle, {
  description: dict.toasts.approveDisabledDescription,
});
                          } else {
                            onApprove?.(suggestion);
                          }
                        }}
                      >
                        <Heart
                          className={cn(
                            'w-4 h-4',
                            locale === 'he' ? 'ml-2' : 'mr-2'
                          )}
                        />
                        {dict.buttons.approve}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {isApprovalDisabled && (
                    <TooltipContent>
                      <p>{dict.buttons.approveDisabledTooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Ask Matchmaker: Teal accent on hover */}
              <Button
                size="sm"
                variant="outline"
                className="w-full border-gray-200 hover:bg-teal-50 hover:border-teal-200 text-gray-700 hover:text-teal-700 rounded-xl font-medium transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onInquiry?.(suggestion);
                }}
              >
                <MessageCircle
                  className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                />
                {dict.buttons.askMatchmaker}
              </Button>

              {/* View Details: Teal gradient (matching Hero secondary CTA) */}
              <Button
                size="sm"
                variant="default"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                onClick={() => onClick(suggestion)}
              >
                <Eye
                  className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                />
                {dict.buttons.viewDetails}
                {locale === 'he' ? (
                  <ChevronLeft className="w-3 h-3 mr-2" />
                ) : (
                  <ChevronRight className="w-3 h-3 ml-2" />
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default MinimalSuggestionCard;
