'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickActionsBarProps } from '../types/modal.types';

import PendingFirstPartyActions from './action-states/PendingFirstPartyActions';
import PendingSecondPartyActions from './action-states/PendingSecondPartyActions';
import InterestedActions from './action-states/InterestedActions';
import ReOfferedActions from './action-states/ReOfferedActions';
import WithdrawActions from './action-states/WithdrawActions';
import DefaultActions from './action-states/DefaultActions';

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  isExpanded,
  onToggleExpand,
  status,
  isFirstParty,
  isUserInActiveProcess,
  isSubmitting,
  onApprove,
  onDecline,
  onInterested,
  onAskQuestion,
  onWithdraw,
  approvedAt,
  secondPartySent,
  dict,
  locale,
}) => {
  const isHe = locale === 'he';
  const [withdrawCountdown, setWithdrawCountdown] = useState<number | null>(null);

  // Determine if this is a pending action that should always show buttons
  const hasPendingAction =
    (status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
    (status === 'PENDING_SECOND_PARTY' && !isFirstParty);

  // Auto-expand on pending statuses
  useEffect(() => {
    if (hasPendingAction && !isExpanded) {
      onToggleExpand();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingAction]);

  // Grace period countdown
  useEffect(() => {
    if (status !== 'FIRST_PARTY_APPROVED' || !isFirstParty || !approvedAt || secondPartySent) {
      setWithdrawCountdown(null);
      return;
    }
    const GRACE_PERIOD_MS = 5 * 60 * 1000;
    const approvedTime = new Date(approvedAt).getTime();
    const updateCountdown = () => {
      const remaining = GRACE_PERIOD_MS - (Date.now() - approvedTime);
      setWithdrawCountdown(remaining <= 0 ? 0 : Math.ceil(remaining / 1000));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, isFirstParty, approvedAt, secondPartySent]);

  const sharedProps = { isSubmitting, isHe, onApprove, onDecline, onInterested, dict };

  const renderButtons = () => {
    if (status === 'PENDING_FIRST_PARTY' && isFirstParty) {
      return <PendingFirstPartyActions {...sharedProps} isUserInActiveProcess={isUserInActiveProcess} />;
    }
    if (status === 'PENDING_SECOND_PARTY' && !isFirstParty) {
      return <PendingSecondPartyActions {...sharedProps} />;
    }
    if (status === 'FIRST_PARTY_INTERESTED' && isFirstParty) {
      return <InterestedActions {...sharedProps} isUserInActiveProcess={isUserInActiveProcess} />;
    }
    if (status === 'RE_OFFERED_TO_FIRST_PARTY' && isFirstParty) {
      return <ReOfferedActions {...sharedProps} />;
    }
    if (status === 'FIRST_PARTY_APPROVED' && isFirstParty && !secondPartySent && onWithdraw) {
      return (
        <WithdrawActions
          isSubmitting={isSubmitting}
          isHe={isHe}
          withdrawCountdown={withdrawCountdown}
          onWithdraw={onWithdraw}
          dict={dict.withdraw}
        />
      );
    }
    return <DefaultActions isSubmitting={isSubmitting} isHe={isHe} onAskQuestion={onAskQuestion} label={dict.ask} />;
  };

  const showAskExtra =
    status === 'PENDING_FIRST_PARTY' ||
    status === 'PENDING_SECOND_PARTY' ||
    status === 'FIRST_PARTY_INTERESTED' ||
    status === 'RE_OFFERED_TO_FIRST_PARTY';

  const isOpen = isExpanded;

  return (
    <div
      className={cn(
        'flex-shrink-0 border-t transition-all duration-300 ease-in-out relative z-10',
        'bg-white/80 backdrop-blur-xl border-gray-200/50',
        isOpen ? 'p-4 md:p-6' : 'py-2.5 px-4 md:px-6'
      )}
    >
      {/* Subtle gradient top line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Collapsible header */}
        <div
          className="flex justify-between items-center cursor-pointer group"
          onClick={onToggleExpand}
        >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">
                  {isExpanded ? dict.titleExpanded : dict.titleCollapsed}
                </p>
                <p className={cn(
                  'mt-0.5 transition-all',
                  isExpanded ? 'text-sm text-gray-500' : 'text-xs text-gray-400'
                )}>
                  {dict.subtitle}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-gray-400 hover:bg-gray-100/60 group-hover:scale-110 transition-all duration-200"
            >
              {isExpanded
                ? <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                : <ChevronUp className="w-5 h-5 transition-transform duration-300" />
              }
            </Button>
        </div>

        {/* Action buttons */}
        {isOpen && (
          <div className="space-y-2.5 mt-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            {renderButtons()}
            {showAskExtra && (
              <button
                type="button"
                onClick={onAskQuestion}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 transition-all duration-200 py-1.5 disabled:opacity-50 hover:bg-violet-50/50 rounded-lg"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {dict.ask}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionsBar;
