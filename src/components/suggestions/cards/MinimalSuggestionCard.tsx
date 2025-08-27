// src/app/components/suggestions/cards/MinimalSuggestionCard.tsx

import React from 'react';
import Image from 'next/image';
import { isAfter, subDays } from 'date-fns';
import {
  User,
  MapPin,
  Briefcase,
  Eye,
  XCircle,
  ChevronRight,
  MessageCircle,
  Heart,
  BookOpen,
  Scroll,
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
import type { SuggestionsCardDict } from '@/types/dictionary'; // ✨ Import dictionary type

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
  dict: SuggestionsCardDict; // ✨ Add dict prop
  locale: 'he' | 'en'; // <-- 1. הוסף prop
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
  dict, // ✨ Destructure dict
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

  return (
    <Card
      className={cn(
        'group w-full rounded-2xl overflow-hidden shadow-lg border-0 bg-white transition-all duration-500 hover:shadow-xl hover:-translate-y-1',
        isUrgent && 'ring-2 ring-orange-300 ring-opacity-60',
        className
      )}
    >
      <div className="relative p-4 bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/50 border-b border-cyan-100/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-white shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white font-bold text-sm">
                {getInitials(
                  `${suggestion.matchmaker.firstName} ${suggestion.matchmaker.lastName}`
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-cyan-600 font-medium">
                {dict.suggestedBy}
              </p>
              <p className="text-sm font-bold text-gray-800">
                {suggestion.matchmaker.firstName}{' '}
                {suggestion.matchmaker.lastName}
              </p>
            </div>
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
                  <Zap className="w-2.5 h-2.5 ml-1" aria-hidden="true" />
                )}
                {partyIndicator.text}
              </Badge>
            )}
          </div>
        </div>
        {isUrgent && (
          <div className="absolute top-2 left-2">
            <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span className="font-semibold text-xs">{dict.urgent}</span>
            </Badge>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={handleCardClick}
        aria-label={dict.viewDetailsAria.replace(
          '{{name}}',
          targetParty.firstName
        )}
        className="block w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                  {targetParty.firstName}
                </h3>
                {age && (
                  <p className="text-lg font-medium text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                    {age}
                  </p>
                )}
              </div>
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </button>
      <div onClick={handleCardClick} className="cursor-pointer">
        <CardContent className="p-5 space-y-4">
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
            {/* Grid content remains the same */}
          </div>
          <div className="relative p-4 bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border border-cyan-100/50 rounded-xl">
            <div className="flex items-start gap-3">
              <Quote className="w-4 h-4 text-cyan-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-cyan-800 mb-1">
                  {dict.whySpecial}
                </h4>
                <p className="text-sm text-cyan-700 leading-relaxed">
                  {reasonTeaser}
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-cyan-200/50 to-blue-200/50 rounded-bl-xl"></div>
          </div>
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 font-medium">
              {dict.clickForDetails}
            </p>
          </div>
        </CardContent>
      </div>
      {!isHistory && (
        <CardFooter className="p-4 bg-gradient-to-r from-gray-50/50 to-slate-50/50 border-t border-gray-100">
          {(suggestion.status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
          (suggestion.status === 'PENDING_SECOND_PARTY' && !isFirstParty) ? (
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl font-medium transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline?.(suggestion);
                }}
              >
                <XCircle className="w-4 h-4 ml-2" />
                {dict.buttons.decline}
              </Button>
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                        disabled={isApprovalDisabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isApprovalDisabled) {
                            toast.info('לא ניתן לאשר הצעה חדשה', {
                              description: 'יש לך כבר הצעה אחרת בתהליך פעיל.',
                            });
                          } else {
                            onApprove?.(suggestion);
                          }
                        }}
                      >
                        <Heart className="w-4 h-4 ml-2" />
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
              <Button
                size="sm"
                variant="outline"
                className="w-full border-gray-200 hover:bg-cyan-50 hover:border-cyan-200 rounded-xl font-medium transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onInquiry?.(suggestion);
                }}
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                {dict.buttons.askMatchmaker}
              </Button>
              <Button
                size="sm"
                variant="default"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
                onClick={() => onClick(suggestion)}
              >
                <Eye className="w-4 h-4 ml-2" />
                {dict.buttons.viewDetails}
                {locale === 'he' ? (
                  <ChevronLeft className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
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
