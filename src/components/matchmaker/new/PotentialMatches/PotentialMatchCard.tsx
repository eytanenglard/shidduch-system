// =============================================================================
// src/components/matchmaker/new/PotentialMatches/PotentialMatchCard.tsx
// כרטיס התאמה פוטנציאלית - מעודכן לשימוש ב-MinimalCard
// =============================================================================

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogDescription,
  DialogFooter,
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
  CheckCircle,
  Heart,
  HeartHandshake,
  Eye,
  MoreHorizontal,
  Send,
  X,
  Brain,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Undo,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { PotentialMatch, ScoreBreakdown } from '@/types/potentialMatches';
import MinimalCandidateCard from '../../CandidateCard/MinimalCard'; // וודא שהנתיב נכון למיקום הקובץ שלך
import { UserSource } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

interface PotentialMatchCardProps {
  match: PotentialMatch;
  onCreateSuggestion: (matchId: string) => void;
  onDismiss: (matchId: string) => void;
  onReview: (matchId: string) => void;
  onRestore: (matchId: string) => void;
  onViewProfile: (userId: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (matchId: string) => void;
  showSelection?: boolean;
  className?: string;
}

// =============================================================================
// HELPER FUNCTIONS & ADAPTERS
// =============================================================================

// פונקציית עזר להמרת נתונים שטוחים של PotentialMatch למבנה של Candidate מלא
const adaptToCandidate = (
  person: PotentialMatch['male'] | PotentialMatch['female']
): any => {
  // חישוב תאריך לידה משוער לפי הגיל (כי MinimalCard מחשב גיל מתאריך לידה)
  const estimatedBirthYear = new Date().getFullYear() - person.age;
  const estimatedBirthDate = new Date(estimatedBirthYear, 0, 1);

  return {
    id: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    email: 'hidden@email.com', // Placeholder if needed
    phone: '',
    source: UserSource.MANUAL_ENTRY, // Default fallback
    isVerified: person.isVerified,
    isProfileComplete: true,
    images: person.mainImage
      ? [{ url: person.mainImage, isMain: true, id: 'main', key: 'main' }]
      : [],
    profile: {
      birthDate: estimatedBirthDate,
      city: person.city,
      occupation: person.occupation,
      religiousLevel: person.religiousLevel,
      height: person.height,
      availabilityStatus: 'AVAILABLE', // Default
      nativeLanguage: null,
      about: null,
    },
    // הוספת נתוני גיל ישירים למקרה שהקומפוננטה תומכת בזה
    age: person.age,
  };
};

// יצירת מילון ברירת מחדל ל-MinimalCard למקרה שלא מועבר כזה
const DEFAULT_CARD_DICT = {
  availability: {
    AVAILABLE: 'פנוי/ה',
    DATING: 'יוצא/ת',
    UNAVAILABLE: 'לא פנוי/ה',
    UNKNOWN: 'לא ידוע',
  },
  manualEntry: 'הזנה ידנית',
  hasTestimonials: 'יש {{count}} המלצות',
  testimonialsTooltip: 'צפה בהמלצות בפרופיל המלא',
  noImage: 'אין תמונה',
  yearsSuffix: 'שנים',
  heightLabel: 'גובה: {{height}} ס״מ',
  languagesLabel: 'שפות: {{languages}}',
  lastActivePrefix: 'נראה לאחרונה:',
  qualityScore: 'איכות: {{score}}%',
  compare: 'השוואה',
  aiMatch: 'התאמת AI: {{score}}%',
  tooltips: {
    editProfile: 'ערוך פרופיל',
    aiAnalysis: 'ניתוח AI',
    setAsAiTarget: 'קבע כמועמד מטרה',
    clearAiTarget: 'בטל בחירה',
  },
};

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

const getBackgroundBadge = (compatibility: string | null) => {
  switch (compatibility) {
    case 'excellent':
      return {
        label: 'רקע מצוין',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      };
    case 'good':
      return {
        label: 'רקע טוב',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
      };
    case 'possible':
      return {
        label: 'רקע אפשרי',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    case 'problematic':
      return {
        label: 'פער רקע',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
      };
    case 'not_recommended':
      return {
        label: 'רקע בעייתי',
        color: 'bg-red-100 text-red-700 border-red-200',
      };
    default:
      return null;
  }
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
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
  }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// פירוט הציון
const ScoreBreakdownDisplay: React.FC<{
  breakdown: ScoreBreakdown;
}> = ({ breakdown }) => {
  const categories = [
    { key: 'religious', label: 'התאמה דתית', max: 35, color: 'bg-purple-500' },
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
    { key: 'lifestyle', label: 'סגנון חיים', max: 15, color: 'bg-green-500' },
    { key: 'ambition', label: 'שאפתנות', max: 12, color: 'bg-orange-500' },
    { key: 'communication', label: 'תקשורת', max: 12, color: 'bg-pink-500' },
    { key: 'values', label: 'ערכים', max: 11, color: 'bg-indigo-500' },
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
  isSelected = false,
  onToggleSelect,
  showSelection = false,
  className,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReasoningDialog, setShowReasoningDialog] = useState(false);

  const statusBadge = getStatusBadge(match.status);
  const StatusIcon = statusBadge.icon;
  const backgroundBadge = getBackgroundBadge(match.backgroundCompatibility);

  const isDismissed = match.status === 'DISMISSED';
  const isSent = match.status === 'SENT';

  // המרת מועמדים לפורמט ש-MinimalCard מכיר
  const maleCandidate = adaptToCandidate(match.male);
  const femaleCandidate = adaptToCandidate(match.female);

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
            'hover:shadow-xl border-0 bg-gradient-to-br from-white to-gray-50/50',
            isDismissed && 'opacity-60 grayscale',
            isSelected && 'ring-2 ring-blue-500',
            match.hasActiveWarning && !isDismissed && 'ring-2 ring-amber-400'
          )}
        >
          {/* Header Gradient Stripe */}
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-1.5',
              `bg-gradient-to-r ${getScoreBgColor(match.aiScore)}`
            )}
          />

          {/* Content */}
          <div className="relative p-5">
            {/* Header Actions & Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {showSelection && onToggleSelect && (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(match.id)}
                    className="border-2 w-5 h-5"
                  />
                )}

                {/* Score Badge */}
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border',
                    'bg-white'
                  )}
                >
                  <Sparkles
                    className={cn('w-4 h-4', getScoreColor(match.aiScore))}
                  />
                  <span
                    className={cn(
                      'text-lg font-bold',
                      getScoreColor(match.aiScore)
                    )}
                  >
                    {Math.round(match.aiScore)}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    התאמה
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1.5 border-0 shadow-sm',
                    statusBadge.color
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusBadge.label}
                </Badge>
              </div>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-gray-100 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
                        onClick={() => onDismiss(match.id)}
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                      >
                        <X className="w-4 h-4 ml-2" />
                        דחה התאמה
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

            {/* Warning Banner */}
            {match.hasActiveWarning && !isDismissed && (
              <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    התראה פעילה
                  </p>
                  <p className="text-xs text-amber-600">
                    אחד המועמדים או שניהם נמצאים בהצעה פעילה כרגע.
                  </p>
                </div>
              </div>
            )}

            {/* Candidates Display - Side by Side with MinimalCard */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center mb-6">
              {/* Male Card */}
              <div className="w-full">
                <MinimalCandidateCard
                  candidate={maleCandidate}
                  onClick={() => onViewProfile(match.male.id)}
                  dict={DEFAULT_CARD_DICT}
                  className="h-full shadow-sm hover:shadow-md transition-shadow"
                />
                {match.maleActiveSuggestion && (
                  <div className="mt-2 text-center text-xs text-amber-600 font-medium bg-amber-50 py-1 px-2 rounded-full inline-block w-full">
                    בהצעה עם {match.maleActiveSuggestion.withCandidateName}
                  </div>
                )}
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center justify-center gap-2 py-2 md:py-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110',
                    `bg-gradient-to-br ${getScoreBgColor(match.aiScore)}`
                  )}
                >
                  <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
                </div>
                {backgroundBadge && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-2 h-5 whitespace-nowrap',
                      backgroundBadge.color
                    )}
                  >
                    {backgroundBadge.label}
                  </Badge>
                )}
              </div>

              {/* Female Card */}
              <div className="w-full">
                <MinimalCandidateCard
                  candidate={femaleCandidate}
                  onClick={() => onViewProfile(match.female.id)}
                  dict={DEFAULT_CARD_DICT}
                  className="h-full shadow-sm hover:shadow-md transition-shadow"
                />
                {match.femaleActiveSuggestion && (
                  <div className="mt-2 text-center text-xs text-amber-600 font-medium bg-amber-50 py-1 px-2 rounded-full inline-block w-full">
                    בהצעה עם {match.femaleActiveSuggestion.withCandidateName}
                  </div>
                )}
              </div>
            </div>

            {/* AI Reasoning - Compact View */}
            {match.shortReasoning && (
              <div
                className="group/reasoning cursor-pointer relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4 mb-4 transition-all hover:shadow-md"
                onClick={() => setShowReasoningDialog(true)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Brain className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 group-hover/reasoning:line-clamp-none transition-all">
                      {match.shortReasoning}
                    </p>
                    <p className="text-xs text-purple-600 font-medium mt-1.5 flex items-center gap-1 opacity-0 group-hover/reasoning:opacity-100 transition-opacity">
                      לחץ לניתוח מלא <ChevronDown className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer / Meta Data */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5 cursor-help">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(match.scannedAt), {
                        addSuffix: true,
                        locale: he,
                      })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    נסרק ב-
                    {new Date(match.scannedAt).toLocaleDateString('he-IL')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-gray-500 hover:text-gray-900"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <>
                    הסתר מדדים <ChevronUp className="w-3 h-3 mr-1" />
                  </>
                ) : (
                  <>
                    הצג מדדים <ChevronDown className="w-3 h-3 mr-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Expanded Score Details */}
            {showDetails && match.scoreBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-dashed border-gray-200"
              >
                <h5 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Brain className="w-3 h-3 text-purple-500" />
                  פירוט רכיבי התאמה
                </h5>
                <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
              </motion.div>
            )}

            {/* Quick Action Buttons (If not dismissed/sent) */}
            {!isDismissed && !isSent && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                <Button
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50 hover:text-red-600 transition-colors"
                  onClick={() => onDismiss(match.id)}
                >
                  <X className="w-4 h-4 ml-2" />
                  דחה
                </Button>
                <Button
                  className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white shadow-md hover:shadow-lg transition-all"
                  onClick={() => onCreateSuggestion(match.id)}
                >
                  <HeartHandshake className="w-4 h-4 ml-2" />
                  צור הצעה
                </Button>
              </div>
            )}

            {/* Link to Suggestion if sent */}
            {isSent && match.suggestionId && (
              <div className="mt-5">
                <Button
                  variant="outline"
                  className="w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={() => {
                    window.location.href = `/matchmaker/suggestions?id=${match.suggestionId}`;
                  }}
                >
                  <CheckCircle className="w-4 h-4 ml-2" />
                  צפה בהצעה שנשלחה
                  <ExternalLink className="w-3 h-3 mr-2 opacity-50" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Reasoning Dialog */}
      <Dialog open={showReasoningDialog} onOpenChange={setShowReasoningDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-purple-600" />
              ניתוח התאמה ב-AI
            </DialogTitle>
            <DialogDescription className="text-base">
              בין {match.male.firstName} ל-{match.female.firstName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Score Banner */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center shadow-md',
                  `bg-gradient-to-br ${getScoreBgColor(match.aiScore)}`
                )}
              >
                <span className="text-2xl font-bold text-white">
                  {Math.round(match.aiScore)}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">
                  ציון התאמה כולל
                </h4>
                <p className="text-sm text-gray-600">
                  מבוסס על ניתוח עומק של ערכים, אישיות ומטרות
                </p>
              </div>
            </div>

            {/* Reasoning Text */}
            <div className="space-y-4">
              {match.shortReasoning && (
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-gray-500" />
                    תקציר המערכת
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {match.shortReasoning}
                  </p>
                </div>
              )}

              {match.detailedReasoning && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-2">ניתוח מורחב</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                    {match.detailedReasoning}
                  </p>
                </div>
              )}
            </div>

            {/* Score Breakdown inside Dialog */}
            {match.scoreBreakdown && (
              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-800 mb-4">מדדים מפורטים</h4>
                <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowReasoningDialog(false)}
            >
              סגור
            </Button>
            {!isSent && !isDismissed && (
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                onClick={() => {
                  setShowReasoningDialog(false);
                  onCreateSuggestion(match.id);
                }}
              >
                <HeartHandshake className="w-4 h-4 ml-2" />
                צור הצעה עכשיו
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PotentialMatchCard;
