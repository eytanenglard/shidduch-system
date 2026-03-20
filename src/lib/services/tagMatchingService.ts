// src/lib/services/tagMatchingService.ts
// Tag-based compatibility scoring for Soul Fingerprint

import prisma from '@/lib/prisma';
import type { PartnerTagPreferences } from '@/components/soul-fingerprint/types';

interface TagCompatibilityResult {
  score: number; // 0-50
  matchedTags: string[];
  details: Record<string, { score: number; maxScore: number; matchedTags: string[] }>;
}

// Category weights for tag scoring
const CATEGORY_WEIGHTS: Record<string, { maxScore: number; hardFilter: boolean }> = {
  sector: { maxScore: 15, hardFilter: true },
  personality: { maxScore: 10, hardFilter: false },
  lifestyle: { maxScore: 8, hardFilter: false },
  family: { maxScore: 7, hardFilter: false },
  relationship: { maxScore: 5, hardFilter: false },
  career: { maxScore: 3, hardFilter: false },
  background: { maxScore: 2, hardFilter: false },
};

/**
 * Calculate tag overlap score between a seeker's preferences and a candidate's tags
 */
function calculateCategoryOverlap(
  seekerPrefs: string[],
  candidateTags: string[],
  maxScore: number
): { score: number; matchedTags: string[] } {
  if (seekerPrefs.length === 0 || candidateTags.length === 0) {
    return { score: 0, matchedTags: [] };
  }

  const matchedTags = seekerPrefs.filter((pref) => candidateTags.includes(pref));
  const overlapRatio = matchedTags.length / seekerPrefs.length;

  return {
    score: Math.round(overlapRatio * maxScore),
    matchedTags,
  };
}

/**
 * Main tag compatibility calculation
 * Compares seeker's partner preferences against candidate's self tags
 */
export function calculateTagCompatibility(
  seekerPartnerTags: PartnerTagPreferences | null,
  candidateSelfTags: {
    sectorTags: string[];
    backgroundTags: string[];
    personalityTags: string[];
    careerTags: string[];
    lifestyleTags: string[];
    familyVisionTags: string[];
    relationshipTags: string[];
    aiDerivedTags?: string[];
  } | null
): TagCompatibilityResult {
  const result: TagCompatibilityResult = {
    score: 0,
    matchedTags: [],
    details: {},
  };

  if (!seekerPartnerTags || !candidateSelfTags) {
    return result;
  }

  const doesntMatter = new Set(seekerPartnerTags.doesntMatterCategories);

  // Map categories to their tag arrays
  const categoryMap: Record<
    string,
    { seekerPrefs: string[]; candidateTags: string[] }
  > = {
    sector: {
      seekerPrefs: seekerPartnerTags.sectorTags,
      candidateTags: candidateSelfTags.sectorTags,
    },
    personality: {
      seekerPrefs: seekerPartnerTags.personalityTags,
      candidateTags: [
        ...candidateSelfTags.personalityTags,
        ...(candidateSelfTags.aiDerivedTags || []),
      ],
    },
    lifestyle: {
      seekerPrefs: seekerPartnerTags.lifestyleTags,
      candidateTags: candidateSelfTags.lifestyleTags,
    },
    family: {
      seekerPrefs: seekerPartnerTags.familyVisionTags,
      candidateTags: candidateSelfTags.familyVisionTags,
    },
    relationship: {
      seekerPrefs: seekerPartnerTags.relationshipTags,
      candidateTags: candidateSelfTags.relationshipTags,
    },
    career: {
      seekerPrefs: seekerPartnerTags.careerTags,
      candidateTags: candidateSelfTags.careerTags,
    },
    background: {
      seekerPrefs: seekerPartnerTags.backgroundTags,
      candidateTags: candidateSelfTags.backgroundTags,
    },
  };

  let totalScore = 0;
  const allMatchedTags: string[] = [];

  for (const [category, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    // Skip categories the seeker marked as "doesn't matter"
    if (doesntMatter.has(category)) {
      result.details[category] = {
        score: 0,
        maxScore: weight.maxScore,
        matchedTags: [],
      };
      continue;
    }

    const { seekerPrefs, candidateTags } = categoryMap[category] || {
      seekerPrefs: [],
      candidateTags: [],
    };

    const overlap = calculateCategoryOverlap(
      seekerPrefs,
      candidateTags,
      weight.maxScore
    );

    result.details[category] = {
      score: overlap.score,
      maxScore: weight.maxScore,
      matchedTags: overlap.matchedTags,
    };

    totalScore += overlap.score;
    allMatchedTags.push(...overlap.matchedTags);
  }

  result.score = totalScore;
  result.matchedTags = allMatchedTags;

  return result;
}

/**
 * Check if a candidate passes the hard tag filter (sector match)
 * Used as Tier 1.5 in scanning
 */
export function passesTagHardFilter(
  seekerPartnerTags: PartnerTagPreferences | null,
  candidateSectorTags: string[]
): boolean {
  if (!seekerPartnerTags) return true; // No tags = no filter
  if (seekerPartnerTags.doesntMatterCategories.includes('sector')) return true;
  if (seekerPartnerTags.sectorTags.length === 0) return true;

  // Check if there's any overlap between seeker's preferred sectors and candidate's sectors
  return seekerPartnerTags.sectorTags.some((s) => candidateSectorTags.includes(s));
}

/**
 * Load profile tags for a user from the database
 */
export async function loadProfileTags(profileId: string) {
  return prisma.profileTags.findUnique({
    where: { profileId },
    select: {
      sectorTags: true,
      backgroundTags: true,
      personalityTags: true,
      careerTags: true,
      lifestyleTags: true,
      familyVisionTags: true,
      relationshipTags: true,
      diasporaTags: true,
      partnerTags: true,
      aiDerivedTags: true,
    },
  });
}

/**
 * Batch load profile tags for multiple profiles
 */
export async function batchLoadProfileTags(profileIds: string[]) {
  const tags = await prisma.profileTags.findMany({
    where: { profileId: { in: profileIds } },
    select: {
      profileId: true,
      sectorTags: true,
      backgroundTags: true,
      personalityTags: true,
      careerTags: true,
      lifestyleTags: true,
      familyVisionTags: true,
      relationshipTags: true,
      aiDerivedTags: true,
      partnerTags: true,
    },
  });

  const map = new Map<string, (typeof tags)[number]>();
  for (const t of tags) {
    map.set(t.profileId, t);
  }
  return map;
}
