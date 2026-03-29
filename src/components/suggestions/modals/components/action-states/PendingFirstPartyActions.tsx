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
            className="flex-1 relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-400/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            disabled={isSubmitting}
            onClick={onInterested}
          >
            <Bookmark className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.interested}
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            disabled={isSubmitting}
            onClick={onDecline}
          >
            <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.decline}
          </Button>
        </div>
        <div className="flex items-start gap-2 px-3.5 py-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            {dict.activeProcessExplanation}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        className="group/approve sm:flex-[2] relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        disabled={isSubmitting}
        onClick={onApprove}
      >
        {/* Shimmer effect */}
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/approve:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
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
        className="sm:flex-1 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-400/20 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border-0"
        disabled={isSubmitting}
        onClick={onInterested}
      >
        <Bookmark className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        {dict.interested}
      </Button>
      <Button
        variant="ghost"
        className="sm:flex-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
