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
      <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">
          {dict.activeProcessExplanation}
        </p>
      </div>
    )}
    <div className="flex flex-col sm:flex-row gap-3">
      {!isUserInActiveProcess && (
        <Button
          className="sm:flex-[2] bg-teal-600 hover:bg-teal-700 text-white shadow-sm rounded-xl h-11 font-bold text-sm"
          disabled={isSubmitting}
          onClick={onApprove}
        >
          <Heart className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          {dict.activateNow}
        </Button>
      )}
      <Button
        variant="outline"
        className={cn(
          'text-gray-500 hover:text-rose-600 hover:bg-rose-50 border-gray-200 hover:border-rose-200 rounded-xl h-11 font-medium text-sm',
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
