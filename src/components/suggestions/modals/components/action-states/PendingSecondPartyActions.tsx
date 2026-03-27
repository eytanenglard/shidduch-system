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
      className="sm:flex-[2] bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md rounded-xl h-11 font-bold text-sm"
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
      className="sm:flex-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200 rounded-xl h-11 font-bold text-sm"
      disabled={isSubmitting}
      onClick={onDecline}
    >
      <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
      {dict.decline}
    </Button>
  </div>
);

export default PendingSecondPartyActions;
