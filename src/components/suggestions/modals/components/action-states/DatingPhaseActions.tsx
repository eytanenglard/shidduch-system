'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  CheckCircle2,
  Lightbulb,
  XCircle,
  TrendingUp,
  Heart,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionsDictionary } from '@/types/dictionary';

interface DatingPhaseActionsProps {
  status: string;
  isSubmitting: boolean;
  isHe: boolean;
  onStatusUpdate: (newStatus: string) => void;
  dict: SuggestionsDictionary['modal']['actions']['datingPhase'];
}

const DatingPhaseActions: React.FC<DatingPhaseActionsProps> = ({
  status,
  isSubmitting,
  isHe,
  onStatusUpdate,
  dict,
}) => {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  if (showEndConfirm) {
    return (
      <div className="space-y-3">
        <div className="px-4 py-3 bg-rose-50/80 rounded-xl border border-rose-100">
          <p className="text-sm font-semibold text-rose-700 mb-1">{dict.confirmEndTitle}</p>
          <p className="text-xs text-rose-600">{dict.confirmEndMessage}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11 font-medium text-sm border-gray-200 hover:bg-gray-50"
            onClick={() => setShowEndConfirm(false)}
            disabled={isSubmitting}
          >
            {dict.goBack}
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl h-11 font-medium text-sm shadow-md shadow-rose-400/20"
            onClick={() => onStatusUpdate('ENDED_AFTER_FIRST_DATE')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              dict.confirmEndButton
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'CONTACT_DETAILS_SHARED') {
    return (
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button
            className="group/btn sm:flex-1 relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            disabled={isSubmitting}
            onClick={() => onStatusUpdate('MEETING_SCHEDULED')}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            {isSubmitting ? (
              <Loader2 className={cn('w-4 h-4 animate-spin', isHe ? 'ml-2' : 'mr-2')} />
            ) : (
              <Calendar className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            )}
            {dict.dateScheduled}
          </Button>
          <Button
            variant="outline"
            className="sm:flex-1 border-violet-200 text-violet-700 bg-white hover:bg-violet-50 hover:border-violet-300 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            disabled={isSubmitting}
            onClick={() => onStatusUpdate('AWAITING_FIRST_DATE_FEEDBACK')}
          >
            <CheckCircle2 className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
            {dict.dateHappened}
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'MEETING_SCHEDULED') {
    return (
      <Button
        className="group/btn w-full relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        disabled={isSubmitting}
        onClick={() => onStatusUpdate('AWAITING_FIRST_DATE_FEEDBACK')}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
        {isSubmitting ? (
          <Loader2 className={cn('w-4 h-4 animate-spin', isHe ? 'ml-2' : 'mr-2')} />
        ) : (
          <CheckCircle2 className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        )}
        {dict.dateWentWell}
      </Button>
    );
  }

  if (status === 'AWAITING_FIRST_DATE_FEEDBACK') {
    return (
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button
          variant="outline"
          className="sm:flex-1 border-amber-200 text-amber-700 bg-white hover:bg-amber-50 hover:border-amber-300 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isSubmitting}
          onClick={() => onStatusUpdate('THINKING_AFTER_DATE')}
        >
          {isSubmitting ? (
            <Loader2 className={cn('w-4 h-4 animate-spin', isHe ? 'ml-2' : 'mr-2')} />
          ) : (
            <Lightbulb className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          )}
          {dict.thinking}
        </Button>
        <Button
          variant="ghost"
          className="sm:flex-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isSubmitting}
          onClick={() => setShowEndConfirm(true)}
        >
          <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          {dict.notContinuing}
        </Button>
      </div>
    );
  }

  if (status === 'THINKING_AFTER_DATE') {
    return (
      <div className="flex flex-col sm:flex-row gap-2.5">
        <Button
          className="group/btn sm:flex-[2] relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          disabled={isSubmitting}
          onClick={() => onStatusUpdate('PROCEEDING_TO_SECOND_DATE')}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
          {isSubmitting ? (
            <Loader2 className={cn('w-4 h-4 animate-spin', isHe ? 'ml-2' : 'mr-2')} />
          ) : (
            <TrendingUp className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          )}
          {dict.proceedSecond}
        </Button>
        <Button
          variant="ghost"
          className="sm:flex-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl h-12 font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isSubmitting}
          onClick={() => setShowEndConfirm(true)}
        >
          <XCircle className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
          {dict.notContinuing}
        </Button>
      </div>
    );
  }

  if (status === 'PROCEEDING_TO_SECOND_DATE') {
    return (
      <Button
        className="group/btn w-full relative overflow-hidden bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25 rounded-xl h-12 font-bold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
        disabled={isSubmitting}
        onClick={() => onStatusUpdate('DATING')}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
        {isSubmitting ? (
          <Loader2 className={cn('w-4 h-4 animate-spin', isHe ? 'ml-2' : 'mr-2')} />
        ) : (
          <Heart className={cn('w-4 h-4', isHe ? 'ml-2' : 'mr-2')} />
        )}
        {dict.inProcess}
      </Button>
    );
  }

  return null;
};

export default DatingPhaseActions;
