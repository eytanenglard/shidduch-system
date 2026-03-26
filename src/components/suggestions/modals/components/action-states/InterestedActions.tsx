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
    {!isUserInActiveProcess && (
      <Button
        className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl h-12 font-bold text-base"
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
      className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl h-11 font-medium"
      disabled={isSubmitting}
      onClick={onDecline}
    >
      <Trash2 className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
      {dict.removeFromList}
    </Button>
  </div>
);

export default InterestedActions;
