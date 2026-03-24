// BottomStats.tsx — Readiness, engagement stats, completeness bar, last active, stale AI indicator

import React from 'react';
import { format } from 'date-fns';
import {
  Heart,
  CheckCircle,
  XSquare,
  ArrowRightCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
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
  hasAiData: boolean;
  lastActive: Date | string | null | undefined;
  dict: MinimalCardDict;
  /** When the profile was last updated */
  profileUpdatedAt?: Date | string | null;
  /** When AI last scored this candidate */
  lastScannedAt?: Date | string | null;
  /** Callback to trigger AI rescan */
  onRescan?: (e: React.MouseEvent) => void;
}

const BottomStats: React.FC<BottomStatsProps> = ({
  readinessConfig,
  wantsToBeFirst,
  hasEngagementStats,
  suggestionsReceived,
  suggestionsAccepted,
  suggestionsDeclined,
  hasAiData,
  lastActive,
  dict,
  profileUpdatedAt,
  lastScannedAt,
  onRescan,
}) => {
  // Check if AI score is stale (profile updated after last scan)
  const isAiStale = (() => {
    if (!hasAiData || !profileUpdatedAt || !lastScannedAt) return false;
    const profileDate = new Date(profileUpdatedAt).getTime();
    const scanDate = new Date(lastScannedAt).getTime();
    return profileDate > scanDate;
  })();

  return (
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
          {isAiStale && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>AI ישן</span>
                    {onRescan && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRescan(e);
                        }}
                        className="mr-0.5 p-0.5 rounded-full hover:bg-amber-200 transition-colors"
                        title="סרוק מחדש"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>הפרופיל עודכן מאז הסריקה האחרונה. ציון ה-AI עשוי להיות לא מעודכן.</p></TooltipContent>
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

      </div>

      {/* Last active (when no AI data) */}
      {lastActive && !hasAiData && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Clock className="w-2.5 h-2.5" />
          <span>{dict.lastActivePrefix} {format(new Date(lastActive), 'dd/MM/yy')}</span>
        </div>
      )}
    </>
  );
};

export default React.memo(BottomStats);
