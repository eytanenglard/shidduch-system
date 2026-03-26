// src/components/suggestions/panels/PanelActions.tsx

import React from 'react';
import {
  Heart,
  XCircle,
  Bookmark,
  MessageCircle,
  Trash2,
  Loader2,
  Clock,
  Undo2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

interface PanelActionsProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  isUserInActiveProcess: boolean;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  onInterested?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onWithdraw?: (suggestion: ExtendedMatchSuggestion) => void;
  isLoading?: string | null;
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const PanelActions: React.FC<PanelActionsProps> = ({
  suggestion,
  userId,
  isUserInActiveProcess,
  onApprove,
  onDecline,
  onInterested,
  onInquiry,
  onWithdraw,
  isLoading,
  dict,
  locale,
}) => {
  const isRtl = locale === 'he';
  const isFirstParty = suggestion.firstPartyId === userId;
  const iconCn = cn('w-4 h-4', isRtl ? 'ml-1.5' : 'mr-1.5');

  // CASE: First party PENDING
  if (suggestion.status === 'PENDING_FIRST_PARTY' && isFirstParty) {
    return (
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-2">
        {isUserInActiveProcess ? (
          <>
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 mb-2">
              <Info className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                {dict.activeProcessExplanation}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium"
                disabled={!!isLoading}
                onClick={() => onInterested?.(suggestion)}
              >
                {isLoading === 'interested' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Bookmark className={iconCn} />}
                {dict.buttons.interested}
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
                disabled={!!isLoading}
                onClick={() => onDecline?.(suggestion)}
              >
                {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
                {dict.buttons.decline}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button
              className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
              disabled={!!isLoading}
              onClick={() => onApprove?.(suggestion)}
            >
              {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
              {dict.buttons.approve}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-9 rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50 text-sm font-medium"
                disabled={!!isLoading}
                onClick={() => onInterested?.(suggestion)}
              >
                {isLoading === 'interested' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Bookmark className={iconCn} />}
                {dict.buttons.interested}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-sm font-medium"
                disabled={!!isLoading}
                onClick={() => onDecline?.(suggestion)}
              >
                {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
                {dict.buttons.decline}
              </Button>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          className="w-full h-9 rounded-lg text-gray-500 hover:text-gray-700 text-sm font-medium"
          onClick={() => onInquiry?.(suggestion)}
        >
          <MessageCircle className={iconCn} />
          {dict.buttons.askMatchmaker}
        </Button>
      </div>
    );
  }

  // CASE: Second party PENDING
  if (suggestion.status === 'PENDING_SECOND_PARTY' && !isFirstParty) {
    return (
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-2">
        <Button
          className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
          disabled={!!isLoading}
          onClick={() => onApprove?.(suggestion)}
        >
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          variant="outline"
          className="w-full h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
          disabled={!!isLoading}
          onClick={() => onDecline?.(suggestion)}
        >
          {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
          {dict.buttons.decline}
        </Button>
      </div>
    );
  }

  // CASE: INTERESTED
  if (suggestion.status === 'FIRST_PARTY_INTERESTED' && isFirstParty) {
    return (
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-2">
        {!isUserInActiveProcess && (
          <Button
            className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
            disabled={!!isLoading}
            onClick={() => onApprove?.(suggestion)}
          >
            {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
            {dict.buttons.activateNow}
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
          disabled={!!isLoading}
          onClick={() => onDecline?.(suggestion)}
        >
          {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Trash2 className={iconCn} />}
          {dict.buttons.removeFromList}
        </Button>
        {isUserInActiveProcess && (
          <p className="text-xs text-gray-400 text-center px-2">
            {locale === 'he'
              ? 'יש לך הצעה פעילה. כשתסתיים, תוכל/י לאשר.'
              : 'You have an active suggestion. Approve when it ends.'}
          </p>
        )}
      </div>
    );
  }

  // CASE: Re-offered
  if (suggestion.status === 'RE_OFFERED_TO_FIRST_PARTY' && isFirstParty) {
    return (
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-2">
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 mb-1">
          <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            {locale === 'he'
              ? 'הצד השני חזר להיות זמין ואישר. האם ההצעה עדיין רלוונטית?'
              : 'The other side is now available and approved. Still interested?'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1 h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
            disabled={!!isLoading}
            onClick={() => onApprove?.(suggestion)}
          >
            {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
            {dict.buttons.approve}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 font-medium"
            disabled={!!isLoading}
            onClick={() => onDecline?.(suggestion)}
          >
            {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
            {dict.buttons.decline}
          </Button>
        </div>
      </div>
    );
  }

  // CASE: First party approved (can withdraw)
  if (suggestion.status === 'FIRST_PARTY_APPROVED' && isFirstParty) {
    return (
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-2">
        <div className="flex items-start gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-100">
          <Info className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-teal-700">
            {locale === 'he'
              ? 'אישרת את ההצעה. ממתינים לשדכן/ית.'
              : 'You approved. Waiting for matchmaker.'}
          </p>
        </div>
        {onWithdraw && (
          <Button
            variant="outline"
            className="w-full h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-sm font-medium"
            disabled={!!isLoading}
            onClick={() => onWithdraw(suggestion)}
          >
            <Undo2 className={iconCn} />
            {locale === 'he' ? 'ביטול אישור' : 'Withdraw approval'}
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full h-9 rounded-lg text-gray-500 hover:text-gray-700 text-sm"
          onClick={() => onInquiry?.(suggestion)}
        >
          <MessageCircle className={iconCn} />
          {dict.buttons.askMatchmaker}
        </Button>
      </div>
    );
  }

  // CASE: Second party not available
  if (suggestion.status === 'SECOND_PARTY_NOT_AVAILABLE') {
    if (!isFirstParty) {
      return (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-2">
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
            <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              {locale === 'he'
                ? 'סימנת שאת/ה לא זמין/ה. כשתהיה מוכן/ה:'
                : "You marked yourself as unavailable. When ready:"}
            </p>
          </div>
          <Button
            className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
            onClick={() => onApprove?.(suggestion)}
          >
            {dict.buttons.imAvailableNow}
          </Button>
        </div>
      );
    }
    return (
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
          <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            {locale === 'he'
              ? 'הצד השני לא זמין כרגע. ההצעה תחזור כשיהיה זמין.'
              : 'The other side is unavailable. The suggestion will resume when they are.'}
          </p>
        </div>
      </div>
    );
  }

  // DEFAULT: In-progress statuses (dating, contact shared, etc.)
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
      <Button
        variant="outline"
        className="w-full h-10 rounded-lg text-gray-600 border-gray-200 hover:bg-gray-50 font-medium"
        onClick={() => onInquiry?.(suggestion)}
      >
        <MessageCircle className={iconCn} />
        {dict.buttons.askMatchmaker}
      </Button>
    </div>
  );
};

export default PanelActions;
