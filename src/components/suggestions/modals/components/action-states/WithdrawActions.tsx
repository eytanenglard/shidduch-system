'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionsDictionary } from '@/types/dictionary';

interface WithdrawActionsProps {
  isSubmitting: boolean;
  isHe: boolean;
  withdrawCountdown: number | null;
  onWithdraw: (type: 'grace_period' | 'before_second_party') => void;
  dict: SuggestionsDictionary['modal']['actions']['withdraw'];
}

const WithdrawActions: React.FC<WithdrawActionsProps> = ({
  isSubmitting,
  isHe,
  withdrawCountdown,
  onWithdraw,
  dict,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const isInGracePeriod = withdrawCountdown !== null && withdrawCountdown > 0;
  const graceMinutes = Math.floor((withdrawCountdown || 0) / 60);
  const graceSeconds = (withdrawCountdown || 0) % 60;

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
                {dict.gracePeriodTitle}
              </p>
              <p className="text-xs text-amber-600">
                {dict.gracePeriodTimer
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
            {dict.undoApproval}
          </Button>
        </div>
      )}

      {!isInGracePeriod && (
        <>
          <div className="flex items-start gap-2 px-3 py-2.5 bg-teal-50 rounded-xl border border-teal-200">
            <Info className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-teal-700 leading-relaxed">
              {dict.approvedInfo}
            </p>
          </div>

          {showConfirm ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-rose-800 text-center">
                {dict.confirmTitle}
              </p>
              <p className="text-xs text-rose-600 text-center leading-relaxed">
                {dict.confirmMessage}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl h-10 text-sm"
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                >
                  {dict.goBack}
                </Button>
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl h-10 text-sm font-bold"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowConfirm(false);
                    onWithdraw('before_second_party');
                  }}
                >
                  {dict.confirmButton}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200 rounded-2xl h-11 font-medium text-sm"
              disabled={isSubmitting}
              onClick={() => setShowConfirm(true)}
            >
              <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
              {dict.cancelApproval}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default WithdrawActions;
