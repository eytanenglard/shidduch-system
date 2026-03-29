'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionStateProps } from '../../types/modal.types';

const PendingSecondPartyActions: React.FC<ActionStateProps> = ({
  isSubmitting,
  isHe,
  onApprove,
  onDecline,
  dict,
}) => (
  <div className="flex flex-col sm:flex-row gap-3">
    <Button
      className="group/approve sm:flex-[2] relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
      disabled={isSubmitting}
      onClick={onApprove}
    >
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
      variant="ghost"
      className="sm:flex-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      disabled={isSubmitting}
      onClick={onDecline}
    >
      <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
      {dict.decline}
    </Button>
  </div>
);

export default PendingSecondPartyActions;
