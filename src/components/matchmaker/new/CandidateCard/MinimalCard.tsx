// src/components/matchmaker/new/CandidateCard/MinimalCard.tsx
// ============================================================================
// כרטיס מועמד — ברמה הגבוהה ביותר
// מציג: תמונה, שם, גיל, זמינות, פרטים אישיים, דגלים, סטטיסטיקות, AI
// ============================================================================

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import {
  User,
  MapPin,
  MessageCircle,
  Briefcase,
  Edit2,
  Sparkles,
  Star,
  Heart,
  Clock,
  Users,
  Zap,
  MoreHorizontal,
  Mail,
  Ruler,
  Languages,
  Scroll,
  Globe,
  AlertTriangle,
  CheckCircle,
  Info,
  Brain,
  MessageSquare,
  X,
  XSquare,
  GraduationCap,
  ArrowRightCircle,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Candidate } from '../types/candidates';
import { UserSource } from '@prisma/client';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
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
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import { RELIGIOUS_LEVELS } from '../constants/filterOptions';

// ============================================================================
// TYPES
// ============================================================================

interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

interface MinimalCandidateCardProps {
  candidate: Candidate & {
    aiScore?: number;
    aiReasoning?: string;
    aiRank?: number;
    aiFirstPassScore?: number;
    aiScoreBreakdown?: ScoreBreakdown;
    aiBackgroundMultiplier?: number;
    aiBackgroundCompatibility?:
      | 'excellent'
      | 'good'
      | 'possible'
      | 'problematic'
      | 'not_recommended';
    aiSimilarity?: number;
  };
  onClick: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate, e: React.MouseEvent) => void;
  onAnalyze?: (candidate: Candidate, e: React.MouseEvent) => void;
  onSendProfileFeedback?: (candidate: Candidate, e: React.MouseEvent) => void;
  isHighlighted?: boolean;
  highlightTerm?: string;
  className?: string;
  aiScore?: number;
  isAiTarget?: boolean;
  onSetAiTarget?: (candidate: Candidate, e: React.MouseEvent) => void;
  isSelectableForComparison?: boolean;
  isSelectedForComparison?: boolean;
  onToggleComparison?: (candidate: Candidate, e: React.MouseEvent) => void;
  existingSuggestion?: { status: string; createdAt: string } | null;
  aiTargetName?: string;
  dict: MatchmakerPageDictionary['candidatesManager']['list']['minimalCard'] & {
    heightUnit?: string;
    languagesLabel?: string;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

const calculateAge = (birthDate: Date | string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Priority config
const getPriorityConfig = (category: string | null | undefined) => {
  switch (category) {
    case 'CRITICAL':
      return { color: '#EF4444', borderColor: 'border-l-red-500', bg: 'bg-red-50', textColor: 'text-red-700', label: 'דחוף' };
    case 'HIGH':
      return { color: '#F97316', borderColor: 'border-l-orange-500', bg: 'bg-orange-50', textColor: 'text-orange-700', label: 'גבוה' };
    case 'MEDIUM':
      return { color: '#F59E0B', borderColor: 'border-l-amber-400', bg: 'bg-amber-50', textColor: 'text-amber-700', label: 'בינוני' };
    case 'LOW':
      return { color: '#10B981', borderColor: 'border-l-emerald-400', bg: 'bg-emerald-50', textColor: 'text-emerald-700', label: 'נמוך' };
    default:
      return { color: '#E5E7EB', borderColor: 'border-l-gray-200', bg: '', textColor: '', label: '' };
  }
};

// Background compatibility badge
const getBackgroundBadge = (compatibility?: string) => {
  switch (compatibility) {
    case 'excellent':
      return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: 'רקע מצוין' };
    case 'good':
      return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, label: 'רקע טוב' };
    case 'possible':
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Info, label: 'רקע אפשרי' };
    case 'problematic':
      return { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'פער רקע' };
    case 'not_recommended':
      return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: 'רקע בעייתי' };
    default:
      return null;
  }
};

