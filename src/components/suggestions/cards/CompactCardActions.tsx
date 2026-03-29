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
  isLoading?: string | null;
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

// Shared button styles
const approveBtn = 'relative h-9 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-semibold shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] overflow-hidden flex-1';
const interestedBtn = 'h-9 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-400/25 hover:shadow-lg hover:shadow-amber-400/30 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] border-0';
const declineBtn = 'h-9 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 text-xs font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]';
const removeBtn = 'h-9 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 text-xs font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]';

const ShimmerOverlay = () => (
  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/approve:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
);

const CompactCardActions: React.FC<CompactCardActionsProps> = ({
  suggestion,
  isFirstParty,
  isUserInActiveProcess,
  onApprove,
  onInterested,
  onDecline,
  onInquiry,
  onClick: _onClick,
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
        <div className="flex items-center gap-2 w-full">
          <Button
            size="sm"
            className={interestedBtn}
            disabled={!!isLoading}
            onClick={(e) => { e.stopPropagation(); onInterested?.(suggestion); }}
          >
            {isLoading === 'interested' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Bookmark className={iconCn} />}
            {dict.buttons.interested}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={declineBtn}
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
      <div className="flex items-center gap-2 w-full">
        <Button
          size="sm"
          className={cn(approveBtn, 'group/approve')}
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
        >
          <ShimmerOverlay />
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={declineBtn}
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
      <div className="flex items-center gap-2 w-full">
        <Button
          size="sm"
          className={cn(approveBtn, 'group/approve')}
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
        >
          <ShimmerOverlay />
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={declineBtn}
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
      <div className="flex items-center gap-2 w-full">
        {!isUserInActiveProcess && (
          <Button
            size="sm"
            className={cn(approveBtn, 'group/approve')}
            disabled={!!isLoading}
            onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
          >
            <ShimmerOverlay />
            {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
            {dict.buttons.activateNow}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className={removeBtn}
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
      <div className="flex items-center gap-2 w-full">
        <Button
          size="sm"
          className={cn(approveBtn, 'group/approve')}
          disabled={!!isLoading}
          onClick={(e) => { e.stopPropagation(); onApprove?.(suggestion); }}
        >
          <ShimmerOverlay />
          {isLoading === 'approve' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <Heart className={iconCn} />}
          {dict.buttons.approve}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={declineBtn}
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
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs text-amber-600 font-medium">
          {dict.statusLabels.onHold}
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
        className="h-9 rounded-xl text-violet-600 border-violet-200 hover:bg-violet-50 hover:border-violet-300 hover:shadow-sm text-xs font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
        disabled={!!isLoading}
        onClick={(e) => { e.stopPropagation(); onInquiry?.(suggestion); }}
      >
        {isLoading === 'inquiry' ? <Loader2 className={cn(iconCn, 'animate-spin')} /> : <MessageCircle className={iconCn} />}
        {dict.buttons.askMatchmaker}
      </Button>
    </div>
  );
};

export default CompactCardActions;
