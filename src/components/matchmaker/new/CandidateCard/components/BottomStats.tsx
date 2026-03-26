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

interface RecentSuggestion {
  id: string;
  status: string;
  createdAt: string;
  partnerName: string;
  role: 'first' | 'second';
}

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
  /** Recent suggestion history for tooltip */
  recentSuggestions?: RecentSuggestion[];
}

const STATUS_COLORS: Record<string, string> = {
  FIRST_PARTY_APPROVED: 'bg-emerald-500',
  SECOND_PARTY_APPROVED: 'bg-emerald-500',
  CONTACT_DETAILS_SHARED: 'bg-emerald-500',
  DATING: 'bg-emerald-500',
  ENGAGED: 'bg-emerald-500',
  MARRIED: 'bg-emerald-500',
  FIRST_PARTY_DECLINED: 'bg-red-400',
  SECOND_PARTY_DECLINED: 'bg-red-400',
  CLOSED: 'bg-gray-400',
  CANCELLED: 'bg-gray-400',
  EXPIRED: 'bg-gray-400',
  PENDING_FIRST_PARTY: 'bg-amber-400',
  PENDING_SECOND_PARTY: 'bg-amber-400',
  DRAFT: 'bg-gray-300',
};

const STATUS_LABELS_HE: Record<string, string> = {
  DRAFT: 'טיוטה',
  PENDING_FIRST_PARTY: 'ממתין צד א׳',
  PENDING_SECOND_PARTY: 'ממתין צד ב׳',
  FIRST_PARTY_APPROVED: 'צד א׳ אישר',
  FIRST_PARTY_INTERESTED: 'צד א׳ מעוניין',
  FIRST_PARTY_DECLINED: 'צד א׳ דחה',
  SECOND_PARTY_APPROVED: 'צד ב׳ אישר',
  SECOND_PARTY_DECLINED: 'צד ב׳ דחה',
  CONTACT_DETAILS_SHARED: 'פרטים שותפו',
  DATING: 'בדייטים',
  ENGAGED: 'מאורסים',
  MARRIED: 'נשואים',
  CLOSED: 'סגור',
  CANCELLED: 'בוטל',
  EXPIRED: 'פג תוקף',
};

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
  recentSuggestions,
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

        {/* Right: Engagement stats with rich tooltip */}
        {hasEngagementStats && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 cursor-default">
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5" />
                    {suggestionsReceived}
                  </span>
                  {suggestionsAccepted > 0 && (
                    <span className="flex items-center gap-0.5 text-emerald-500">
                      <CheckCircle className="w-2.5 h-2.5" />
                      {suggestionsAccepted}
                    </span>
                  )}
                  {suggestionsDeclined > 0 && (
                    <span className="flex items-center gap-0.5 text-red-400">
                      <XSquare className="w-2.5 h-2.5" />
                      {suggestionsDeclined}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-0 w-[260px]">
                {recentSuggestions && recentSuggestions.length > 0 ? (
                  <div className="p-2 space-y-1.5">
                    <p className="text-[11px] font-semibold text-gray-500 px-1">הצעות אחרונות</p>
                    {recentSuggestions.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 px-1 py-0.5 text-xs">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_COLORS[s.status] ?? 'bg-gray-300')} />
                        <span className="font-medium truncate flex-1">{s.partnerName}</span>
                        <span className="text-gray-400 text-[10px] shrink-0">
                          {STATUS_LABELS_HE[s.status] ?? s.status}
                        </span>
                        <span className="text-gray-300 text-[10px] shrink-0">
                          {format(new Date(s.createdAt), 'dd/MM')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center">
                    <p className="text-xs text-gray-500">
                      {suggestionsReceived} {dict.stats?.received ?? 'הצעות שהתקבלו'}
                      {suggestionsAccepted > 0 && ` · ${suggestionsAccepted} ${dict.stats?.accepted ?? 'אושרו'}`}
                      {suggestionsDeclined > 0 && ` · ${suggestionsDeclined} ${dict.stats?.declined ?? 'נדחו'}`}
                    </p>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
