// AiReasoningDialog.tsx — Modal with score breakdown

import React from 'react';
import {
  Zap,
  Brain,
  MessageSquare,
  Globe,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ScoreBreakdown, CandidateWithAiData, MinimalCardDict } from '../MinimalCard.types';

interface AiReasoningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateWithAiData;
  isVectorResult: boolean;
  effectiveAiScore: number | undefined;
  aiTargetName?: string;
  dict: MinimalCardDict;
}

const SCORE_CATEGORIES: { key: keyof ScoreBreakdown; label: string; max: number }[] = [
  { key: 'religious', label: 'דתי', max: 35 },
  { key: 'careerFamily', label: 'קריירה-משפחה', max: 15 },
  { key: 'lifestyle', label: 'סגנון חיים', max: 15 },
  { key: 'ambition', label: 'שאפתנות', max: 12 },
  { key: 'communication', label: 'תקשורת', max: 12 },
  { key: 'values', label: 'ערכים', max: 11 },
];

const AiReasoningDialog: React.FC<AiReasoningDialogProps> = ({
  open,
  onOpenChange,
  candidate,
  isVectorResult,
  effectiveAiScore,
  aiTargetName,
  dict,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className="max-w-md"
      onClick={(e) => e.stopPropagation()}
      onPointerDownOutside={(e) => e.preventDefault()}
      onInteractOutside={(e) => e.preventDefault()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 h-8 w-8 rounded-full hover:bg-gray-100"
        onClick={(e) => { e.stopPropagation(); onOpenChange(false); }}
      >
        <X className="h-4 w-4" />
      </Button>

      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-right pr-2">
          {isVectorResult
            ? <><Zap className="w-5 h-5 text-blue-500" /><span>ניתוח דמיון פרופילים</span></>
            : <><Brain className="w-5 h-5 text-purple-500" /><span>ניתוח AI מתקדם</span></>
          }
        </DialogTitle>
        {aiTargetName && (
          <p className="text-sm text-gray-500 text-right mt-1">
            התאמה עבור: <span className="font-medium text-gray-700">{aiTargetName}</span>
          </p>
        )}
      </DialogHeader>

      <div className="space-y-4">
        {/* Score header */}
        <div className={cn('flex items-center justify-between p-3 rounded-xl', isVectorResult ? 'bg-blue-50' : 'bg-purple-50')}>
          <Badge className={cn('text-white border-0', isVectorResult ? 'bg-blue-500' : 'bg-purple-500')}>
            {effectiveAiScore} נקודות
          </Badge>
          <span className="font-medium text-gray-800">{candidate.firstName} {candidate.lastName}</span>
        </div>

        {/* Reasoning text */}
        <div className="flex items-start gap-3">
          <MessageSquare className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isVectorResult ? 'text-blue-400' : 'text-purple-400')} />
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line text-right">
            {candidate.aiReasoning}
          </p>
        </div>

        {/* Score breakdown */}
        {!isVectorResult && candidate.aiScoreBreakdown && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-600 mb-3 text-right">
              {dict.scoreBreakdown ?? 'פירוט ציון'}:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {SCORE_CATEGORIES.map(({ key, label, max }) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-purple-600 font-semibold">
                    {candidate.aiScoreBreakdown![key]}/{max}
                  </span>
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vector similarity bar */}
        {isVectorResult && candidate.aiSimilarity && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-blue-600 font-bold text-lg">{(candidate.aiSimilarity * 100).toFixed(1)}%</span>
              <span className="text-gray-500">{dict.similarityScore ?? 'ציון דמיון סמנטי'}</span>
            </div>
            <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${candidate.aiSimilarity * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Background multiplier */}
        {candidate.aiBackgroundMultiplier && candidate.aiBackgroundMultiplier !== 1 && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <span className={cn('font-semibold', candidate.aiBackgroundMultiplier > 1 ? 'text-green-600' : 'text-orange-600')}>
              {candidate.aiBackgroundMultiplier > 1 ? '+' : ''}
              {Math.round((candidate.aiBackgroundMultiplier - 1) * 100)}%
            </span>
            <span className="text-gray-500">{dict.backgroundMultiplier ?? 'מכפיל רקע'}:</span>
            <Globe className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default React.memo(AiReasoningDialog);
