'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  XCircle,
  MessageCircle,
  Loader2,
  Sparkles,
  Info,
  Heart,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Bookmark,
  Trash2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickActionsBarProps } from '../types/modal.types';

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
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  // Auto-expand on pending statuses
  const hasPendingAction =
    (status === 'PENDING_FIRST_PARTY' && isFirstParty) ||
    (status === 'PENDING_SECOND_PARTY' && !isFirstParty);

  useEffect(() => {
    if (hasPendingAction) {
      onToggleExpand();
    }
    // Only run on mount / status change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingAction]);

  // Grace period countdown timer
  useEffect(() => {
    if (status !== 'FIRST_PARTY_APPROVED' || !isFirstParty || !approvedAt || secondPartySent) {
      setWithdrawCountdown(null);
      return;
    }

    const GRACE_PERIOD_MS = 5 * 60 * 1000;
    const approvedTime = new Date(approvedAt).getTime();

    const updateCountdown = () => {
      const remaining = GRACE_PERIOD_MS - (Date.now() - approvedTime);
      if (remaining <= 0) {
        setWithdrawCountdown(0);
      } else {
        setWithdrawCountdown(Math.ceil(remaining / 1000));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, isFirstParty, approvedAt, secondPartySent]);

  const renderButtons = () => {
    // CASE: First party pending decision
    if (status === 'PENDING_FIRST_PARTY' && isFirstParty) {
      if (isUserInActiveProcess) {
        return (
          <div className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl rounded-2xl h-14 font-bold text-base"
              disabled={isSubmitting}
              onClick={onInterested}
            >
              <Bookmark className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
              {dict.interested}
            </Button>
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                {dict.activeProcessExplanation}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-2xl h-12 font-bold text-base"
              disabled={isSubmitting}
              onClick={onDecline}
            >
              <XCircle className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
              {dict.decline}
            </Button>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          <Button
            className="relative w-full bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-2xl rounded-2xl h-16 font-bold text-lg"
            disabled={isSubmitting}
            onClick={onApprove}
          >
            {isSubmitting ? (
              <>
                <Loader2 className={cn('w-6 h-6 animate-spin', isHe ? 'ml-3' : 'mr-3')} />
                {dict.sending}
              </>
            ) : (
              <>
                <Heart className={cn('w-6 h-6 animate-pulse', isHe ? 'ml-3' : 'mr-3')} />
                {dict.approve}
                <Sparkles className={cn('w-5 h-5', isHe ? 'mr-2' : 'ml-2')} />
              </>
            )}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-2xl h-12 font-medium text-sm"
              disabled={isSubmitting}
              onClick={onInterested}
            >
              <Bookmark className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
              {dict.interested}
            </Button>
            <Button
              variant="outline"
              className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-2xl h-12 font-medium text-sm"
              disabled={isSubmitting}
              onClick={onDecline}
            >
              <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
              {dict.decline}
            </Button>
          </div>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-teal-600">💡</span>{' '}
            {dict.reminder}
          </p>
        </div>
      );
    }

    // CASE: Second party pending decision
    if (status === 'PENDING_SECOND_PARTY' && !isFirstParty) {
      return (
        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-2xl rounded-2xl h-16 font-bold text-lg"
            disabled={isSubmitting}
            onClick={onApprove}
          >
            {isSubmitting ? (
              <>
                <Loader2 className={cn('w-6 h-6 animate-spin', isHe ? 'ml-3' : 'mr-3')} />
                {dict.sending}
              </>
            ) : (
              <>
                <Heart className={cn('w-6 h-6 animate-pulse', isHe ? 'ml-3' : 'mr-3')} />
                {dict.approve}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-2xl h-12 font-bold"
            disabled={isSubmitting}
            onClick={onDecline}
          >
            <XCircle className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
            {dict.decline}
          </Button>
        </div>
      );
    }

    // CASE: Saved in interested/waitlist
    if (status === 'FIRST_PARTY_INTERESTED' && isFirstParty) {
      return (
        <div className="space-y-3">
          {!isUserInActiveProcess && (
            <Button
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-2xl rounded-2xl h-14 font-bold text-base"
              disabled={isSubmitting}
              onClick={onApprove}
            >
              <Heart className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
              {dict.activateNow}
            </Button>
          )}
          {isUserInActiveProcess && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                {dict.activeProcessExplanation}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200 rounded-2xl h-12 font-medium"
            disabled={isSubmitting}
            onClick={onDecline}
          >
            <Trash2 className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.removeFromList}
          </Button>
        </div>
      );
    }

    // CASE: Re-offered to first party
    if (status === 'RE_OFFERED_TO_FIRST_PARTY' && isFirstParty) {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-200">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              {dict.reOfferInfo}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 rounded-2xl h-12 font-medium"
              disabled={isSubmitting}
              onClick={onDecline}
            >
              <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
              {dict.decline}
            </Button>
            <Button
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg rounded-2xl h-12 font-medium"
              disabled={isSubmitting}
              onClick={onApprove}
            >
              <Heart className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
              {dict.approve}
            </Button>
          </div>
        </div>
      );
    }

    // CASE: First party approved — show withdraw option
    if (status === 'FIRST_PARTY_APPROVED' && isFirstParty && !secondPartySent && onWithdraw) {
      const isInGracePeriod = withdrawCountdown !== null && withdrawCountdown > 0;
      const graceMinutes = Math.floor((withdrawCountdown || 0) / 60);
      const graceSeconds = (withdrawCountdown || 0) % 60;
      const wd = dict.withdraw;

      return (
        <div className="space-y-3">
          {isInGracePeriod && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">
                    {wd.gracePeriodTitle}
                  </p>
                  <p className="text-xs text-amber-600">
                    {wd.gracePeriodTimer
                      .replace('{minutes}', String(graceMinutes))
                      .replace('{seconds}', graceSeconds.toString().padStart(2, '0'))}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-amber-700 hover:text-amber-800 hover:bg-amber-100 border-amber-300 rounded-2xl h-12 font-bold"
                disabled={isSubmitting}
                onClick={() => onWithdraw('grace_period')}
              >
                <XCircle className={cn('w-5 h-5', isHe ? 'ml-2' : 'mr-2')} />
                {wd.undoApproval}
              </Button>
            </div>
          )}

          {!isInGracePeriod && (
            <>
              <div className="flex items-start gap-2 px-3 py-2.5 bg-teal-50 rounded-xl border border-teal-200">
                <Info className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-teal-700 leading-relaxed">
                  {wd.approvedInfo}
                </p>
              </div>

              {showWithdrawConfirm ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-rose-800 text-center">
                    {wd.confirmTitle}
                  </p>
                  <p className="text-xs text-rose-600 text-center leading-relaxed">
                    {wd.confirmMessage}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-10 text-sm"
                      onClick={() => setShowWithdrawConfirm(false)}
                      disabled={isSubmitting}
                    >
                      {wd.goBack}
                    </Button>
                    <Button
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-10 text-sm font-bold"
                      disabled={isSubmitting}
                      onClick={() => {
                        setShowWithdrawConfirm(false);
                        onWithdraw('before_second_party');
                      }}
                    >
                      {wd.confirmButton}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200 rounded-2xl h-11 font-medium text-sm"
                  disabled={isSubmitting}
                  onClick={() => setShowWithdrawConfirm(true)}
                >
                  <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
                  {wd.cancelApproval}
                </Button>
              )}
            </>
          )}
        </div>
      );
    }

    // CASE: All other statuses
    return (
      <Button
        variant="outline"
        onClick={onAskQuestion}
        disabled={isSubmitting}
        className="w-full border-2 border-teal-200 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-300 rounded-2xl h-14 font-bold text-base shadow-lg"
      >
        <MessageCircle className={cn('w-6 h-6', isHe ? 'ml-3' : 'mr-3')} />
        {dict.ask}
      </Button>
    );
  };

  const showAskExtra =
    status === 'PENDING_FIRST_PARTY' ||
    status === 'PENDING_SECOND_PARTY' ||
    status === 'FIRST_PARTY_INTERESTED' ||
    status === 'RE_OFFERED_TO_FIRST_PARTY';

  return (
    <div
      className={cn(
        'flex-shrink-0 bg-gradient-to-r from-white via-teal-50/50 to-orange-50/50 backdrop-blur-sm border-t border-teal-100 transition-all duration-500 ease-in-out relative z-10',
        isExpanded ? 'p-4 md:p-6' : 'py-2.5 px-4 md:px-6'
      )}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <div
          className="flex justify-between items-center cursor-pointer group"
          onClick={onToggleExpand}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-teal-800">
                {isExpanded ? dict.titleExpanded : dict.titleCollapsed}
              </p>
              {isExpanded && (
                <p className="text-sm text-gray-600 mt-0.5">{dict.subtitle}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9 text-teal-600 hover:bg-teal-100/50 group-hover:scale-110 transition-all"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </Button>
        </div>
        {isExpanded && (
          <div className="mt-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 space-y-3">
            {renderButtons()}
            {showAskExtra && (
              <Button
                variant="outline"
                onClick={onAskQuestion}
                disabled={isSubmitting}
                className="w-full border-2 border-teal-200 text-teal-700 bg-white/50 hover:bg-white hover:border-teal-300 rounded-2xl h-12 font-medium shadow-sm"
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
