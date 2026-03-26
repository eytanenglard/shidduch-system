'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, Bookmark, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionStateProps } from '../../types/modal.types';

interface Props extends ActionStateProps {
  isUserInActiveProcess: boolean;
}

const PendingFirstPartyActions: React.FC<Props> = ({
  isSubmitting,
  isHe,
  isUserInActiveProcess,
  onApprove,
  onDecline,
  onInterested,
  dict,
}) => {
  if (isUserInActiveProcess) {
    return (
      <div className="space-y-3">
        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-sm rounded-xl h-12 font-bold text-base"
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
          className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl h-11 font-bold text-base"
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
        className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl h-12 font-bold text-base"
        disabled={isSubmitting}
        onClick={onApprove}
      >
        {isSubmitting ? (
          <>
            <Loader2 className={cn('w-5 h-5 animate-spin', isHe ? 'ml-3' : 'mr-3')} />
            {dict.sending}
          </>
        ) : (
          <>
            <Heart className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
            {dict.approve}
          </>
        )}
      </Button>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-xl h-11 font-medium text-sm"
          disabled={isSubmitting}
          onClick={onInterested}
        >
          <Bookmark className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          {dict.interested}
        </Button>
        <Button
          variant="outline"
          className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl h-11 font-medium text-sm"
          disabled={isSubmitting}
          onClick={onDecline}
        >
          <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          {dict.decline}
        </Button>
      </div>
    </div>
  );
};

export default PendingFirstPartyActions;
