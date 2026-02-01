// src/components/matchmaker/new/PotentialMatches/PotentialMatchCard.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import AllReasoningsDisplay from './AllReasoningsDisplay';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { CandidateToHide } from './HideCandidateDialog';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Heart,
  HeartHandshake,
  MapPin,
  EyeOff,
  Bookmark,
  Eye,
  MoreHorizontal,
  Send,
  X,
  Brain,
  Calendar,
  Sparkles,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Undo,
  MessageCircle,
  Mail,
  Briefcase,
  Ruler,
  Languages,
  ThumbsDown,
  MessageSquareX,
  Search, // הוספתי את הייבוא הזה לשימוש בכפתור הסינון
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { PotentialMatch, ScoreBreakdown } from './types/potentialMatches';

import RejectionFeedbackModal, {
  useRejectionFeedback,
} from './RejectionFeedbackModal';

// =============================================================================
// TYPES
// =============================================================================

interface PotentialMatchCardProps {
  match: PotentialMatch;
  onCreateSuggestion: (matchId: string) => void;
  onDismiss: (matchId: string) => void;
  onReview: (matchId: string) => void;
  onRestore: (matchId: string) => void;
  onSave: (matchId: string) => void;
  onViewProfile: (userId: string) => void;
  onAnalyzeCandidate: (candidate: any) => void;
  onProfileFeedback: (candidate: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (matchId: string) => void;
  showSelection?: boolean;
  className?: string;
  onHideCandidate: (candidate: CandidateToHide) => void;
  hiddenCandidateIds?: Set<string>;
  onFilterByUser: (fullName: string) => void; // הוספתי את הפונקציה הזו
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-gray-600';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 85) return 'from-emerald-500 to-green-500';
  if (score >= 75) return 'from-blue-500 to-cyan-500';
  if (score >= 70) return 'from-amber-500 to-yellow-500';
  return 'from-gray-500 to-slate-500';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return {
        label: 'ממתין',
        color: 'bg-yellow-100 text-yellow-700',
        icon: Clock,
      };
    case 'REVIEWED':
      return { label: 'נבדק', color: 'bg-blue-100 text-blue-700', icon: Eye };
    case 'SENT':
      return {
        label: 'נשלחה הצעה',
        color: 'bg-green-100 text-green-700',
        icon: Send,
      };
    case 'DISMISSED':
      return { label: 'נדחה', color: 'bg-gray-100 text-gray-700', icon: X };
    case 'SHORTLISTED':
      return {
        label: 'שמור בצד',
        color: 'bg-purple-100 text-purple-700',
        icon: Bookmark,
      };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
  }
};

const getReligiousLevelLabel = (level: string | null): string => {
  if (!level) return 'לא צוין';
  const labels: Record<string, string> = {
    dati_leumi_torani: 'דתי לאומי תורני',
    dati_leumi_standard: 'דתי לאומי',
    dati_leumi_liberal: 'דתי לאומי ליברלי',
    charedi_modern: 'חרדי מודרני',
    masorti_strong: 'מסורתי חזק',
    masorti_light: 'מסורתי',
    secular_traditional_connection: 'חילוני עם קשר למסורת',
    secular: 'חילוני',
  };
  return labels[level] || level;
};

const formatLanguages = (
  native: string | null | undefined,
  additional: string[] | null | undefined
): string => {
  const langMap: Record<string, string> = {
    hebrew: 'עברית',
    english: 'אנגלית',
    russian: 'רוסית',
    french: 'צרפתית',
    spanish: 'ספרדית',
    amharic: 'אמהרית',
    arabic: 'ערבית',
    german: 'גרמנית',
    italian: 'איטלקית',
  };

  const langs = [native, ...(additional || [])].filter(Boolean) as string[];

  return langs
    .map((lang) => langMap[lang.toLowerCase()] || lang)
    .slice(0, 3)
    .join(', ');
};

const getMaritalStatusLabel = (status: string | null | undefined): string => {
  if (!status) return '';
  const map: Record<string, string> = {
    single: 'רווק/ה',
    divorced: 'גרוש/ה',
    widowed: 'אלמן/ה',
    divorced_with_children: 'גרוש/ה +',
    widowed_with_children: 'אלמן/ה +',
  };
  return map[status.toLowerCase()] || status;
};

// =============================================================================
// ALL SCORES DISPLAY - הצגת ציונים מכל השיטות
// =============================================================================

