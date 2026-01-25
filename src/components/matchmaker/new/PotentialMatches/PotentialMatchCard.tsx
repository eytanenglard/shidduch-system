// src/components/matchmaker/new/PotentialMatches/PotentialMatchCard.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
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
  MessageCircle, // WhatsApp
  Mail, // Email/Feedback
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { PotentialMatch, ScoreBreakdown } from './types/potentialMatches';

// --- New Integration: Rejection Feedback ---
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

  // New Action Callbacks
  onAnalyzeCandidate: (candidate: any) => void;
  onProfileFeedback: (candidate: any) => void;

  isSelected?: boolean;
  onToggleSelect?: (matchId: string) => void;
  showSelection?: boolean;
  className?: string;
  onHideCandidate: (candidate: CandidateToHide) => void;
  hiddenCandidateIds?: Set<string>;
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

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// כרטיס מועמד בודד (בתוך הזוג)
const CandidatePreview: React.FC<{
  candidate: any;
  gender: 'male' | 'female';
  activeSuggestion: any;
  onViewProfile: () => void;
  onAnalyze: () => void;
  onFeedback: () => void;
  onHide: (candidate: CandidateToHide) => void;
}> = ({
  candidate,
  gender,
  activeSuggestion,
  onViewProfile,
  onAnalyze,
  onFeedback,
  onHide,
}) => {
  const genderIcon = gender === 'male' ? '👨' : '👩';
  const borderColor = gender === 'male' ? 'border-blue-200' : 'border-pink-200';
  const bgGradient =
    gender === 'male' ? 'from-blue-50 to-cyan-50' : 'from-pink-50 to-rose-50';

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

  return (
    <div
      className={cn(
        'relative flex-1 p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md flex flex-col',
        borderColor,
        `bg-gradient-to-br ${bgGradient}`
      )}
      onClick={onViewProfile}
    >
      <div className="flex-1 cursor-pointer">
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

        <h4 className="text-center font-bold text-gray-800 text-sm mb-1 truncate">
          {candidate.firstName} {candidate.lastName}
        </h4>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-1">
          <span>{candidate.age}</span>
          {candidate.city && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5 truncate max-w-[80px]">
                <MapPin className="w-3 h-3" />
                {candidate.city}
              </span>
            </>
          )}
        </div>

        <div className="text-center text-[10px] text-gray-500 mb-1 truncate px-1">
          {getReligiousLevelLabel(candidate.religiousLevel)}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-center gap-2">
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
                onClick={(e) => {
                  e.stopPropagation();
                  onFeedback();
                }}
              >
                <Mail className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>שלח דוח פרופיל (מייל)</p>
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
  onAnalyzeCandidate,
  onProfileFeedback,
  onSave,
  isSelected = false,
  onToggleSelect,
  showSelection = false,
  className,
  onHideCandidate,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showReasoningDialog, setShowReasoningDialog] = useState(false);

  // --- Rejection Feedback Hook ---
  const rejectionFeedback = useRejectionFeedback();

  const statusBadge = getStatusBadge(match.status);
  const StatusIcon = statusBadge.icon;

  const isDismissed = match.status === 'DISMISSED';
  const isSent = match.status === 'SENT';

  // --- Handlers ---

  // פתיחת מודל הדחייה
  const handleDismissWithFeedback = () => {
    rejectionFeedback.open({
      // אנו מגדירים את ה-rejecting/rejected לצורכי תיעוד ב-DB.
      // במקרה של דחיית התאמה ע"י שדכן, זה פחות קריטי מי דוחה את מי,
      // אך נבחר קונבנציה: הזכר דוחה את הנקבה (או ההפך) רק כדי למלא את השדות.
      // אפשר גם לאפשר לשדכן לבחור מי לא התאים, אך למען הפשטות כרגע:
      rejectedUser: {
        id: match.female.id,
        firstName: match.female.firstName,
        lastName: match.female.lastName,
      },
      rejectingUser: {
        id: match.male.id,
        firstName: match.male.firstName,
        lastName: match.male.lastName,
      },
      potentialMatchId: match.id,
    });
  };

  // שליחת הפידבק וביצוע הדחייה בפועל
  const handleFeedbackSubmit = async (data: any) => {
    try {
      await rejectionFeedback.submit(data); // שמירת הפידבק ב-DB
      onDismiss(match.id); // עדכון סטטוס ההתאמה ל-DISMISSED בממשק
    } catch (error) {
      console.error('Failed to submit feedback', error);
    }
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

              {/* Score Badge */}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full',
                  'bg-white/90 backdrop-blur-sm shadow-sm'
                )}
              >
                <Sparkles
                  className={cn('w-4 h-4', getScoreColor(match.aiScore))}
                />
                <span
                  className={cn(
                    'text-xl font-bold',
                    getScoreColor(match.aiScore)
                  )}
                >
                  {Math.round(match.aiScore)}
                </span>
              </div>

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
                        onClick={handleDismissWithFeedback}
                        className="text-red-600"
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
              />
            </div>

            {/* Reasoning Preview */}
            {match.shortReasoning && (
              <div
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-colors border border-purple-50"
                onClick={() => setShowReasoningDialog(true)}
              >
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                    {match.shortReasoning}
                  </p>
                </div>
              </div>
            )}

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

                <Button
                  variant="outline"
                  className="flex-1 h-9 text-sm"
                  onClick={handleDismissWithFeedback} // Updated to use feedback modal
                >
                  <X className="w-4 h-4 ml-2" />
                  דחה
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
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>נימוק AI להתאמה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap leading-relaxed text-gray-800">
                {match.detailedReasoning || match.shortReasoning}
              </p>
            </div>
            {match.scoreBreakdown && (
              <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Feedback Modal Integration */}
      {rejectionFeedback.context && (
        <RejectionFeedbackModal
          isOpen={rejectionFeedback.isOpen}
          onClose={rejectionFeedback.close}
          onSubmit={handleFeedbackSubmit}
          rejectedUser={rejectionFeedback.context.rejectedUser}
          rejectingUser={rejectionFeedback.context.rejectingUser}
          potentialMatchId={match.id}
          suggestionId={undefined} // Potential matches usually don't have suggestionId yet
        />
      )}
    </>
  );
};

export default PotentialMatchCard;
