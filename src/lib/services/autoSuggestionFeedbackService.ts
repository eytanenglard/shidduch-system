// src/lib/services/autoSuggestionFeedbackService.ts
// =============================================================================
// NeshamaTech - Unified Suggestion Feedback Service
// Manages feedback collection, preference learning, and re-ranking
// for ALL suggestion types (auto + regular + AI chat insights)
// =============================================================================

import prisma from '@/lib/prisma';
import type { AutoSuggestionDecision, RejectionCategory } from '@prisma/client';

// =============================================================================
// CONSTANTS - Trait Vocabulary
// =============================================================================

export const LIKED_TRAITS = [
  'religious_match',
  'personality_match',
  'age_appropriate',
  'shared_values',
  'similar_background',
  'attractive_profile',
  'good_career',
  'interesting_person',
] as const;

export const MISSING_TRAITS = [
  'age_gap',
  'religious_gap',
  'geographic_gap',
  'not_attracted',
  'no_connection',
  'background_gap',
  'education_gap',
  'gut_feeling',
] as const;

export type LikedTrait = typeof LIKED_TRAITS[number];
export type MissingTrait = typeof MISSING_TRAITS[number];

// =============================================================================
// TYPES
// =============================================================================

export interface SaveFeedbackInput {
  suggestionId: string;
  userId: string;
  targetUserId: string;
  decision: AutoSuggestionDecision;
  likedTraits: string[];
  likedFreeText?: string;
  missingTraits?: string[];
  rejectionCategory?: RejectionCategory;
  missingFreeText?: string;
}

interface TraitScores {
  [trait: string]: number;
}

interface MatchForReranking {
  id: string;
  aiScore: number;
  maleUserId: string;
  femaleUserId: string;
  shortReasoning: string | null;
  detailedReasoning: string | null;
}

// =============================================================================
// SERVICE
// =============================================================================

export class AutoSuggestionFeedbackService {

  // ========== Save Feedback ==========

  static async saveFeedback(input: SaveFeedbackInput) {
    const feedback = await prisma.autoSuggestionFeedback.upsert({
      where: {
        suggestionId_userId: {
          suggestionId: input.suggestionId,
          userId: input.userId,
        },
      },
      create: {
        suggestionId: input.suggestionId,
        userId: input.userId,
        targetUserId: input.targetUserId,
        decision: input.decision,
        likedTraits: input.likedTraits.length > 0 ? input.likedTraits : undefined,
        likedFreeText: input.likedFreeText || undefined,
        missingTraits: input.missingTraits && input.missingTraits.length > 0 ? input.missingTraits : undefined,
        rejectionCategory: input.rejectionCategory || undefined,
        missingFreeText: input.missingFreeText || undefined,
      },
      update: {
        decision: input.decision,
        likedTraits: input.likedTraits.length > 0 ? input.likedTraits : undefined,
        likedFreeText: input.likedFreeText || undefined,
        missingTraits: input.missingTraits && input.missingTraits.length > 0 ? input.missingTraits : undefined,
        rejectionCategory: input.rejectionCategory || undefined,
        missingFreeText: input.missingFreeText || undefined,
      },
    });

    // Trigger preference recalculation async (non-blocking)
    void this.recalculatePreferences(input.userId).catch((err) => {
      console.error(`[AutoFeedback] Failed to recalculate preferences for ${input.userId}:`, err);
    });

    return feedback;
  }

  // ========== Recalculate User Preferences (Unified Pipeline) ==========

