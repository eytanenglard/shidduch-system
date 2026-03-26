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

  const forceExpanded = hasPendingAction;

  // Auto-expand on pending statuses (for non-forced cases)
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

  const isOpen = isExpanded || forceExpanded;

  return (
    <div
      className={cn(
        'flex-shrink-0 bg-white border-t border-gray-200 transition-all duration-300 ease-in-out relative z-10',
        isOpen ? 'p-4 md:p-6' : 'py-2.5 px-4 md:px-6'
      )}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Collapsible header — hidden when force-expanded */}
        {!forceExpanded && (
          <div
            className="flex justify-between items-center cursor-pointer group"
            onClick={onToggleExpand}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center shadow-sm">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">
                  {isExpanded ? dict.titleExpanded : dict.titleCollapsed}
                </p>
                {isExpanded && (
                  <p className="text-sm text-gray-500 mt-0.5">{dict.subtitle}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 text-gray-400 hover:bg-gray-100 group-hover:scale-110 transition-all"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </Button>
          </div>
        )}

        {/* Action buttons */}
        {isOpen && (
          <div className={cn(
            'space-y-3',
            !forceExpanded && 'mt-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500'
          )}>
            {renderButtons()}
            {showAskExtra && (
              <Button
                variant="outline"
                onClick={onAskQuestion}
                disabled={isSubmitting}
                className="w-full border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-xl h-11 font-medium shadow-sm"
              >
                <MessageCircle className={cn('w-5 h-5', isHe ? 'ml-2' : 'mr-2')} />
                {dict.ask}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActionsBar;
