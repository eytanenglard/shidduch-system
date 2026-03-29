// src/components/suggestions/cards/CardHeader.tsx

import React from 'react';
import Image from 'next/image';
import {
  User,
  Sparkles,
  Zap,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn, getRelativeCloudinaryPath, getInitials } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

interface CardHeaderProps {
  suggestion: ExtendedMatchSuggestion;
  targetParty: ExtendedMatchSuggestion['firstParty'];
  isDaily: boolean;
  isUrgent: boolean;
  statusInfo: {
    className: string;
    pulse: boolean;
    icon: React.ElementType;
    shortLabel: string;
  };
  partyIndicator: {
    show: boolean;
    className: string;
    text: string;
  };
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const CardHeader: React.FC<CardHeaderProps> = ({
  suggestion,
  targetParty,
  isDaily,
  isUrgent,
  statusInfo,
  partyIndicator,
  dict,
  locale,
}) => {
  const mainImage = targetParty.images?.find((img) => img.isMain);

  return (
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
            <>
              <Avatar className="w-10 h-10 border-2 border-white shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold text-sm">
                  {getInitials(
                    `${suggestion.matchmaker?.firstName} ${suggestion.matchmaker?.lastName}`
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-teal-600 font-medium">
                  {dict.suggestedBy}
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {suggestion.matchmaker?.firstName}{' '}
                  {suggestion.matchmaker?.lastName}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Candidate thumbnail */}
        <div className="flex flex-col items-center gap-0.5 mx-1 flex-shrink-0">
          <div
            className={cn(
              'w-9 h-9 rounded-full overflow-hidden ring-2 ring-white shadow-md',
              isDaily ? 'ring-violet-200' : 'ring-teal-100'
            )}
          >
            {mainImage?.url ? (
              <Image
                src={getRelativeCloudinaryPath(mainImage.url)}
                alt={targetParty.firstName}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[38px] leading-tight">
            {targetParty.firstName}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge
            className={cn(
              'flex items-center gap-1.5 border shadow-sm font-semibold text-xs',
              statusInfo.className,
              statusInfo.pulse && 'animate-pulse motion-reduce:animate-none'
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

      {/* Urgent Badge */}
      {isUrgent && !isDaily && (
        <div className="absolute top-2 left-2">
          <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg animate-pulse motion-reduce:animate-none">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-semibold text-xs">{dict.urgent}</span>
          </Badge>
        </div>
      )}

      {/* RE_OFFERED comeback badge */}
      {suggestion.status === 'RE_OFFERED_TO_FIRST_PARTY' && (
        <div className={cn('absolute top-2', locale === 'he' ? 'left-2' : 'right-2')}>
          <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white border-0 shadow-lg shadow-blue-500/30 animate-bounce motion-reduce:animate-pulse text-xs font-bold">
            <RotateCcw className="w-3 h-3" />
            {locale === 'he' ? 'חזר/ה ואישר/ה!' : 'They\'re back!'}
          </Badge>
        </div>
      )}

      {/* Daily Suggestion Badge */}
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
  );
};

export default CardHeader;
