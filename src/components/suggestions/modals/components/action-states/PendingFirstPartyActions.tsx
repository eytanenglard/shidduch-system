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
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white shadow-sm rounded-xl h-11 font-bold text-sm"
            disabled={isSubmitting}
            onClick={onInterested}
          >
            <Bookmark className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.interested}
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl h-11 font-bold text-sm"
            disabled={isSubmitting}
            onClick={onDecline}
          >
            <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.decline}
          </Button>
        </div>
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
          <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            {dict.activeProcessExplanation}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        className="sm:flex-[2] bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl h-11 font-bold text-sm"
        disabled={isSubmitting}
        onClick={onApprove}
      >
        {isSubmitting ? (
          <>
            <Loader2 className={cn('w-4 h-4 animate-spin', isHe ? 'ml-2' : 'mr-2')} />
            {dict.sending}
          </>
        ) : (
          <>
            <Heart className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.approve}
          </>
        )}
      </Button>
      <Button
        variant="outline"
        className="sm:flex-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 rounded-xl h-11 font-medium text-sm"
        disabled={isSubmitting}
        onClick={onInterested}
      >
        <Bookmark className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        {dict.interested}
      </Button>
      <Button
        variant="outline"
        className="sm:flex-1 text-gray-500 hover:text-rose-600 hover:bg-rose-50 border-gray-200 hover:border-rose-200 rounded-xl h-11 font-medium text-sm"
        disabled={isSubmitting}
        onClick={onDecline}
      >
        <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        {dict.decline}
      </Button>
    </div>
  );
};

export default PendingFirstPartyActions;
