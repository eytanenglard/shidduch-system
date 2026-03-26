// src/components/suggestions/cards/CompactCardActions.tsx

import React from 'react';
import {
  XCircle,
  Heart,
  MessageCircle,
  Bookmark,
  Trash2,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

interface CompactCardActionsProps {
  suggestion: ExtendedMatchSuggestion;
  isFirstParty: boolean;
  isUserInActiveProcess: boolean;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onInterested?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  onClick: (suggestion: ExtendedMatchSuggestion) => void;
  isLoading?: string | null; // Which action is loading: 'approve' | 'decline' | 'interested' | null
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const CompactCardActions: React.FC<CompactCardActionsProps> = ({
  suggestion,
  isFirstParty,
  isUserInActiveProcess,
  onApprove,
  onInterested,
  onDecline,
  onInquiry,
  onClick,
  isLoading,
  dict,
  locale,
}) => {
  const isRtl = locale === 'he';
  const iconCn = cn('w-3.5 h-3.5', isRtl ? 'ml-1' : 'mr-1');

  // CASE: First party PENDING
  if (suggestion.status === 'PENDING_FIRST_PARTY' && isFirstParty) {
    if (isUserInActiveProcess) {
      return (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-lg text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300 text-xs font-medium"
            disabled={!!isLoading}
            onClick={(e) => { e.stopPropagation(); onInterested?.(suggestion); }}
          >
            {isLoading === 'interested' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Bookmark className={iconCn} />}
            {dict.buttons.interested}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs font-medium"
            disabled={!!isLoading}
            onClick={(e) => { e.stopPropagation(); onDecline?.(suggestion); }}
          >
            {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
            {dict.buttons.decline}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
        >
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onDecline?.(suggestion); }}
        >
          {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
          {dict.buttons.decline}
        </Button>
      </div>
    );
  }

  // CASE: Second party PENDING
  if (suggestion.status === 'PENDING_SECOND_PARTY' && !isFirstParty) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
        >
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onDecline?.(suggestion); }}
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
      <div className="flex items-center gap-2">
        {!isUserInActiveProcess && (
          <Button
            size="sm"
            className="h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
            disabled={!!isLoading}
            onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
          >
            {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
            {dict.buttons.activateNow}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onDecline?.(suggestion); }}
        >
          {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Trash2 className={iconCn} />}
          {dict.buttons.removeFromList}
        </Button>
      </div>
    );
  }

  // CASE: Re-offered to first party
  if (suggestion.status === 'RE_OFFERED_TO_FIRST_PARTY' && isFirstParty) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-9 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
        >
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-medium"
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onDecline?.(suggestion); }}
        >
          {isLoading === 'decline' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <XCircle className={iconCn} />}
          {dict.buttons.decline}
        </Button>
      </div>
    );
  }

  // CASE: Second party not available
  if (suggestion.status === 'SECOND_PARTY_NOT_AVAILABLE') {
    return (
      <div className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs text-amber-600 font-medium">
          {locale === 'he' ? 'בהמתנה' : 'On hold'}
        </span>
      </div>
    );
  }

  // DEFAULT: In-progress statuses
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-9 rounded-lg text-gray-600 border-gray-200 hover:bg-gray-50 text-xs font-medium"
        onClick={(e) => { e.stopPropagation(); onInquiry?.(suggestion); }}
      >
        <MessageCircle className={iconCn} />
        {dict.buttons.askMatchmaker}
      </Button>
    </div>
  );
};

export default CompactCardActions;