const AllScoresDisplay: React.FC<{
  match: PotentialMatch;
}> = ({ match }) => {
  const scores = [
    {
      key: 'hybrid',
      label: 'היברידי',
      description: 'סריקה היברידית (4 שלבים)',
      score: match.hybridScore,
      icon: '🔥',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-200',
    },
    {
      key: 'algorithmic',
      label: 'AI',
      description: 'ניתוח AI מעמיק',
      score: match.algorithmicScore,
      icon: '🧠',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    {
      key: 'vector',
      label: 'מהיר',
      description: 'סריקה וקטורית מהירה',
      score: match.vectorScore,
      icon: '⚡',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    {
      key: 'metricsV2',
      label: 'V2',
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
    <div className="flex flex-wrap gap-1.5">
      {scores.map(
        ({
          key,
          label,
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
                      'flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-help transition-all hover:scale-105',
                      bgColor,
                      borderColor,
                      isCurrentMethod && 'ring-2 ring-offset-1 ring-emerald-400'
                    )}
                  >
                    <span>{icon}</span>
                    <span className={cn('font-bold', textColor)}>
                      {Math.round(score!)}
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
// SUB-COMPONENTS
// =============================================================================

const CandidatePreview: React.FC<{
  candidate: any;
  gender: 'male' | 'female';
  activeSuggestion: any;
  onViewProfile: () => void;
  onAnalyze: () => void;
  onFeedback: () => void;
  onHide: (candidate: CandidateToHide) => void;
  onFilterByName: () => void; // הוספתי את הפונקציה הזו
}> = ({
  candidate,
  gender,
  activeSuggestion,
  onViewProfile,
  onAnalyze,
  onFeedback,
  onHide,
  onFilterByName,
}) => {
  const genderIcon = gender === 'male' ? '👨' : '👩';
  const borderColor = gender === 'male' ? 'border-blue-200' : 'border-pink-200';
  const bgGradient =
    gender === 'male' ? 'from-blue-50 to-cyan-50' : 'from-pink-50 to-rose-50';

  const languagesStr = formatLanguages(
    candidate.nativeLanguage,
    candidate.additionalLanguages
  );

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();

    let cleanPhone = candidate.phone?.replace(/\D/g, '') || '';
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '972' + cleanPhone.substring(1);
    }

    if (cleanPhone) {
      const message = `היי ${candidate.firstName} זה איתן מנשמהטק. אני מאוד שמח שנרשמת למערכת שלנו ואני מקווה מאוד לעזור לך למצוא את הזוגיות שתמיד חלמת עליה`;
      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        '_blank'
      );
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();

    const subject = `היי ${candidate.firstName} מנשמהטק 💜`;
    const body = `היי ${candidate.firstName},
זה איתן מנשמהטק.

אני מאוד שמח שנרשמת למערכת שלנו ואני מקווה מאוד לעזור לך למצוא את הזוגיות שתמיד חלמת עליה.

איתן
נשמהטק`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    window.open(
      `mailto:${candidate.email || ''}?subject=${encodedSubject}&body=${encodedBody}`,
      '_blank'
    );
  };

  return (
    <div
      className={cn(
        'relative flex-1 min-w-0 overflow-hidden p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md flex flex-col',
        borderColor,
        `bg-gradient-to-br ${bgGradient}`
      )}
      onClick={onViewProfile}
    >
      <div className="flex-1 cursor-pointer min-w-0 w-full">
        {/* תמונה וסטטוס */}
        <div className="relative w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white shadow-md">
          {candidate.mainImage ? (
            <Image
              src={getRelativeCloudinaryPath(candidate.mainImage)}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xl">
              {genderIcon}
            </div>
          )}

          {candidate.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
              <UserCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* שם */}
        <h4
          className="text-center font-bold text-gray-800 text-sm mb-1 truncate px-1"
          title={`${candidate.firstName} ${candidate.lastName}`}
        >
          {candidate.firstName} {candidate.lastName}
        </h4>

        {/* אזור המידע */}
        <div className="flex flex-col gap-1.5 mb-2 w-full overflow-hidden">
          {/* שורה 1: גיל | סטטוס | גובה */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-700 flex-wrap">
            <span className="font-medium">{candidate.age}</span>

            {candidate.maritalStatus && (
              <>
                <span className="text-gray-300">|</span>
                <span
                  className="truncate max-w-[80px]"
                  title={getMaritalStatusLabel(candidate.maritalStatus)}
                >
                  {getMaritalStatusLabel(candidate.maritalStatus)}
                </span>
              </>
            )}

            {candidate.height && (
              <>
                <span className="text-gray-300">|</span>
                <span
                  className="flex items-center gap-0.5 shrink-0"
                  title="גובה"
                >
                  {candidate.height} <Ruler className="w-3 h-3 text-gray-400" />
                </span>
              </>
            )}
          </div>

          {/* שורה 2: עיר */}
          {candidate.city && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 w-full min-w-0 px-2">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate" title={candidate.city}>
                {candidate.city}
              </span>
            </div>
          )}

          {/* שורה 3: עיסוק */}
          {candidate.occupation && (
            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 w-full min-w-0 px-2">
              <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate" title={candidate.occupation}>
                {candidate.occupation}
              </span>
            </div>
          )}

          {/* שורה 4: שפות */}
          {languagesStr && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 w-full min-w-0 px-2">
              <Languages className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate" title={languagesStr}>
                {languagesStr}
              </span>
            </div>
          )}
        </div>

        {/* רמה דתית */}
        <div className="flex justify-center w-full px-2">
          <div
            className="text-center text-[10px] text-purple-600 font-medium bg-purple-50 rounded-full py-0.5 px-2 max-w-full truncate"
            title={getReligiousLevelLabel(candidate.religiousLevel)}
          >
            {getReligiousLevelLabel(candidate.religiousLevel)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-center gap-2">
        {/* כפתור סינון לפי שם (חדש) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/60 hover:bg-indigo-100 hover:text-indigo-600 shadow-sm border border-transparent hover:border-indigo-200 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterByName();
                }}
              >
                <Search className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>סנן לפי שם מועמד</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {candidate.phone && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-white/60 hover:bg-green-100 hover:text-green-600 shadow-sm border border-transparent hover:border-green-200 transition-all"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>שלח וואטסאפ</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/60 hover:bg-purple-100 hover:text-purple-600 shadow-sm border border-transparent hover:border-purple-200 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze();
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ניתוח פרופיל AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/60 hover:bg-blue-100 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-200 transition-all"
                onClick={handleEmail}
              >
                <Mail className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>שלח מייל</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-white/60 hover:bg-amber-100 hover:text-amber-600 shadow-sm border border-transparent hover:border-amber-200 transition-all absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation();
                onHide({
                  id: candidate.id,
                  firstName: candidate.firstName,
                  lastName: candidate.lastName,
                  mainImage: candidate.mainImage,
                  gender: gender === 'male' ? 'MALE' : 'FEMALE',
                });
              }}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>הסתר זמנית</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {activeSuggestion && (
        <div className="mt-2 text-center">
          <Badge
            variant="outline"
            className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 px-1 py-0 h-5"
          >
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            בהצעה פעילה
          </Badge>
        </div>
      )}
    </div>
  );
};

// Score Breakdown Component
const ScoreBreakdownDisplay: React.FC<{
  breakdown: ScoreBreakdown;
}> = ({ breakdown }) => {
  // PotentialMatchCard.tsx - ScoreBreakdownDisplay
  const categories = [
    { key: 'religious', label: 'התאמה דתית', max: 25, color: 'bg-purple-500' },
    {
      key: 'ageCompatibility',
      label: 'התאמת גיל',
      max: 10,
      color: 'bg-blue-500',
    },
    {
      key: 'careerFamily',
      label: 'קריירה-משפחה',
      max: 15,
      color: 'bg-cyan-500',
    },
    { key: 'lifestyle', label: 'סגנון חיים', max: 10, color: 'bg-green-500' },
    {
      key: 'socioEconomic',
      label: 'סוציו-אקונומי',
      max: 10,
      color: 'bg-orange-500',
    }, // 🆕
    { key: 'education', label: 'השכלה', max: 10, color: 'bg-pink-500' }, // 🆕
    { key: 'background', label: 'רקע תרבותי', max: 10, color: 'bg-amber-500' }, // 🆕
    { key: 'values', label: 'ערכים', max: 10, color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const value = breakdown[cat.key as keyof ScoreBreakdown] || 0;
        const percentage = (value / cat.max) * 100;

        return (
          <div key={cat.key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24 truncate">
              {cat.label}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={cn('h-full rounded-full', cat.color)}
              />
            </div>
            <span className="text-xs text-gray-500 w-12 text-left">
              {value}/{cat.max}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// קומפוננטת עזר לפורמט הנימוק
const ReasoningContent: React.FC<{ reasoning: string | null | undefined }> = ({
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
// MAIN COMPONENT
// =============================================================================

const PotentialMatchCard: React.FC<PotentialMatchCardProps> = ({
  match,
  onCreateSuggestion,
  onDismiss,
  onReview,
  onRestore,
  onViewProfile,
  onAnalyzeCandidate,
  onProfileFeedback,
  onSave,
  isSelected = false,
  onToggleSelect,
  showSelection = false,
  className,
  onHideCandidate,
  onFilterByUser, // Destructuring
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReasoningDialog, setShowReasoningDialog] = useState(false);
const [showAllReasonings, setShowAllReasonings] = useState(false);

  const rejectionFeedback = useRejectionFeedback();

  const statusBadge = getStatusBadge(match.status);
  const StatusIcon = statusBadge.icon;

  const isDismissed = match.status === 'DISMISSED';
  const isSent = match.status === 'SENT';

  const handleDismissWithFeedback = () => {
    rejectionFeedback.open({
      partyA: {
        id: match.male.id,
        profileId: match.male.profileId,
        firstName: match.male.firstName,
        lastName: match.male.lastName,
        gender: 'MALE',
      },
      partyB: {
        id: match.female.id,
        profileId: match.female.profileId,
        firstName: match.female.firstName,
        lastName: match.female.lastName,
        gender: 'FEMALE',
      },
      defaultRejectingParty: 'A',
      potentialMatchId: match.id,
    });
  };

  const handleFeedbackSubmit = async (data: any) => {
    try {
      await rejectionFeedback.submit(data);
      onDismiss(match.id);
    } catch (error) {
      console.error('Failed to submit feedback', error);
    }
  };

  // פעולה לדחייה מהירה
  const handleQuickDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(match.id);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card
          className={cn(
            'group relative overflow-hidden transition-all duration-300',
            'hover:shadow-xl border-0',
            isDismissed && 'opacity-60',
            isSelected && 'ring-2 ring-blue-500',
            match.hasActiveWarning && !isDismissed && 'ring-2 ring-amber-400'
          )}
        >
          {/* Gradient Background */}
          <div
            className={cn(
              'absolute inset-0 opacity-30',
              `bg-gradient-to-br ${getScoreBgColor(match.aiScore)}`
            )}
          />

          {/* Content */}
          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              {/* Selection Checkbox */}
              {showSelection && onToggleSelect && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(match.id)}
                    className="border-2"
                  />
                </div>
              )}

              {/* Score Badges - All Methods */}
              <AllScoresDisplay match={match} />

              {/* Status Badge */}
              <Badge className={cn('gap-1', statusBadge.color)}>
                <StatusIcon className="w-3 h-3" />
                {statusBadge.label}
              </Badge>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isSent && !isDismissed && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onCreateSuggestion(match.id)}
                      >
                        <HeartHandshake className="w-4 h-4 ml-2 text-green-600" />
                        צור הצעה
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onReview(match.id)}>
                        <Eye className="w-4 h-4 ml-2 text-blue-600" />
                        סמן כנבדק
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleQuickDismiss}
                        className="text-orange-600"
                      >
                        <ThumbsDown className="w-4 h-4 ml-2" />
                        דחייה מהירה
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDismissWithFeedback}
                        className="text-red-600"
                      >
                        <MessageSquareX className="w-4 h-4 ml-2" />
                        דחייה עם פירוט
                      </DropdownMenuItem>
                    </>
                  )}
                  {isDismissed && (
                    <DropdownMenuItem onClick={() => onRestore(match.id)}>
                      <Undo className="w-4 h-4 ml-2 text-blue-600" />
                      שחזר התאמה
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Candidates Preview Row */}
            <div className="flex gap-3 mb-4">
              <CandidatePreview
                candidate={match.male}
                gender="male"
                activeSuggestion={match.maleActiveSuggestion}
                onViewProfile={() => onViewProfile(match.male.id)}
                onAnalyze={() => onAnalyzeCandidate(match.male)}
                onFeedback={() => onProfileFeedback(match.male)}
                onHide={onHideCandidate}
                onFilterByName={() =>
                  onFilterByUser(
                    `${match.male.firstName} ${match.male.lastName}`
                  )
                }
              />

              {/* Heart Connector */}
              <div className="flex flex-col justify-center items-center gap-1 z-10">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    'bg-gradient-to-br from-pink-500 to-red-500 shadow-lg'
                  )}
                >
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              </div>

              <CandidatePreview
                candidate={match.female}
                gender="female"
                activeSuggestion={match.femaleActiveSuggestion}
                onViewProfile={() => onViewProfile(match.female.id)}
                onAnalyze={() => onAnalyzeCandidate(match.female)}
                onFeedback={() => onProfileFeedback(match.female)}
                onHide={onHideCandidate}
                onFilterByName={() =>
                  onFilterByUser(
                    `${match.female.firstName} ${match.female.lastName}`
                  )
                }
              />
            </div>

        {/* Reasoning Preview */}
{match.shortReasoning && (
  <div
    className="p-3 rounded-lg bg-gradient-to-br from-purple-50/80 to-indigo-50/80 backdrop-blur-sm cursor-pointer hover:from-purple-100/90 hover:to-indigo-100/90 transition-all duration-200 border border-purple-100 shadow-sm"
    onClick={() => setShowAllReasonings(true)}  // 🆕 שינוי כאן
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
          {/* 🆕 הצגת כמה שיטות זמינות */}
          <Badge variant="outline" className="text-[10px] bg-white/50">
            {[
              match.hybridReasoning,
              match.algorithmicReasoning,
              match.vectorReasoning,
              match.metricsV2Reasoning,
            ].filter(Boolean).length} שיטות
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
)}

