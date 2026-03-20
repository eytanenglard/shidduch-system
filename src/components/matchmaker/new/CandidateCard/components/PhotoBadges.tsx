// PhotoBadges.tsx — All badges overlaid on the photo

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Brain,
  Edit2,
  Star,
  AlertTriangle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getBackgroundBadge } from '../MinimalCard.constants';
import type { AvailabilityConfig, CandidateWithAiData, MinimalCardDict } from '../MinimalCard.types';

interface PhotoBadgesProps {
  candidate: CandidateWithAiData;
  hasAiData: boolean;
  isVectorResult: boolean;
  effectiveAiScore: number | undefined;
  isManualEntry: boolean;
  isAiTarget: boolean;
  isSelectableForComparison: boolean;
  hasExistingSuggestion: boolean;
  existingSuggestion: { status: string; createdAt: string } | null;
  availabilityConfig: AvailabilityConfig;
  dict: MinimalCardDict;
}

const PhotoBadges: React.FC<PhotoBadgesProps> = ({
  candidate,
  hasAiData,
  isVectorResult,
  effectiveAiScore,
  isManualEntry,
  isAiTarget,
  isSelectableForComparison,
  hasExistingSuggestion,
  existingSuggestion,
  availabilityConfig,
  dict,
}) => (
  <>
    {/* AI Score badge — top left */}
    {hasAiData && (
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
        <Badge
          className={cn(
            'text-white border-0 shadow-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm',
            isVectorResult
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500'
          )}
        >
          {isVectorResult ? <Zap className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
          <span>
            {isVectorResult
              ? `${Math.round((candidate.aiSimilarity || 0) * 100)}%`
              : dict.aiMatch.replace('{{score}}', effectiveAiScore!.toString())}
          </span>
          {candidate.aiRank && (
            <span className="bg-white/25 px-1.5 py-0.5 rounded text-[10px] font-medium">
              #{candidate.aiRank}
            </span>
          )}
        </Badge>

        {candidate.aiBackgroundCompatibility && (() => {
          const badge = getBackgroundBadge(candidate.aiBackgroundCompatibility);
          if (!badge) return null;
          const IconComponent = badge.icon;
          return (
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border shadow-sm backdrop-blur-sm', badge.color)}>
              <IconComponent className="w-2.5 h-2.5" />
              <span className="font-medium">{badge.label}</span>
            </div>
          );
        })()}
      </div>
    )}

    {/* Status badge + badges — top right */}
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
      {/* Availability */}
      <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg text-[11px] font-bold backdrop-blur-sm', availabilityConfig.className)}>
        {availabilityConfig.icon}
        <span>{availabilityConfig.label}</span>
      </div>

      {/* Manual entry */}
      {isManualEntry && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/90 text-white text-[11px] font-semibold shadow-md backdrop-blur-sm">
          <Edit2 className="w-2.5 h-2.5" />
          <span>{dict.manualEntry}</span>
        </div>
      )}

      {/* Testimonials */}
      {candidate.profile.testimonials &&
        candidate.profile.testimonials.filter((t) => t.status === 'APPROVED').length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-semibold shadow-md cursor-default backdrop-blur-sm">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>
                    {dict.hasTestimonials.replace(
                      '{{count}}',
                      String(candidate.profile.testimonials.filter((t) => t.status === 'APPROVED').length)
                    )}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p>{dict.testimonialsTooltip}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

      {/* AI Target indicator */}
      {isAiTarget && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-semibold shadow-md backdrop-blur-sm">
          <Star className="w-2.5 h-2.5 fill-current" />
          <span>מטרה</span>
        </div>
      )}
    </div>

    {/* Existing suggestion — left side */}
    {hasExistingSuggestion && isSelectableForComparison && (
      <div className={cn(
        'absolute top-3 z-20 transition-all duration-200',
        'left-3',
        hasAiData ? 'top-16' : 'top-3'
      )}>
        <div className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold shadow-lg backdrop-blur-sm',
          existingSuggestion?.status === 'BLOCKED' || !existingSuggestion?.status
            ? 'bg-red-500 text-white'
            : 'bg-amber-500 text-white'
        )}>
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>
            {existingSuggestion?.status === 'PENDING'
              ? (dict.existingSuggestion?.pending ?? 'ממתין')
              : (dict.existingSuggestion?.blocked ?? 'בתהליך')}
          </span>
        </div>
      </div>
    )}
  </>
);

export default React.memo(PhotoBadges);
