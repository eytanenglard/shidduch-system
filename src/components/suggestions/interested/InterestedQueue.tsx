// src/components/suggestions/interested/InterestedQueue.tsx

'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Bookmark,
  ChevronUp,
  ChevronDown,
  Heart,
  Trash2,
  GripVertical,
  User,
  Sparkles,
  ArrowUpCircle,
  Crown,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../types';

// =============================================================================
// טקסטים (בהמשך יעברו ל-dictionary)
// =============================================================================
const TEXTS = {
  he: {
    title: 'רשימת ההמתנה שלי',
    subtitle: 'הצעות שמעוניין/ת בהן – ממתינות לתורן',
    empty: 'אין הצעות בהמתנה. סמן/י הצעות כ"שומר/ת לגיבוי" והן יופיעו כאן.',
    nextInLine: 'הבאה בתור',
    rank: 'מקום',
    moveUp: 'הזז למעלה',
    moveDown: 'הזז למטה',
    activateNow: 'אשר/י עכשיו',
    activateTooltip: 'שלח/י הצעה זו לאישור השדכן',
    activateDisabled: 'יש לך כבר הצעה פעילה. המתן/י עד שתסתיים.',
    remove: 'הסר/י מהרשימה',
    removeConfirm: 'ההצעה הוסרה מרשימת ההמתנה',
    viewProfile: 'צפה בפרופיל',
    rankUpdated: 'סדר העדיפויות עודכן',
    rankError: 'שגיאה בעדכון הסדר',
    activateSuccess: 'ההצעה אושרה! תועבר לטיפול השדכן.',
  },
  en: {
    title: 'My Waitlist',
    subtitle: "Suggestions you're interested in – waiting their turn",
    empty:
      'No suggestions on waitlist. Mark suggestions as "Save for later" to add them here.',
    nextInLine: 'Next in line',
    rank: 'Rank',
    moveUp: 'Move up',
    moveDown: 'Move down',
    activateNow: 'Approve now',
    activateTooltip: 'Send this suggestion to the matchmaker for approval',
    activateDisabled:
      'You already have an active suggestion. Wait until it concludes.',
    remove: 'Remove from list',
    removeConfirm: 'Suggestion removed from waitlist',
    viewProfile: 'View profile',
    rankUpdated: 'Priority order updated',
    rankError: 'Error updating order',
    activateSuccess:
      'Suggestion approved! Will be forwarded to the matchmaker.',
  },
};

// =============================================================================
// Helper: חישוב גיל
// =============================================================================
const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

// =============================================================================
// Props
// =============================================================================
interface InterestedQueueProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
  isUserInActiveProcess: boolean;
  onActivate: (suggestion: ExtendedMatchSuggestion) => void;
  onRemove: (suggestion: ExtendedMatchSuggestion) => void;
  onViewDetails: (suggestion: ExtendedMatchSuggestion) => void;
  onRankUpdate: (rankedIds: string[]) => Promise<void>;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================
