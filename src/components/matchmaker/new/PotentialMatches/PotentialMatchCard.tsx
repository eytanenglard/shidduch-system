// =============================================================================
// src/components/matchmaker/PotentialMatches/PotentialMatchCard.tsx
// כרטיס התאמה פוטנציאלית - מציג זוג מועמדים עם ציון AI
// =============================================================================

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
  MapPin,
  Briefcase,
  Calendar,
  Star,
  Eye,
  EyeOff,
  MoreHorizontal,
  Send,
  X,
  MessageSquare,
  Brain,
  Sparkles,
  Clock,
  UserCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Undo,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { PotentialMatch, ScoreBreakdown } from '@/types/potentialMatches';

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

const getBackgroundBadge = (compatibility: string | null) => {
  switch (compatibility) {
    case 'excellent':
      return { label: 'רקע מצוין', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    case 'good':
      return { label: 'רקע טוב', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'possible':
      return { label: 'רקע אפשרי', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'problematic':
      return { label: 'פער רקע', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    case 'not_recommended':
      return { label: 'רקע בעייתי', color: 'bg-red-100 text-red-700 border-red-200' };
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PENDING':
      return { label: 'ממתין', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    case 'REVIEWED':
      return { label: 'נבדק', color: 'bg-blue-100 text-blue-700', icon: Eye };
    case 'SENT':
      return { label: 'נשלחה הצעה', color: 'bg-green-100 text-green-700', icon: Send };
    case 'DISMISSED':
      return { label: 'נדחה', color: 'bg-gray-100 text-gray-700', icon: X };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
  }
};

const getReligiousLevelLabel = (level: string | null): string => {
  if (!level) return 'לא צוין';
  
  const labels: Record<string, string> = {
    'dati_leumi_torani': 'דתי לאומי תורני',
    'dati_leumi_standard': 'דתי לאומי',
    'dati_leumi_liberal': 'דתי לאומי ליברלי',
    'charedi_modern': 'חרדי מודרני',
    'masorti_strong': 'מסורתי חזק',
    'masorti_light': 'מסורתי',
    'secular_traditional_connection': 'חילוני עם קשר למסורת',
    'secular': 'חילוני',
  };
  
  return labels[level] || level;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// כרטיס מועמד בודד (בתוך הזוג)
const CandidatePreview: React.FC<{
  candidate: PotentialMatch['male'] | PotentialMatch['female'];
  gender: 'male' | 'female';
  activeSuggestion: PotentialMatch['maleActiveSuggestion'] | PotentialMatch['femaleActiveSuggestion'];
  onViewProfile: () => void;
}> = ({ candidate, gender, activeSuggestion, onViewProfile }) => {
  const genderIcon = gender === 'male' ? '👨' : '👩';
  const borderColor = gender === 'male' ? 'border-blue-200' : 'border-pink-200';
  const bgGradient = gender === 'male' 
    ? 'from-blue-50 to-cyan-50' 
    : 'from-pink-50 to-rose-50';

  return (
    <div className={cn(
      'relative flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md cursor-pointer',
      borderColor,
      `bg-gradient-to-br ${bgGradient}`
    )}
    onClick={onViewProfile}
    >
      {/* תמונה */}
      <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-3 border-white shadow-lg">
        {candidate.mainImage ? (
          <Image
            src={getRelativeCloudinaryPath(candidate.mainImage)}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-2xl">
            {genderIcon}
          </div>
        )}
        
        {/* אייקון אימות */}
        {candidate.isVerified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
            <UserCheck className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* שם */}
      <h4 className="text-center font-bold text-gray-800 mb-1">
        {candidate.firstName} {candidate.lastName}
      </h4>

      {/* גיל ועיר */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
        <span>{candidate.age}</span>
        {candidate.city && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {candidate.city}
            </span>
          </>
        )}
      </div>

      {/* רמה דתית */}
      <div className="text-center text-xs text-gray-500 mb-2">
        {getReligiousLevelLabel(candidate.religiousLevel)}
      </div>

      {/* מקצוע */}
      {candidate.occupation && (
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
          <Briefcase className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{candidate.occupation}</span>
        </div>
      )}

      {/* אזהרה על הצעה פעילה */}
      {activeSuggestion && (
        <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-1 text-amber-700 text-xs">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              בהצעה עם {activeSuggestion.withCandidateName}
            </span>
          </div>
        </div>
      )}

      {/* כפתור צפייה */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white/80 hover:bg-white shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile();
          }}
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

// פירוט הציון
const ScoreBreakdownDisplay: React.FC<{
  breakdown: ScoreBreakdown;
}> = ({ breakdown }) => {
  const categories = [
    { key: 'religious', label: 'התאמה דתית', max: 35, color: 'bg-purple-500' },
    { key: 'ageCompatibility', label: 'התאמת גיל', max: 10, color: 'bg-blue-500' },
    { key: 'careerFamily', label: 'קריירה-משפחה', max: 15, color: 'bg-cyan-500' },
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
            <span className="text-xs text-gray-600 w-24 truncate">{cat.label}</span>
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

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={className}
      >
        <Card className={cn(
          'group relative overflow-hidden transition-all duration-300',
          'hover:shadow-xl border-0',
          isDismissed && 'opacity-60',
          isSelected && 'ring-2 ring-blue-500',
          match.hasActiveWarning && !isDismissed && 'ring-2 ring-amber-400'
        )}>
          {/* Gradient Background */}
          <div className={cn(
            'absolute inset-0 opacity-30',
            `bg-gradient-to-br ${getScoreBgColor(match.aiScore)}`
          )} />

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
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-white/90 backdrop-blur-sm shadow-lg'
              )}>
                <Sparkles className={cn('w-5 h-5', getScoreColor(match.aiScore))} />
                <span className={cn('text-2xl font-bold', getScoreColor(match.aiScore))}>
                  {Math.round(match.aiScore)}
                </span>
                <span className="text-sm text-gray-500">/ 100</span>
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
                      <DropdownMenuItem onClick={() => onCreateSuggestion(match.id)}>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewProfile(match.male.id)}>
                    <ExternalLink className="w-4 h-4 ml-2" />
                    צפה בפרופיל {match.male.firstName}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewProfile(match.female.id)}>
                    <ExternalLink className="w-4 h-4 ml-2" />
                    צפה בפרופיל {match.female.firstName}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Warning Banner */}
            {match.hasActiveWarning && !isDismissed && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-700">
                  אחד המועמדים או שניהם נמצאים בהצעה פעילה
                </span>
              </div>
            )}

            {/* Candidates */}
            <div className="flex gap-4 mb-4">
              <CandidatePreview
                candidate={match.male}
                gender="male"
                activeSuggestion={match.maleActiveSuggestion}
                onViewProfile={() => onViewProfile(match.male.id)}
              />
              
              {/* Heart Connector */}
              <div className="flex items-center justify-center">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  'bg-gradient-to-br from-pink-500 to-red-500 shadow-lg'
                )}>
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              <CandidatePreview
                candidate={match.female}
                gender="female"
                activeSuggestion={match.femaleActiveSuggestion}
                onViewProfile={() => onViewProfile(match.female.id)}
              />
            </div>

            {/* Reasoning Preview */}
            {match.shortReasoning && (
              <div 
                className="p-3 rounded-lg bg-white/60 backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-colors"
                onClick={() => setShowReasoningDialog(true)}
              >
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {match.shortReasoning}
                  </p>
                </div>
                <button className="text-xs text-purple-600 mt-1 hover:underline">
                  קרא עוד...
                </button>
              </div>
            )}

            {/* Background Badge & Date */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200/50">
              <div className="flex items-center gap-2">
                {backgroundBadge && (
                  <Badge variant="outline" className={backgroundBadge.color}>
                    {backgroundBadge.label}
                  </Badge>
                )}
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(match.scannedAt), { 
                        addSuffix: true, 
                        locale: he 
                      })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    נסרק ב-{new Date(match.scannedAt).toLocaleDateString('he-IL')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Expand Details Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4 ml-1" />
                  הסתר פירוט
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 ml-1" />
                  הצג פירוט ציון
                </>
              )}
            </Button>

            {/* Score Breakdown */}
            {showDetails && match.scoreBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 rounded-lg bg-white/80 backdrop-blur-sm"
              >
                <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  פירוט הציון
                </h5>
                <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
              </motion.div>
            )}

            {/* Quick Action Buttons */}
            {!isDismissed && !isSent && (
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                  onClick={() => onCreateSuggestion(match.id)}
                >
                  <HeartHandshake className="w-4 h-4 ml-2" />
                  צור הצעה
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => onDismiss(match.id)}
                >
                  <X className="w-4 h-4 ml-2" />
                  דחה
                </Button>
              </div>
            )}

            {/* Link to Suggestion */}
            {isSent && match.suggestionId && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    הצעה נשלחה
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-700 hover:text-green-800"
                    onClick={() => {
                      // Navigate to suggestion
                      window.location.href = `/matchmaker/suggestions?id=${match.suggestionId}`;
                    }}
                  >
                    צפה בהצעה
                    <ExternalLink className="w-3 h-3 mr-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Reasoning Dialog */}
      <Dialog open={showReasoningDialog} onOpenChange={setShowReasoningDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              נימוק ההתאמה
            </DialogTitle>
            <DialogDescription>
              {match.male.firstName} {match.male.lastName} ← {match.female.firstName} {match.female.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                `bg-gradient-to-br ${getScoreBgColor(match.aiScore)}`
              )}>
                <span className="text-2xl font-bold text-white">
                  {Math.round(match.aiScore)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">ציון התאמה כולל</p>
                <p className="text-sm text-gray-500">מבוסס על ניתוח AI מעמיק</p>
              </div>
            </div>

            {/* Short Reasoning */}
            {match.shortReasoning && (
              <div className="p-4 rounded-lg bg-white border">
                <h4 className="font-medium text-gray-800 mb-2">סיכום קצר</h4>
                <p className="text-gray-700">{match.shortReasoning}</p>
              </div>
            )}

            {/* Detailed Reasoning */}
            {match.detailedReasoning && (
              <div className="p-4 rounded-lg bg-white border">
                <h4 className="font-medium text-gray-800 mb-2">ניתוח מפורט</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{match.detailedReasoning}</p>
              </div>
            )}

            {/* Score Breakdown */}
            {match.scoreBreakdown && (
              <div className="p-4 rounded-lg bg-white border">
                <h4 className="font-medium text-gray-800 mb-3">פירוט הציון</h4>
                <ScoreBreakdownDisplay breakdown={match.scoreBreakdown} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasoningDialog(false)}>
              סגור
            </Button>
            {!isSent && !isDismissed && (
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-500"
                onClick={() => {
                  setShowReasoningDialog(false);
                  onCreateSuggestion(match.id);
                }}
              >
                <HeartHandshake className="w-4 h-4 ml-2" />
                צור הצעה
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PotentialMatchCard;
