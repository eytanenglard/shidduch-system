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
    <Button
      variant="outline"
      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 rounded-xl h-11 font-bold"
      disabled={isSubmitting}
      onClick={onDecline}
    >
      <XCircle className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
      {dict.decline}
    </Button>
  </div>
);

export default PendingSecondPartyActions;
