'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionStateProps } from '../../types/modal.types';

interface Props extends ActionStateProps {
  isUserInActiveProcess: boolean;
}

const InterestedActions: React.FC<Props> = ({
  isSubmitting,
  isHe,
  isUserInActiveProcess,
  onApprove,
  onDecline,
  dict,
}) => (
  <div className="space-y-3">
    {isUserInActiveProcess && (
      <div className="flex items-start gap-2 px-3.5 py-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          {dict.activeProcessExplanation}
        </p>
      </div>
    )}
    <div className="flex flex-col sm:flex-row gap-3">
      {!isUserInActiveProcess && (
        <Button
          className="group/approve sm:flex-[2] relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          disabled={isSubmitting}
          onClick={onApprove}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/approve:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
          <Heart className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          {dict.activateNow}
        </Button>
      )}
      <Button
        variant="ghost"
        className={cn(
          'text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
          isUserInActiveProcess ? 'w-full' : 'sm:flex-1'
        )}
        disabled={isSubmitting}
        onClick={onDecline}
      >
        <Trash2 className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        {dict.removeFromList}
      </Button>
    </div>
  </div>
);

export default InterestedActions;
