// FloatingActions.tsx — Hover actions toolbar (AI reasoning, email, dropdown, AI target)

import React from 'react';
import {
  Zap,
  Brain,
  Mail,
  MoreHorizontal,
  Edit2,
  Sparkles,
  Star,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CandidateWithAiData, MinimalCardDict } from '../MinimalCard.types';
import type { Candidate } from '../../types/candidates';

interface FloatingActionsProps {
  candidate: CandidateWithAiData;
  hasAiData: boolean;
  isVectorResult: boolean;
  isAiTarget: boolean;
  onSetAiTarget?: (candidate: Candidate, e: React.MouseEvent) => void;
  onEdit?: (candidate: Candidate, e: React.MouseEvent) => void;
  onAnalyze?: (candidate: Candidate, e: React.MouseEvent) => void;
  onSendProfileFeedback?: (candidate: Candidate, e: React.MouseEvent) => void;
  onShowReasoning: () => void;
  dict: MinimalCardDict;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({
  candidate,
  hasAiData,
  isVectorResult,
  isAiTarget,
  onSetAiTarget,
  onEdit,
  onAnalyze,
  onSendProfileFeedback,
  onShowReasoning,
  dict,
}) => (
  <div
    className={cn(
      'absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 transition-all duration-200',
      hasAiData
        ? 'opacity-100'
        : 'opacity-100 lg:opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
    )}
  >
    {/* AI Reasoning button */}
    {hasAiData && candidate.aiReasoning && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-7 px-2.5 border-0 shadow-xl hover:scale-105 transition-all duration-200 text-white text-xs font-medium gap-1.5',
                isVectorResult
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              )}
              onClick={(e) => { e.stopPropagation(); onShowReasoning(); }}
            >
              {isVectorResult ? <Zap className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
              <span>{isVectorResult ? (dict.vectorReasoning ?? 'נימוק') : (dict.aiReasoning ?? 'נימוק AI')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{isVectorResult ? 'הצג ניתוח דמיון' : 'הצג נימוק AI'}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}

    {/* Email */}
    {candidate.email && !candidate.email.endsWith('@shidduch.placeholder.com') && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-white/95 shadow-xl border-0 hover:bg-white hover:scale-105 transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <a href={`mailto:${candidate.email}`}>
                <Mail className="h-3 w-3 text-gray-600" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>{candidate.email}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}

    {/* More actions dropdown */}
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-white/95 shadow-xl border-0 hover:bg-white hover:scale-105 transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent><p>פעולות נוספות</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="start" className="shadow-2xl">
        {candidate.phone && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              let cleanPhone = candidate.phone?.replace(/\D/g, '') || '';
              if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.substring(1);
              if (cleanPhone) {
                const message = `היי ${candidate.firstName} 👋\n\nזה איתן מנשמהטק.\n\nעברתי על הפרופיל שלך ויש לי רעיון שאולי יתאים לך.\n\nבלי שום לחץ - רוצה לשמוע? 🙂\n\n🌐 https://neshamatech.com\n📘 https://www.facebook.com/profile.php?id=61584869664974`;
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
              }
            }}
            className="text-green-700 hover:text-green-800 hover:bg-green-50"
          >
            <MessageCircle className="h-4 w-4 ml-2" />
            <span>{dict.tooltips.whatsapp ?? 'שלח וואטסאפ'}</span>
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(candidate, e); }}>
            <Edit2 className="h-4 w-4 ml-2" />
            <span>{dict.tooltips.editProfile}</span>
          </DropdownMenuItem>
        )}
        {onAnalyze && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAnalyze(candidate, e); }}>
            <Sparkles className="h-4 w-4 ml-2" />
            <span>{dict.tooltips.aiAnalysis}</span>
          </DropdownMenuItem>
        )}
        {onSendProfileFeedback && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendProfileFeedback(candidate, e); }}>
            <Mail className="h-4 w-4 ml-2" />
            <span>שלח דוח פרופיל</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>

    {/* AI Target button */}
    {onSetAiTarget && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                'h-7 w-7 shadow-xl border-0 hover:scale-105 transition-all duration-200',
                isAiTarget
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                  : 'bg-white/95 hover:bg-white text-gray-600'
              )}
              onClick={(e) => { e.stopPropagation(); onSetAiTarget(candidate, e); }}
            >
              <Star className={cn('h-3 w-3 transition-all duration-200', isAiTarget ? 'fill-current' : '')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isAiTarget ? dict.tooltips.clearAiTarget : dict.tooltips.setAsAiTarget}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);

export default React.memo(FloatingActions);
