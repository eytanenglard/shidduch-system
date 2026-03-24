// src/components/matchmaker/new/PotentialMatches/match-card/ReasoningSection.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Brain, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { PotentialMatch, ScoreBreakdown } from '../types/potentialMatches';
import { ScoreBreakdownDisplay } from './ScoreDisplay';
import { getScoreColor } from './types';

// =============================================================================
// REASONING CONTENT - formatted AI reasoning text
// =============================================================================

export const ReasoningContent: React.FC<{ reasoning: string | null | undefined }> = ({
  reasoning,
}) => {
  if (!reasoning) return null;

  const paragraphs = reasoning.split(/\n\n+/).filter((p) => p.trim());

  const formatParagraph = (text: string, index: number) => {
    const isHeader = /^[-•]?\s*[\u0590-\u05FF\w\s]+:$/.test(text.trim());

    const isList =
      text.includes('\n- ') || text.includes('\n• ') || text.includes('\n* ');

    if (isHeader) {
      return (
        <h4
          key={index}
          className="font-semibold text-purple-800 text-sm mt-3 first:mt-0"
        >
          {text.replace(/^[*\-•]\s*/, '')}
        </h4>
      );
    }

    if (isList) {
      const lines = text.split('\n').filter((l) => l.trim());
      return (
        <ul key={index} className="space-y-1.5 my-2">
          {lines.map((line, i) => {
            const cleanLine = line.replace(/^[*\-•]\s*/, '').trim();
            if (!cleanLine) return null;
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-purple-400 mt-1">•</span>
                <span className="leading-relaxed">{cleanLine}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <p
        key={index}
        className="text-sm text-gray-700 leading-relaxed my-2 first:mt-0"
      >
        {text.trim()}
      </p>
    );
  };

  return (
    <div className="space-y-1">
      {paragraphs.map((para, index) => formatParagraph(para, index))}
    </div>
  );
};

// =============================================================================
// REASONING PREVIEW - clickable card area showing short reasoning
// =============================================================================

interface ReasoningPreviewProps {
  match: PotentialMatch;
  onShowAll: () => void;
}

export const ReasoningPreview: React.FC<ReasoningPreviewProps> = ({ match, onShowAll }) => {
  if (!match.shortReasoning) return null;

  return (
    <div
      className="p-3 rounded-lg bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-sm cursor-pointer hover:from-purple-100/90 hover:to-indigo-100/90 transition-all duration-200 border border-purple-100 shadow-sm"
      onClick={onShowAll}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-purple-100">
          <Brain className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-purple-700">
              נימוק AI להתאמה
            </p>
            <Badge
              variant="outline"
              className="text-[10px] bg-white/50"
            >
              {
                [
                  match.hybridReasoning,
                  match.algorithmicReasoning,
                  match.vectorReasoning,
                  match.metricsV2Reasoning,
                ].filter(Boolean).length
              }{' '}
              שיטות
            </Badge>
          </div>
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
            {match.shortReasoning}
          </p>
          <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1">
            <span>לחץ לצפייה בכל הנימוקים</span>
            <ChevronDown className="w-3 h-3" />
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// REASONING DIALOG - full reasoning in modal
// =============================================================================

interface ReasoningDialogProps {
  match: PotentialMatch;
  isOpen: boolean;
  onClose: () => void;
}

export const ReasoningDialog: React.FC<ReasoningDialogProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]" dir="rtl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
              <Brain className="w-5 h-5 text-white" />
            </div>
            נימוק AI להתאמה
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500">ציון התאמה:</span>
            <span
              className={cn(
                'text-lg font-bold',
                getScoreColor(match.aiScore)
              )}
            >
              {Math.round(match.aiScore)}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-5 max-h-[55vh] overflow-y-auto py-4">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-xl border border-purple-100">
            <ReasoningContent
              reasoning={match.detailedReasoning || match.shortReasoning}
            />
          </div>

          {match.scoreBreakdown && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                פירוט הניקוד
              </h4>
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex justify-between items-center">
          <span className="text-xs text-gray-400">
            נסרק{' '}
            {formatDistanceToNow(new Date(match.scannedAt), {
              addSuffix: true,
              locale: he,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReasoningPreview;
