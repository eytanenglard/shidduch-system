// src/components/matchmaker/new/PotentialMatches/match-card/ScoreDisplay.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PotentialMatch, ScoreBreakdown } from '../types/potentialMatches';
import { SCORE_BREAKDOWN_CATEGORIES } from '@/lib/constants/matching';
import { getScoreColor } from './types';

// =============================================================================
// ASYMMETRY INDICATOR - displays gap between scan methods
// =============================================================================

export const AsymmetryIndicator: React.FC<{ match: PotentialMatch }> = ({ match }) => {
  const methodScores = [
    { key: 'hybrid', label: 'היב׳', score: match.hybridScore, color: 'bg-emerald-500' },
    { key: 'algorithmic', label: 'AI', score: match.algorithmicScore, color: 'bg-purple-500' },
    { key: 'vector', label: 'מהיר', score: match.vectorScore, color: 'bg-blue-500' },
    { key: 'metricsV2', label: 'V2', score: match.metricsV2Score, color: 'bg-indigo-500' },
  ].filter((s): s is typeof s & { score: number } => s.score !== null && s.score !== undefined);

  if (methodScores.length < 2) return null;

  const maxScore = Math.max(...methodScores.map(s => s.score));
  const minScore = Math.min(...methodScores.map(s => s.score));
  const gap = maxScore - minScore;

  if (gap < 10) return null;

  const isHigh = gap >= 20;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-medium cursor-help',
              isHigh
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            )}
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {/* Visual mini bars */}
            <div className="flex items-end gap-px h-3.5">
              {methodScores.map((s) => (
                <div
                  key={s.key}
                  className={cn('w-1.5 rounded-t-sm', s.color)}
                  style={{ height: `${Math.max(20, (s.score / 100) * 100)}%`, opacity: s.score === maxScore ? 1 : 0.5 }}
                />
              ))}
            </div>
            <span>±{Math.round(gap)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] p-3">
          <p className="font-bold text-xs mb-2 text-center">
            {isHigh ? 'פער גבוה בין שיטות' : 'פער בינוני בין שיטות'}
          </p>
          {/* Visual score bars in tooltip */}
          <div className="space-y-1.5">
            {methodScores.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 w-6 text-left shrink-0">{s.label}</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', s.color)}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold w-6 text-right shrink-0">{Math.round(s.score)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            טווח: {Math.round(minScore)} – {Math.round(maxScore)}
          </p>
          {isHigh && (
            <p className="text-[10px] text-red-400 mt-1 text-center font-medium">
              מומלץ לבדוק ידנית
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// =============================================================================
// ALL SCORES DISPLAY - scores from all methods
// =============================================================================

export const AllScoresDisplay: React.FC<{
  match: PotentialMatch;
}> = ({ match }) => {
  const scores = [
    {
      key: 'hybrid',
      label: 'היברידי',
      shortLabel: 'היב׳',
      description: 'סריקה היברידית (4 שלבים)',
      score: match.hybridScore,
      icon: '🔥',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      key: 'algorithmic',
      label: 'AI מתקדם',
      shortLabel: 'AI',
      description: 'ניתוח AI מעמיק',
      score: match.algorithmicScore,
      icon: '🧠',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      key: 'vector',
      label: 'סריקה מהירה',
      shortLabel: 'מהיר',
      description: 'סריקה וקטורית מהירה',
      score: match.vectorScore,
      icon: '⚡',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      key: 'metricsV2',
      label: 'מדדים V2',
      shortLabel: 'V2',
      description: 'מטריקות גרסה 2',
      score: match.metricsV2Score,
      icon: '🎯',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-200',
    },
  ].filter((s) => s.score !== null && s.score !== undefined);

  if (scores.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
        <Sparkles className={cn('w-4 h-4', getScoreColor(match.aiScore))} />
        <span className={cn('text-xl font-bold', getScoreColor(match.aiScore))}>
          {Math.round(match.aiScore)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 sm:gap-1.5">
      {scores.map(
        ({
          key,
          label,
          shortLabel,
          description,
          score,
          icon,
          bgColor,
          textColor,
          borderColor,
        }) => {
          const isCurrentMethod =
            key === match.lastScanMethod ||
            (key === 'metricsV2' && match.lastScanMethod === 'metrics_v2');

          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-xs cursor-help transition-all hover:scale-105',
                      bgColor,
                      borderColor,
                      isCurrentMethod && 'ring-2 ring-offset-1 ring-emerald-400'
                    )}
                  >
                    <span className="text-xs sm:text-sm">{icon}</span>
                    <span className={cn('font-bold', textColor)}>
                      {Math.round(score!)}
                    </span>
                    {/* Show short label on mobile, full label on desktop */}
                    <span className={cn('sm:hidden text-[9px] font-medium', textColor)}>
                      {shortLabel}
                    </span>
                    <span className={cn('hidden sm:inline text-[10px] font-medium', textColor)}>
                      {label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-center">
                  <p className="font-bold">{label}</p>
                  <p className="text-xs text-gray-400">{description}</p>
                  <p className="text-sm mt-1">{Math.round(score!)} נקודות</p>
                  {isCurrentMethod && (
                    <p className="text-emerald-400 text-xs mt-1 font-medium">
                      ✓ שיטת הסריקה האחרונה
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
      )}
    </div>
  );
};

// =============================================================================
// SCORE BREAKDOWN DISPLAY - detailed score bars
// =============================================================================

export const ScoreBreakdownDisplay: React.FC<{
  breakdown: ScoreBreakdown;
}> = ({ breakdown }) => {
  const categories = SCORE_BREAKDOWN_CATEGORIES;

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {categories.map((cat) => {
        const value = breakdown[cat.key as keyof ScoreBreakdown] || 0;
        const percentage = (value / cat.max) * 100;

        return (
          <div key={cat.key} className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-gray-600 w-16 sm:w-24 truncate">
              {cat.label}
            </span>
            <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn('h-full rounded-full', cat.color)}
              />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 w-10 sm:w-12 text-left">
              {value}/{cat.max}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AllScoresDisplay;