const InterestedQueue: React.FC<InterestedQueueProps> = ({
  suggestions,
  userId,
  locale,
  isUserInActiveProcess,
  onActivate,
  onRemove,
  onViewDetails,
  onRankUpdate,
  className,
}) => {
  const t = TEXTS[locale];
  const [isUpdating, setIsUpdating] = useState(false);

  // מיון לפי rank
  const sortedSuggestions = React.useMemo(() => {
    return [...suggestions].sort(
      (a, b) => (a.firstPartyRank ?? 999) - (b.firstPartyRank ?? 999)
    );
  }, [suggestions]);

  // הזזת הצעה למעלה/למטה
  const handleMove = useCallback(
    async (index: number, direction: 'up' | 'down') => {
      if (isUpdating) return;

      const newOrder = [...sortedSuggestions];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newOrder.length) return;

      // החלפה
      [newOrder[index], newOrder[targetIndex]] = [
        newOrder[targetIndex],
        newOrder[index],
      ];

      const rankedIds = newOrder.map((s) => s.id);

      setIsUpdating(true);
      try {
        await onRankUpdate(rankedIds);
        toast.success(t.rankUpdated);
      } catch {
        toast.error(t.rankError);
      } finally {
        setIsUpdating(false);
      }
    },
    [sortedSuggestions, isUpdating, onRankUpdate, t]
  );

  if (suggestions.length === 0) {
    return null; // לא מציגים כלום אם אין הצעות בהמתנה
  }

  return (
    <Card
      className={cn(
        'border-0 shadow-lg bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="pb-3 border-b border-amber-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center shadow-md">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              {t.title}
            </CardTitle>
            <p className="text-sm text-amber-600/80">{t.subtitle}</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
            {suggestions.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {sortedSuggestions.map((suggestion, index) => {
          const targetParty =
            suggestion.firstPartyId === userId
              ? suggestion.secondParty
              : suggestion.firstParty;
          const mainImage = targetParty?.images?.find((img) => img.isMain);
          const age = calculateAge(targetParty?.profile?.birthDate);
          const isFirst = index === 0;

          if (!targetParty || !targetParty.profile) return null;

          return (
            <div
              key={suggestion.id}
              className={cn(
                'relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300',
                isFirst
                  ? 'bg-gradient-to-r from-amber-50 via-white to-orange-50 border-amber-200 shadow-md ring-1 ring-amber-200/50'
                  : 'bg-white border-gray-100 hover:border-amber-200 hover:shadow-sm'
              )}
            >
              {/* Rank Number */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                  isFirst
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                {isFirst ? <Crown className="w-4 h-4" /> : index + 1}
              </div>

              {/* Avatar */}
              <button
                onClick={() => onViewDetails(suggestion)}
                className="flex-shrink-0"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  {mainImage ? (
                    <Image
                      src={getRelativeCloudinaryPath(mainImage.url)}
                      alt={targetParty.firstName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetails(suggestion)}
                    className="font-semibold text-gray-800 text-sm hover:text-amber-700 transition-colors truncate"
                  >
                    {targetParty.firstName}
                  </button>
                  {age && (
                    <span className="text-xs text-gray-500">({age})</span>
                  )}
                  {isFirst && !isUserInActiveProcess && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[10px] px-1.5 py-0">
                      {t.nextInLine}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {targetParty.profile.city && (
                    <span>{targetParty.profile.city}</span>
                  )}
                  {targetParty.profile.city &&
                    targetParty.profile.occupation && <span>•</span>}
                  {targetParty.profile.occupation && (
                    <span className="truncate">
                      {targetParty.profile.occupation}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Move Up/Down */}
                <div className="flex flex-col gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-amber-100"
                    disabled={index === 0 || isUpdating}
                    onClick={() => handleMove(index, 'up')}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-amber-100"
                    disabled={
                      index === sortedSuggestions.length - 1 || isUpdating
                    }
                    onClick={() => handleMove(index, 'down')}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* View Profile */}
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-amber-100"
                        onClick={() => onViewDetails(suggestion)}
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.viewProfile}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Activate (Approve) */}
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'h-8 w-8',
                            isUserInActiveProcess
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-teal-100 text-teal-600'
                          )}
                          disabled={isUserInActiveProcess}
                          onClick={() => {
                            if (isUserInActiveProcess) {
                              toast.info(t.activateDisabled);
                            } else {
                              onActivate(suggestion);
                            }
                          }}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isUserInActiveProcess
                          ? t.activateDisabled
                          : t.activateTooltip}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Remove */}
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-rose-100 text-gray-400 hover:text-rose-500"
                        onClick={() => onRemove(suggestion)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t.remove}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          );
        })}

        {/* Highlight: Next suggestion to activate */}
        {!isUserInActiveProcess && sortedSuggestions.length > 0 && (
          <div className="mt-2 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/50 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <ArrowUpCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-teal-800 font-medium">
                {locale === 'he'
                  ? `אפשר לאשר את ההצעה הבאה בתור – ${sortedSuggestions[0]?.secondParty?.firstName || sortedSuggestions[0]?.firstParty?.firstName}`
                  : `Ready to approve the next suggestion – ${sortedSuggestions[0]?.secondParty?.firstName || sortedSuggestions[0]?.firstParty?.firstName}`}
              </span>
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg text-xs px-3 h-7 mr-auto"
                onClick={() => onActivate(sortedSuggestions[0])}
              >
                <Heart
                  className={cn('w-3 h-3', locale === 'he' ? 'ml-1' : 'mr-1')}
                />
                {t.activateNow}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterestedQueue;
