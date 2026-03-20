// BottomStats.tsx — Readiness, engagement stats, completeness bar, last active

import React from 'react';
import { format } from 'date-fns';
import {
  Heart,
  CheckCircle,
  XSquare,
  ArrowRightCircle,
  Clock,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ReadinessConfig, MinimalCardDict } from '../MinimalCard.types';

interface BottomStatsProps {
  readinessConfig: ReadinessConfig | null;
  wantsToBeFirst: boolean;
  hasEngagementStats: boolean;
  suggestionsReceived: number;
  suggestionsAccepted: number;
  suggestionsDeclined: number;
  profileCompleteness: number;
  hasAiData: boolean;
  lastActive: Date | string | null | undefined;
  dict: MinimalCardDict;
}

const BottomStats: React.FC<BottomStatsProps> = ({
  readinessConfig,
  wantsToBeFirst,
  hasEngagementStats,
  suggestionsReceived,
  suggestionsAccepted,
  suggestionsDeclined,
  profileCompleteness,
  hasAiData,
  lastActive,
  dict,
}) => (
  <>
    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
      {/* Left: Readiness + wantsFirst */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {readinessConfig && (
          <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', readinessConfig.bg, readinessConfig.color)}>
            {readinessConfig.emoji} {readinessConfig.label}
          </span>
        )}
        {wantsToBeFirst && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                  <ArrowRightCircle className="w-2.5 h-2.5" />
                  <span>צד ראשון</span>
                </span>
              </TooltipTrigger>
              <TooltipContent><p>{dict.wantsToBeFirst ?? 'מעוניין/ת להיות צד ראשון'}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Right: Engagement stats */}
      {hasEngagementStats && (
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="flex items-center gap-0.5">
                  <Heart className="w-2.5 h-2.5" />
                  {suggestionsReceived}
                </span>
              </TooltipTrigger>
              <TooltipContent><p>{dict.stats?.received ?? 'הצעות שהתקבלו'}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {suggestionsAccepted > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="flex items-center gap-0.5 text-emerald-500">
                    <CheckCircle className="w-2.5 h-2.5" />
                    {suggestionsAccepted}
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>{dict.stats?.accepted ?? 'אושרו'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {suggestionsDeclined > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="flex items-center gap-0.5 text-red-400">
                    <XSquare className="w-2.5 h-2.5" />
                    {suggestionsDeclined}
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>{dict.stats?.declined ?? 'נדחו'}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Profile completeness bar */}
      {!hasEngagementStats && profileCompleteness < 100 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      profileCompleteness === 100 ? 'bg-emerald-500' :
                      profileCompleteness >= 75 ? 'bg-blue-500' :
                      profileCompleteness >= 50 ? 'bg-amber-500' : 'bg-red-400'
                    )}
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
                <span className="text-[11px] text-gray-400">{profileCompleteness}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{profileCompleteness === 100
                ? (dict.profileComplete ?? 'פרופיל מלא')
                : (dict.profileIncomplete ?? `פרופיל: ${profileCompleteness}%`)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>

    {/* Last active (when no AI data) */}
    {lastActive && !hasAiData && (
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-gray-400">
        <span>{dict.lastActivePrefix} {format(new Date(lastActive), 'dd/MM/yy')}</span>
        <Clock className="w-2.5 h-2.5" />
      </div>
    )}
  </>
);

export default React.memo(BottomStats);