// Readiness config
const getReadinessConfig = (level: string | null | undefined) => {
  switch (level) {
    case 'VERY_READY':
      return { emoji: '🚀', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'מאוד מוכן/ת' };
    case 'READY':
      return { emoji: '✅', color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'מוכן/ת' };
    case 'SOMEWHAT_READY':
      return { emoji: '🌱', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'מתחיל/ה' };
    case 'UNCERTAIN':
      return { emoji: '🤔', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'לא בטוח/ה' };
    case 'NOT_READY':
      return { emoji: '⏸️', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', label: 'לא מוכן/ת' };
    default:
      return null;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MinimalCandidateCard: React.FC<MinimalCandidateCardProps> = React.memo(
  ({
    candidate,
    onClick,
    onEdit,
    onAnalyze,
    onSendProfileFeedback,
    isHighlighted = false,
    highlightTerm = '',
    className,
    aiScore,
    isAiTarget = false,
    onSetAiTarget,
    isSelectableForComparison = false,
    isSelectedForComparison = false,
    onToggleComparison,
    existingSuggestion = null,
    aiTargetName,
    dict,
  }) => {
    const mainImage = candidate.images.find((img) => img.isMain);
    const age = calculateAge(candidate.profile.birthDate);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);
    const [suggestionOverride, setSuggestionOverride] = useState(false);
    const [showAllFlags, setShowAllFlags] = useState(false);

    const hasExistingSuggestion = !!existingSuggestion;
    const isSuggestionBlocked = hasExistingSuggestion && !suggestionOverride;

    const effectiveAiScore = candidate.aiScore ?? aiScore;
    const hasAiData = typeof effectiveAiScore === 'number';
    const isVectorResult = typeof candidate.aiSimilarity === 'number';
    const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;

    const isMale = candidate.profile.gender === 'MALE';
    const genderAccent = isMale ? '#3B82F6' : '#EC4899';

    // ── Derived values ──────────────────────────────────────────────────────
    const priorityConfig = useMemo(
      () => getPriorityConfig(candidate.profile.priorityCategory),
      [candidate.profile.priorityCategory]
    );

    const readinessLevel = (candidate.profile as any).readinessLevel as string | null | undefined;
    const readinessConfig = useMemo(
      () => getReadinessConfig(readinessLevel),
      [readinessLevel]
    );

    const greenFlags = useMemo(
      () => (candidate.profile.greenFlags ?? []).filter(Boolean),
      [candidate.profile.greenFlags]
    );

    const redFlags = useMemo(
      () => (candidate.profile.redFlags ?? []).filter(Boolean),
      [candidate.profile.redFlags]
    );

    const hasFlags = greenFlags.length > 0 || redFlags.length > 0;
    const MAX_FLAGS_VISIBLE = 3;

    const qualityScore = useMemo(() => {
      let score = 0;
      if (candidate.images.length > 0) score += 25;
      if (candidate.profile.about) score += 25;
      if (candidate.profile.education) score += 25;
      if (candidate.profile.occupation) score += 25;
      return score;
    }, [
      candidate.images.length,
      candidate.profile.about,
      candidate.profile.education,
      candidate.profile.occupation,
    ]);

    const profileCompletenessScore = (candidate.profile as any).profileCompletenessScore as number | null | undefined;
    const profileCompleteness = useMemo(
      () => profileCompletenessScore ?? qualityScore,
      [profileCompletenessScore, qualityScore]
    );

    const spokenLanguages = useMemo(() => {
      const rawLangs = [
        candidate.profile.nativeLanguage,
        ...(candidate.profile.additionalLanguages || []),
      ].filter((l): l is string => !!l);

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

      const isHebrew = dict.heightLabel && /[\u0590-\u05FF]/.test(dict.heightLabel);
      return rawLangs
        .map((lang) => (isHebrew ? langMap[lang.toLowerCase()] || lang : lang.charAt(0).toUpperCase() + lang.slice(1)))
        .join(', ');
    }, [candidate.profile.nativeLanguage, candidate.profile.additionalLanguages, dict.heightLabel]);

    const getReligiousLabel = (value: string | null | undefined) => {
      if (!value) return null;
      const option = RELIGIOUS_LEVELS.find((opt) => opt.value === value);
      return option ? option.label : value;
    };

    const highlightText = (text: string | undefined | null): React.ReactNode => {
      if (!highlightTerm || !text) return text;
      const parts = text.split(new RegExp(`(${highlightTerm})`, 'gi'));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === highlightTerm.toLowerCase() ? (
              <mark key={i} className="bg-yellow-200 px-0.5 rounded-sm">{part}</mark>
            ) : (
              part
            )
          )}
        </>
      );
    };

    const availabilityConfig = useMemo(() => {
      switch (candidate.profile.availabilityStatus) {
        case 'AVAILABLE':
          return {
            label: dict.availability.AVAILABLE,
            className: 'bg-emerald-500 text-white',
            dot: 'bg-emerald-400',
            icon: <Sparkles className="w-3 h-3" />,
          };
        case 'DATING':
          return {
            label: dict.availability.DATING,
            className: 'bg-amber-500 text-white',
            dot: 'bg-amber-400',
            icon: <Heart className="w-3 h-3" />,
          };
        case 'UNAVAILABLE':
          return {
            label: dict.availability.UNAVAILABLE,
            className: 'bg-red-500 text-white',
            dot: 'bg-red-400',
            icon: <Clock className="w-3 h-3" />,
          };
        case 'PAUSED':
          return {
            label: dict.availability.PAUSED ?? 'מושהה',
            className: 'bg-gray-500 text-white',
            dot: 'bg-gray-400',
            icon: <Clock className="w-3 h-3" />,
          };
        default:
          return {
            label: dict.availability.UNKNOWN,
            className: 'bg-gray-400 text-white',
            dot: 'bg-gray-300',
            icon: <User className="w-3 h-3" />,
          };
      }
    }, [candidate.profile.availabilityStatus, dict]);

    const suggestionsReceived = (candidate.profile as any).suggestionsReceived ?? 0;
    const suggestionsAccepted = (candidate.profile as any).suggestionsAccepted ?? 0;
    const suggestionsDeclined = (candidate.profile as any).suggestionsDeclined ?? 0;
    const hasEngagementStats = suggestionsReceived > 0;

    const wantsToBeFirst = (candidate.profile as any).wantsToBeFirstParty;

    // ── Marital Status Label ─────────────────────────────────────────────────
    const maritalLabel = useMemo(() => {
      const ms = candidate.profile.maritalStatus as string | null;
      const hasKids = candidate.profile.hasChildrenFromPrevious;
      if (!ms) return null;
      if (ms !== 'single' && hasKids) return dict.maritalStatus.divorced_with_children;
      return dict.maritalStatus[ms as keyof typeof dict.maritalStatus] ?? ms;
    }, [candidate.profile.maritalStatus, candidate.profile.hasChildrenFromPrevious, dict.maritalStatus]);

    // ── Comparison Checkbox ──────────────────────────────────────────────────
    const ComparisonCheckbox = isSelectableForComparison && onToggleComparison && (
      <div
        className={cn(
          'absolute top-12 right-3 z-30 transition-all duration-200',
          isSelectedForComparison || hasExistingSuggestion
            ? 'opacity-100'
            : 'opacity-100 lg:opacity-0 group-hover:opacity-100'
        )}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (isSuggestionBlocked) return;
          onToggleComparison(candidate, e as unknown as React.MouseEvent);
        }}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
      >
        {isSuggestionBlocked ? (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl shadow-lg cursor-not-allowed">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-xs font-bold text-red-600 select-none whitespace-nowrap">
                {dict.existingSuggestion?.blocked ?? 'בתהליך פעיל'}
              </span>
            </div>
            <button
              className="text-[10px] text-gray-400 hover:text-gray-600 underline px-1 transition-colors"
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setSuggestionOverride(true); }}
            >
              {dict.existingSuggestion?.override ?? 'בחר בכל זאת'}
            </button>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-xl shadow-lg cursor-pointer transition-all duration-200 border',
              isSelectedForComparison
                ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400 scale-105'
                : hasExistingSuggestion && suggestionOverride
                  ? 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                  : 'bg-white/95 border-white/50 hover:bg-white hover:scale-105'
            )}
          >
            <Checkbox
              id={`compare-${candidate.id}`}
              checked={isSelectedForComparison}
              onCheckedChange={() => {}}
              className="border-2 border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 w-4 h-4"
            />
            <label htmlFor={`compare-${candidate.id}`} className="text-xs font-bold text-gray-700 cursor-pointer select-none">
              {dict.compare}
            </label>
          </div>
        )}
      </div>
    );

    // ── Main Render ──────────────────────────────────────────────────────────
    return (
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            // Base
            'relative overflow-hidden cursor-pointer transition-all duration-300 group',
            'border-l-4',
            // Priority border
            priorityConfig.borderColor,
            // Ring states
            isAiTarget
              ? 'ring-2 ring-emerald-400/60 shadow-emerald-100 shadow-xl'
              : isSuggestionBlocked
                ? 'ring-2 ring-red-400/60 shadow-red-100 shadow-xl'
                : isSelectedForComparison
                  ? 'ring-2 ring-blue-400/60 shadow-blue-100 shadow-xl'
                  : hasAiData
                    ? isVectorResult
                      ? 'ring-2 ring-blue-300/50 shadow-blue-50 shadow-lg'
                      : 'ring-2 ring-teal-300/50 shadow-teal-50 shadow-lg'
                    : isHighlighted
                      ? 'ring-2 ring-yellow-400/60 shadow-yellow-50 shadow-lg'
                      : 'shadow-md hover:shadow-xl',
            'bg-white',
            className ?? ''
          )}
          onClick={() => onClick(candidate)}
        >
          {/* ── PHOTO SECTION ─────────────────────────────────────────────── */}
          <div className="relative h-52 sm:h-60 overflow-hidden bg-gray-100">
            {mainImage && !imageError ? (
              <>
                {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
                <Image
                  src={getRelativeCloudinaryPath(mainImage.url)}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={false}
                  className={cn(
                    'object-cover transition-all duration-500',
                    imageLoaded ? 'opacity-100' : 'opacity-0',
                    isHovered ? 'scale-105' : 'scale-100'
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${genderAccent}15, ${genderAccent}08)` }}
              >
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: `${genderAccent}18` }}
                  >
                    <User className="w-8 h-8" style={{ color: `${genderAccent}80` }} />
                  </div>
                  <p className="text-sm text-gray-400">{dict.noImage}</p>
                </div>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

            {/* AI Score badge — top left */}
            {hasAiData && (
              <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                <Badge
                  className={cn(
                    'text-white border-0 shadow-xl px-3 py-1.5 text-sm font-bold flex items-center gap-1.5',
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
                    <span className="bg-white/25 px-1.5 py-0.5 rounded text-xs font-medium">
                      #{candidate.aiRank}
                    </span>
                  )}
                </Badge>

                {candidate.aiBackgroundCompatibility && (() => {
                  const badge = getBackgroundBadge(candidate.aiBackgroundCompatibility);
                  if (!badge) return null;
                  const IconComponent = badge.icon;
                  return (
                    <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs border shadow-sm', badge.color)}>
                      <IconComponent className="w-3 h-3" />
                      <span className="font-medium">{badge.label}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Status badge + badges — top right */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
              {/* Availability */}
              <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold', availabilityConfig.className)}>
                {availabilityConfig.icon}
                <span>{availabilityConfig.label}</span>
              </div>

              {/* Manual entry */}
              {isManualEntry && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-xs font-semibold shadow-md">
                  <Edit2 className="w-3 h-3" />
                  <span>{dict.manualEntry}</span>
                </div>
              )}

              {/* Testimonials */}
              {candidate.profile.testimonials &&
                candidate.profile.testimonials.filter((t) => t.status === 'APPROVED').length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-xs font-semibold shadow-md cursor-default">
                          <Star className="w-3 h-3 fill-current" />
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
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-semibold shadow-md">
                  <Star className="w-3 h-3 fill-current" />
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
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg',
                  existingSuggestion?.status === 'BLOCKED' || !existingSuggestion?.status
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-500 text-white'
                )}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    {existingSuggestion?.status === 'PENDING'
                      ? (dict.existingSuggestion?.pending ?? 'ממתין')
                      : (dict.existingSuggestion?.blocked ?? 'בתהליך')}
                  </span>
                </div>
              </div>
            )}

            {/* Name + age overlay */}
            <div className="absolute bottom-0 right-0 left-0 p-4 z-10">
              <div className="text-right">
                <h3 className="font-bold text-white text-xl leading-tight drop-shadow-lg tracking-wide">
                  {highlightText(`${candidate.firstName} ${candidate.lastName}`)}
                </h3>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-white/90 text-sm font-medium bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {age} {dict.yearsSuffix}
                  </span>
                  {candidate.profile.gender && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${genderAccent}CC`, color: 'white' }}
                    >
                      {isMale ? '♂' : '♀'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── INFO SECTION ──────────────────────────────────────────────── */}
          <div className="p-4 space-y-2 relative z-10">
            {isManualEntry && candidate.profile.manualEntryText ? (
              // Manual entry text
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                <p className="line-clamp-4 text-sm leading-relaxed text-purple-800">
                  {highlightText(candidate.profile.manualEntryText)}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* City + Origin */}
                {(candidate.profile.city || (candidate.profile as any).origin) && (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <span>
                      {candidate.profile.city && (
                        <span className="font-semibold text-gray-800">{highlightText(candidate.profile.city)}</span>
                      )}
                      {candidate.profile.city && (candidate.profile as any).origin && (
                        <span className="text-gray-300 mx-1.5">·</span>
                      )}
                      {(candidate.profile as any).origin && (
                        <span className="text-gray-500 text-xs">{highlightText((candidate.profile as any).origin)}</span>
                      )}
                    </span>
                    <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  </div>
                )}

                {/* Religious level + journey */}
                {(candidate.profile.religiousLevel || (candidate.profile as any).religiousJourney) && (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <span className="text-gray-700">
                      {getReligiousLabel(candidate.profile.religiousLevel) && (
                        <>{highlightText(getReligiousLabel(candidate.profile.religiousLevel))}</>
                      )}
                      {getReligiousLabel(candidate.profile.religiousLevel) && (candidate.profile as any).religiousJourney && (
                        <span className="text-gray-300 mx-1.5">·</span>
                      )}
                      {(candidate.profile as any).religiousJourney && (
                        <span className="text-gray-500 text-xs">{highlightText((candidate.profile as any).religiousJourney)}</span>
                      )}
                    </span>
                    <Scroll className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  </div>
                )}

                {/* Marital status */}
                {maritalLabel && (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <span className="text-gray-700">{highlightText(maritalLabel)}</span>
                    <Users className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  </div>
                )}

                {/* Occupation */}
                {candidate.profile.occupation && (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <span className="text-gray-700 truncate max-w-[190px]">{highlightText(candidate.profile.occupation)}</span>
                    <Briefcase className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  </div>
                )}

                {/* Education (if no occupation) */}
                {!candidate.profile.occupation && candidate.profile.education && (
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <span className="text-gray-700 truncate max-w-[190px]">{highlightText(candidate.profile.education)}</span>
                    <GraduationCap className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  </div>
                )}

                {/* Height + Languages — subtle chip row */}
                {(candidate.profile.height || spokenLanguages) && (
                  <div className="flex items-center justify-end gap-1.5 flex-wrap pt-0.5">
                    {candidate.profile.height && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        <Ruler className="w-3 h-3 text-gray-400" />
                        {dict.heightLabel.replace('{{height}}', candidate.profile.height.toString())}
                      </span>
                    )}
                    {spokenLanguages && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        <Languages className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[90px]">{spokenLanguages}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── FLAGS ──────────────────────────────────────────────────── */}
            {hasFlags && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex flex-wrap gap-1 justify-end">
                  {/* Green flags */}
                  {greenFlags
                    .slice(0, showAllFlags ? undefined : MAX_FLAGS_VISIBLE)
                    .map((flag, i) => (
                      <span
                        key={`g-${i}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
                      >
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        {flag}
                      </span>
                    ))}

                  {/* Red flags */}
                  {redFlags
                    .slice(0, showAllFlags ? undefined : Math.max(0, MAX_FLAGS_VISIBLE - greenFlags.length))
                    .map((flag, i) => (
                      <span
                        key={`r-${i}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
                      >
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        {flag}
                      </span>
                    ))}

                  {/* Show more / less */}
                  {(greenFlags.length + redFlags.length) > MAX_FLAGS_VISIBLE && (
                    <button
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-100"
                      onClick={(e) => { e.stopPropagation(); setShowAllFlags(!showAllFlags); }}
                    >
                      {showAllFlags ? '−' : `+${greenFlags.length + redFlags.length - MAX_FLAGS_VISIBLE}`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── BOTTOM STATS & BADGES ──────────────────────────────────── */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
              {/* Left: Readiness + wantsFirst */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {readinessConfig && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', readinessConfig.bg, readinessConfig.color)}>
                    {readinessConfig.emoji} {readinessConfig.label}
                  </span>
                )}
                {wantsToBeFirst && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                          <ArrowRightCircle className="w-3 h-3" />
                          <span>צד ראשון</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p>{dict.wantsToBeFirst ?? 'מעוניין/ת להיות צד ראשון'}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Right: Engagement stats */}
              {hasEngagementStats && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3" />
                          {suggestionsReceived}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p>{dict.stats?.received ?? 'הצעות שהתקבלו'}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {suggestionsAccepted > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-0.5 text-emerald-500">
                            <CheckCircle className="w-3 h-3" />
                            {suggestionsAccepted}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>{dict.stats?.accepted ?? 'אושרו'}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {suggestionsDeclined > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="flex items-center gap-0.5 text-red-400">
                            <XSquare className="w-3 h-3" />
                            {suggestionsDeclined}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>{dict.stats?.declined ?? 'נדחו'}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}

              {/* Profile completeness dot */}
              {!hasEngagementStats && profileCompleteness < 100 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              profileCompleteness === 100 ? 'bg-emerald-500' :
                              profileCompleteness >= 75 ? 'bg-blue-500' :
                              profileCompleteness >= 50 ? 'bg-amber-500' : 'bg-red-400'
                            )}
                            style={{ width: `${profileCompleteness}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{profileCompleteness}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{profileCompleteness === 100
                        ? (dict.profileComplete ?? 'פרופיל מלא')
                        : (dict.profileIncomplete ?? `פרופיל: ${profileCompleteness}%`)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Last active (when no AI data) */}
            {candidate.profile.lastActive && !hasAiData && (
              <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                <span>{dict.lastActivePrefix} {format(new Date(candidate.profile.lastActive), 'dd/MM/yy')}</span>
                <Clock className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* ── FLOATING ACTION BUTTONS ────────────────────────────────────── */}
          <div
            className={cn(
              'absolute bottom-3 left-3 z-20 flex items-center gap-1.5 transition-all duration-200',
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
                        'h-8 px-2.5 border-0 shadow-xl hover:scale-105 transition-all duration-200 text-white text-xs font-medium gap-1.5',
                        isVectorResult
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-purple-500 hover:bg-purple-600'
                      )}
                      onClick={(e) => { e.stopPropagation(); setShowReasoning(true); }}
                    >
                      {isVectorResult ? <Zap className="h-3.5 w-3.5" /> : <Brain className="h-3.5 w-3.5" />}
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
                      className="h-8 w-8 bg-white/95 shadow-xl border-0 hover:bg-white hover:scale-110 transition-all duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={`mailto:${candidate.email}`}>
                        <Mail className="h-3.5 w-3.5 text-gray-600" />
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
                        className="h-8 w-8 bg-white/95 shadow-xl border-0 hover:bg-white hover:scale-110 transition-all duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5 text-gray-600" />
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
                        'h-8 w-8 shadow-xl border-0 hover:scale-110 transition-all duration-200',
                        isAiTarget
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                          : 'bg-white/95 hover:bg-white text-gray-600'
                      )}
                      onClick={(e) => { e.stopPropagation(); onSetAiTarget(candidate, e); }}
                    >
                      <Star className={cn('h-3.5 w-3.5 transition-all duration-200', isAiTarget ? 'fill-current' : '')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isAiTarget ? dict.tooltips.clearAiTarget : dict.tooltips.setAsAiTarget}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* ── QUALITY SCORE (hover) ─────────────────────────────────────── */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            {!hasAiData && (
              <div className="flex items-center gap-1 bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm text-xs font-bold whitespace-nowrap">
                <Eye className="w-3 h-3" />
                <span>{dict.qualityScore.replace('{{score}}', qualityScore.toString())}</span>
              </div>
            )}
          </div>

          {/* ── COMPARISON CHECKBOX ───────────────────────────────────────── */}
          {ComparisonCheckbox}

          {/* ── AI REASONING DIALOG ───────────────────────────────────────── */}
          <Dialog open={showReasoning} onOpenChange={setShowReasoning}>
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
                onClick={(e) => { e.stopPropagation(); setShowReasoning(false); }}
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
                      {[
                        { key: 'religious', label: 'דתי', max: 35 },
                        { key: 'careerFamily', label: 'קריירה-משפחה', max: 15 },
                        { key: 'lifestyle', label: 'סגנון חיים', max: 15 },
                        { key: 'ambition', label: 'שאפתנות', max: 12 },
                        { key: 'communication', label: 'תקשורת', max: 12 },
                        { key: 'values', label: 'ערכים', max: 11 },
                      ].map(({ key, label, max }) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-purple-600 font-semibold">
                            {candidate.aiScoreBreakdown![key as keyof ScoreBreakdown]}/{max}
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
        </Card>
      </motion.div>
    );
  }
);

MinimalCandidateCard.displayName = 'MinimalCandidateCard';

export default MinimalCandidateCard;
