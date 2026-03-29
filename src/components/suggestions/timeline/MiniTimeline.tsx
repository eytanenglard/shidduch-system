// src/components/suggestions/timeline/MiniTimeline.tsx

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchSuggestionStatus } from '@prisma/client';
import type { SuggestionTimelineDict } from '@/types/dictionary';
import SuggestionTimeline from './SuggestionTimeline';

interface StatusHistoryItem {
  id: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

interface MiniTimelineProps {
  statusHistory: StatusHistoryItem[];
  locale: 'he' | 'en';
  dict: SuggestionTimelineDict;
  className?: string;
}

const getCategoryDot = (status: string): string => {
  const s = status as MatchSuggestionStatus;
  if (
    s === 'MATCH_APPROVED' ||
    s === 'DATING' ||
    s === 'ENGAGED' ||
    s === 'MARRIED'
  )
    return 'bg-amber-400';
  if (s.includes('APPROVED') || s === 'PROCEEDING_TO_SECOND_DATE')
    return 'bg-emerald-400';
  if (
    s.includes('DECLINED') ||
    s === 'CANCELLED' ||
    s === 'CLOSED' ||
    s === 'EXPIRED' ||
    s === 'ENDED_AFTER_FIRST_DATE'
  )
    return 'bg-rose-400';
  if (
    s === 'CONTACT_DETAILS_SHARED' ||
    s === 'AWAITING_MATCHMAKER_APPROVAL' ||
    s === 'AWAITING_FIRST_DATE_FEEDBACK' ||
    s === 'MEETING_PENDING' ||
    s === 'MEETING_SCHEDULED'
  )
    return 'bg-blue-400';
  return 'bg-orange-400'; // PENDING, DRAFT, THINKING
};

export default function MiniTimeline({
  statusHistory,
  locale,
  dict,
  className,
}: MiniTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!statusHistory || statusHistory.length === 0) return null;

  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const latestStatus = sortedHistory[0];
  const statusKey = latestStatus.status as MatchSuggestionStatus;
  const statusInfo = dict.statuses[statusKey] || {
    label: latestStatus.status,
    description: '',
  };

  const dateFnsLocale = locale === 'he' ? he : enUS;
  const formattedDate = format(
    new Date(latestStatus.createdAt),
    locale === 'he' ? 'dd/MM/yy' : 'MM/dd/yy',
    { locale: dateFnsLocale }
  );

  return (
    <div className={cn('space-y-0', className)}>
      {/* Mini bar — compact on mobile */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3',
          'bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl border border-gray-100',
          'hover:bg-gray-50 transition-colors group cursor-pointer',
          'shadow-sm'
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Animated dot */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                'w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full',
                getCategoryDot(latestStatus.status)
              )}
            />
            {/* Pulse ring for active statuses */}
            {!latestStatus.status.includes('DECLINED') &&
              !['CANCELLED', 'CLOSED', 'EXPIRED', 'MARRIED'].includes(
                latestStatus.status
              ) && (
                <div
                  className={cn(
                    'absolute inset-0 w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full animate-ping motion-reduce:animate-none opacity-40',
                    getCategoryDot(latestStatus.status)
                  )}
                />
              )}
          </div>

          <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
            {statusInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <span className="text-[10px] sm:text-xs text-gray-400">{formattedDate}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          ) : (
            <ChevronDown className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded full timeline */}
      {isExpanded && (
        <div className="mt-3 animate-in slide-in-from-top-2 fade-in-50 duration-300">
          <SuggestionTimeline
            statusHistory={statusHistory}
            dict={dict}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}
