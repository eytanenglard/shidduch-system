'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionStateProps } from '../../types/modal.types';

const ReOfferedActions: React.FC<ActionStateProps> = ({
  isSubmitting,
  isHe,
  onApprove,
  onDecline,
  dict,
}) => (
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
        className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl h-11 font-medium"
        disabled={isSubmitting}
        onClick={onDecline}
      >
        <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        {dict.decline}
      </Button>
      <Button
        className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl h-11 font-medium"
        disabled={isSubmitting}
        onClick={onApprove}
      >
        <Heart className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        {dict.approve}
      </Button>
    </div>
  </div>
);

export default ReOfferedActions;