{/* 🆕 All Reasonings Dialog */}
<AllReasoningsDisplay
  match={match}
  isOpen={showAllReasonings}
  onClose={() => setShowAllReasonings(false)}
/>

            {/* Footer: Date & Details Toggle */}
            <div className="flex items-center justify-between mt-3 pt-2">
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDistanceToNow(new Date(match.scannedAt), {
                  addSuffix: true,
                  locale: he,
                })}
              </span>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-gray-500 hover:text-gray-800"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    הסתר פרטים <ChevronUp className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    הצג ניקוד מלא <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Score Breakdown */}
            {showDetails && match.scoreBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100"
              >
                <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
              </motion.div>
            )}

            {/* Main Action Buttons (Bottom) */}
            {!isDismissed && !isSent && (
              <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100">
                <Button
                  className="flex-1 h-9 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm text-sm"
                  onClick={() => onCreateSuggestion(match.id)}
                >
                  <HeartHandshake className="w-4 h-4 ml-2" />
                  צור הצעה
                </Button>
                {match.status !== 'SHORTLISTED' && (
                  <Button
                    variant="outline"
                    className="h-9 px-3 text-purple-600 border-purple-200 hover:bg-purple-50"
                    onClick={() => onSave(match.id)}
                    title="שמור בצד"
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                )}

                {/* Quick Reject Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-9 w-9 px-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                        onClick={handleQuickDismiss}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>דחייה מהירה (חוסר התאמה)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Detailed Reject Button */}
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={handleDismissWithFeedback}
                >
                  <MessageSquareX className="w-4 h-4 ml-2" />
                  דחה + פירוט
                </Button>
              </div>
            )}

            {/* Link to Suggestion if sent */}
            {isSent && match.suggestionId && (
              <div className="mt-4 p-2 rounded-lg bg-green-50 border border-green-200 text-center">
                <Button
                  variant="link"
                  size="sm"
                  className="text-green-700 p-0 h-auto font-medium"
                  onClick={() =>
                    (window.location.href = `/matchmaker/suggestions?id=${match.suggestionId}`)
                  }
                >
                  עבור להצעה <ExternalLink className="w-3 h-3 mr-1" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Reasoning Dialog */}
      <Dialog open={showReasoningDialog} onOpenChange={setShowReasoningDialog}>
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
              onClick={() => setShowReasoningDialog(false)}
            >
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Feedback Modal Integration */}
      {rejectionFeedback.context && (
        <RejectionFeedbackModal
          isOpen={rejectionFeedback.isOpen}
          onClose={rejectionFeedback.close}
          onSubmit={handleFeedbackSubmit}
          partyA={rejectionFeedback.context.partyA}
          partyB={rejectionFeedback.context.partyB}
          defaultRejectingParty={
            rejectionFeedback.context.defaultRejectingParty
          }
          potentialMatchId={rejectionFeedback.context.potentialMatchId}
        />
      )}
    </>
  );
};

export default PotentialMatchCard;