  static async recalculatePreferences(userId: string) {
    // Get feedback from ALL suggestions (auto + regular)
    const feedbacks = await prisma.autoSuggestionFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 feedbacks
    });

    if (feedbacks.length === 0) return;

    const now = Date.now();
    const likedScores: TraitScores = {};
    const avoidScores: TraitScores = {};

    for (const fb of feedbacks) {
      const daysSince = (now - fb.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const weight = 1 / (1 + daysSince / 30); // Recency weighting

      // Aggregate liked traits
      const liked = (fb.likedTraits as string[] | null) || [];
      for (const trait of liked) {
        likedScores[trait] = (likedScores[trait] || 0) + weight;
      }

      // Aggregate missing traits (only from declines)
      if (fb.decision === 'DECLINED') {
        const missing = (fb.missingTraits as string[] | null) || [];
        for (const trait of missing) {
          avoidScores[trait] = (avoidScores[trait] || 0) + weight;
        }
      }
    }

    // Also incorporate chat-derived trait preferences (if available)
    const chatPrefs = await prisma.userMatchingPreferences.findUnique({
      where: { userId },
      select: { chatDerivedInsights: true },
    });

    // Normalize scores to 0-1 range
    const normalizeFn = (scores: TraitScores): TraitScores => {
      const maxVal = Math.max(...Object.values(scores), 1);
      const normalized: TraitScores = {};
      for (const [key, val] of Object.entries(scores)) {
        normalized[key] = Math.round((val / maxVal) * 100) / 100;
      }
      return normalized;
    };

    const normalizedLiked = normalizeFn(likedScores);
    const normalizedAvoid = normalizeFn(avoidScores);

    // Generate preference summary text (includes chat insights)
    const summary = this.generatePreferenceSummary(
      normalizedLiked,
      normalizedAvoid,
      feedbacks.length,
      chatPrefs?.chatDerivedInsights || undefined,
    );

    await prisma.userMatchingPreferences.upsert({
      where: { userId },
      create: {
        userId,
        likedTraitScores: normalizedLiked,
        avoidTraitScores: normalizedAvoid,
        preferenceSummary: summary,
        totalFeedbacks: feedbacks.length,
      },
      update: {
        likedTraitScores: normalizedLiked,
        avoidTraitScores: normalizedAvoid,
        preferenceSummary: summary,
        totalFeedbacks: feedbacks.length,
      },
    });

    console.log(`[Feedback] Recalculated preferences for ${userId}: ${feedbacks.length} feedbacks (all types), liked=${Object.keys(normalizedLiked).length} traits, avoid=${Object.keys(normalizedAvoid).length} traits`);
  }

  // ========== Generate Preference Summary ==========

  private static generatePreferenceSummary(
    liked: TraitScores,
    avoid: TraitScores,
    totalFeedbacks: number,
    chatInsights?: string,
  ): string {
    const traitLabels: Record<string, string> = {
      religious_match: 'התאמה דתית',
      personality_match: 'התאמה באישיות',
      age_appropriate: 'גיל מתאים',
      shared_values: 'ערכים משותפים',
      similar_background: 'רקע דומה',
      attractive_profile: 'פרופיל מושך',
      good_career: 'קריירה/השכלה',
      interesting_person: 'בנאדם מעניין',
      age_gap: 'פער גילאים',
      religious_gap: 'פער דתי',
      geographic_gap: 'מרחק גאוגרפי',
      not_attracted: 'חוסר חיבור חיצוני',
      no_connection: 'חוסר חיבור כללי',
      background_gap: 'פער ברקע',
      education_gap: 'פער השכלתי',
      gut_feeling: 'תחושת בטן',
    };

    const topLiked = Object.entries(liked)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => traitLabels[trait] || trait);

    const topAvoid = Object.entries(avoid)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => traitLabels[trait] || trait);

    const parts: string[] = [];
    parts.push(`מבוסס על ${totalFeedbacks} תגובות על הצעות:`);

    if (topLiked.length > 0) {
      parts.push(`המשתמש/ת מעריך/ה במיוחד: ${topLiked.join(', ')}.`);
    }
    if (topAvoid.length > 0) {
      parts.push(`סיבות דחייה חוזרות: ${topAvoid.join(', ')}.`);
    }

    if (chatInsights) {
      parts.push(`תובנות משיחות AI: ${chatInsights}`);
    }

    return parts.join(' ');
  }

  // ========== Get Preference Summary for AI Prompt ==========

  static async getPreferenceSummaryForPrompt(userId: string): Promise<string | null> {
    const prefs = await prisma.userMatchingPreferences.findUnique({
      where: { userId },
    });

    if (!prefs || prefs.totalFeedbacks < 2) return null;

    return prefs.preferenceSummary || null;
  }

  // ========== Get Feedback History ==========

  static async getFeedbackHistory(userId: string, limit = 20) {
    return prisma.autoSuggestionFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        suggestion: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            matchingReason: true,
            firstPartyId: true,
            secondPartyId: true,
            firstParty: {
              select: { firstName: true, lastName: true },
            },
            secondParty: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  // ========== Apply Feedback Re-ranking ==========

  static async applyFeedbackReranking(
    matches: MatchForReranking[],
    userId: string,
  ): Promise<MatchForReranking[]> {
    const prefs = await prisma.userMatchingPreferences.findUnique({
      where: { userId },
    });

    if (!prefs || prefs.totalFeedbacks < 2) return matches;

    const avoidScores = prefs.avoidTraitScores as TraitScores;
    const likedScores = prefs.likedTraitScores as TraitScores;

    // Load user profile for trait comparison
    const userProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });
    if (!userProfile) return matches;

    const isMale = userProfile.gender === 'MALE';

    // Load other party profiles for trait comparison
    const otherPartyIds = matches.map((m) =>
      isMale ? m.femaleUserId : m.maleUserId
    );

    const otherProfiles = await prisma.profile.findMany({
      where: { userId: { in: otherPartyIds } },
      select: {
        userId: true,
        religiousLevel: true,
        city: true,
        educationLevel: true,
        birthDate: true,
      },
    });

    const profileMap = new Map(otherProfiles.map((p) => [p.userId, p]));

    // Load requesting user's profile for comparison
    const requestingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        religiousLevel: true,
        city: true,
        birthDate: true,
        educationLevel: true,
      },
    });

    // Re-rank: adjust aiScore based on feedback preferences + actual profile data
    const rerankd = matches.map((match) => {
      const otherUserId = isMale ? match.femaleUserId : match.maleUserId;
      const otherProfile = profileMap.get(otherUserId);
      let adjustment = 0;

      // === Penalty for traits user repeatedly rejected (cross-referenced with actual data) ===

      // Religious gap: stronger penalty if actual religious levels differ
      if (avoidScores['religious_gap'] > 0.3 && otherProfile && requestingProfile) {
        const sameReligion = otherProfile.religiousLevel === requestingProfile.religiousLevel;
        const basePenalty = avoidScores['religious_gap'] * 3;
        adjustment -= sameReligion ? basePenalty * 0.3 : basePenalty; // Reduced penalty if same level
      }

      // Geographic gap: stronger penalty if cities are different
      if (avoidScores['geographic_gap'] > 0.3 && otherProfile && requestingProfile) {
        const sameCity = otherProfile.city && requestingProfile.city &&
          otherProfile.city.toLowerCase() === requestingProfile.city.toLowerCase();
        const basePenalty = avoidScores['geographic_gap'] * 2;
        adjustment -= sameCity ? 0 : basePenalty; // No penalty if same city
      }

      // Age gap: stronger penalty based on actual age difference
      if (avoidScores['age_gap'] > 0.3 && otherProfile && requestingProfile) {
        const userAge = requestingProfile.birthDate
          ? Math.floor((Date.now() - requestingProfile.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;
        const otherAge = otherProfile.birthDate
          ? Math.floor((Date.now() - otherProfile.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        if (userAge && otherAge) {
          const ageDiff = Math.abs(userAge - otherAge);
          const basePenalty = avoidScores['age_gap'] * 3;
          // Scale penalty: 0-2 years=no penalty, 3-5=half, 6+=full
          if (ageDiff <= 2) adjustment -= 0;
          else if (ageDiff <= 5) adjustment -= basePenalty * 0.5;
          else adjustment -= basePenalty;
        }
      }

      // Education gap: penalty if education levels differ and user cares
      if (avoidScores['education_gap'] > 0.3 && otherProfile && requestingProfile) {
        const sameEducation = otherProfile.educationLevel === requestingProfile.educationLevel;
        const basePenalty = avoidScores['education_gap'] * 2;
        adjustment -= sameEducation ? 0 : basePenalty * 0.7;
      }

      // Generic avoid traits without profile cross-reference
      if (avoidScores['not_attracted'] > 0.5) {
        adjustment -= avoidScores['not_attracted'] * 1.5;
      }
      if (avoidScores['no_connection'] > 0.5) {
        adjustment -= avoidScores['no_connection'] * 1;
      }

      // === Boost for traits user consistently liked ===
      if (likedScores['religious_match'] > 0.3) {
        // Stronger boost if actual religious levels match
        const sameReligion = otherProfile?.religiousLevel === requestingProfile?.religiousLevel;
        adjustment += likedScores['religious_match'] * (sameReligion ? 3 : 1.5);
      }
      if (likedScores['personality_match'] > 0.3) {
        adjustment += likedScores['personality_match'] * 2;
      }
      if (likedScores['shared_values'] > 0.3) {
        adjustment += likedScores['shared_values'] * 1.5;
      }
      if (likedScores['age_appropriate'] > 0.3) {
        adjustment += likedScores['age_appropriate'] * 1.5;
      }
      if (likedScores['similar_background'] > 0.3) {
        const sameCity = otherProfile?.city && requestingProfile?.city &&
          otherProfile.city.toLowerCase() === requestingProfile.city.toLowerCase();
        adjustment += likedScores['similar_background'] * (sameCity ? 2.5 : 1);
      }
      if (likedScores['good_career'] > 0.3) {
        adjustment += likedScores['good_career'] * 1;
      }
      if (likedScores['interesting_person'] > 0.3) {
        adjustment += likedScores['interesting_person'] * 1;
      }

      return {
        ...match,
        aiScore: match.aiScore + adjustment,
      };
    });

    // Re-sort by adjusted score
    return rerankd.sort((a, b) => b.aiScore - a.aiScore);
  }
}
