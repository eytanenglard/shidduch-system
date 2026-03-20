// MinimalCard.hooks.ts — useMinimalCard hook

import { useState, useMemo } from 'react';
import { UserSource } from '@prisma/client';
import type { MinimalCandidateCardProps, AvailabilityConfig } from './MinimalCard.types';
import { getPriorityConfig, getReadinessConfig } from './MinimalCard.constants';
import { calculateAge, formatLanguages } from './MinimalCard.utils';
import {
  Sparkles,
  Heart,
  Clock,
  User,
} from 'lucide-react';
import React from 'react';

export function useMinimalCard(props: MinimalCandidateCardProps) {
  const { candidate, aiScore, existingSuggestion, dict } = props;

  // ── Local state ───────────────────────────────────────────────────────────
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [suggestionOverride, setSuggestionOverride] = useState(false);
  const [showAllFlags, setShowAllFlags] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────
  const mainImage = candidate.images.find((img) => img.isMain);
  const age = calculateAge(candidate.profile.birthDate);

  const hasExistingSuggestion = !!existingSuggestion;
  const isSuggestionBlocked = hasExistingSuggestion && !suggestionOverride;

  const effectiveAiScore = candidate.aiScore ?? aiScore;
  const hasAiData = typeof effectiveAiScore === 'number';
  const isVectorResult = typeof candidate.aiSimilarity === 'number';
  const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;

  const isMale = candidate.profile.gender === 'MALE';
  const genderAccent = isMale ? '#3B82F6' : '#EC4899';

  // ── Memoized configs ──────────────────────────────────────────────────────
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

  const isHebrew = !!(dict.heightLabel && /[\u0590-\u05FF]/.test(dict.heightLabel));

  const spokenLanguages = useMemo(
    () => formatLanguages(
      candidate.profile.nativeLanguage,
      candidate.profile.additionalLanguages,
      isHebrew
    ),
    [candidate.profile.nativeLanguage, candidate.profile.additionalLanguages, isHebrew]
  );

  const availabilityConfig: AvailabilityConfig = useMemo(() => {
    switch (candidate.profile.availabilityStatus) {
      case 'AVAILABLE':
        return {
          label: dict.availability.AVAILABLE,
          className: 'bg-emerald-500 text-white',
          dot: 'bg-emerald-400',
          icon: React.createElement(Sparkles, { className: 'w-3 h-3' }),
        };
      case 'DATING':
        return {
          label: dict.availability.DATING,
          className: 'bg-amber-500 text-white',
          dot: 'bg-amber-400',
          icon: React.createElement(Heart, { className: 'w-3 h-3' }),
        };
      case 'UNAVAILABLE':
        return {
          label: dict.availability.UNAVAILABLE,
          className: 'bg-red-500 text-white',
          dot: 'bg-red-400',
          icon: React.createElement(Clock, { className: 'w-3 h-3' }),
        };
      case 'PAUSED':
        return {
          label: dict.availability.PAUSED ?? 'מושהה',
          className: 'bg-gray-500 text-white',
          dot: 'bg-gray-400',
          icon: React.createElement(Clock, { className: 'w-3 h-3' }),
        };
      default:
        return {
          label: dict.availability.UNKNOWN,
          className: 'bg-gray-400 text-white',
          dot: 'bg-gray-300',
          icon: React.createElement(User, { className: 'w-3 h-3' }),
        };
    }
  }, [candidate.profile.availabilityStatus, dict]);

  const suggestionsReceived = (candidate.profile as any).suggestionsReceived ?? 0;
  const suggestionsAccepted = (candidate.profile as any).suggestionsAccepted ?? 0;
  const suggestionsDeclined = (candidate.profile as any).suggestionsDeclined ?? 0;
  const hasEngagementStats = suggestionsReceived > 0;

  const wantsToBeFirst = (candidate.profile as any).wantsToBeFirstParty;

  const maritalLabel = useMemo(() => {
    const ms = candidate.profile.maritalStatus as string | null;
    const hasKids = candidate.profile.hasChildrenFromPrevious;
    if (!ms) return null;
    if (ms !== 'single' && hasKids) return dict.maritalStatus.divorced_with_children;
    return dict.maritalStatus[ms as keyof typeof dict.maritalStatus] ?? ms;
  }, [candidate.profile.maritalStatus, candidate.profile.hasChildrenFromPrevious, dict.maritalStatus]);

  return {
    // State
    imageLoaded, setImageLoaded,
    imageError, setImageError,
    isHovered, setIsHovered,
    showReasoning, setShowReasoning,
    suggestionOverride, setSuggestionOverride,
    showAllFlags, setShowAllFlags,

    // Derived
    mainImage,
    age,
    hasExistingSuggestion,
    isSuggestionBlocked,
    effectiveAiScore,
    hasAiData,
    isVectorResult,
    isManualEntry,
    isMale,
    genderAccent,
    priorityConfig,
    readinessConfig,
    greenFlags,
    redFlags,
    hasFlags,
    qualityScore,
    profileCompleteness,
    spokenLanguages,
    availabilityConfig,
    suggestionsReceived,
    suggestionsAccepted,
    suggestionsDeclined,
    hasEngagementStats,
    wantsToBeFirst,
    maritalLabel,
  };
}
