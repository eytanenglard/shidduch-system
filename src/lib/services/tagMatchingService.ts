// src/lib/services/tagMatchingService.ts
// Tag-based compatibility scoring for Soul Fingerprint
// V3: Sector-adaptive weights, slider distance, expanded hard filters, "doesn't matter" = 90%

import prisma from '@/lib/prisma';
import type { PartnerTagPreferences, SectorGroup } from '@/components/soul-fingerprint/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TagCategoryDetail {
  score: number;
  maxScore: number;
  matchedTags: string[];
  note?: string; // e.g. "doesnt_matter", "no_data", "slider_distance"
}

export interface TagCompatibilityResult {
  score: number; // 0-50
  maxPossibleScore: number; // total max for the weight profile used
  matchedTags: string[];
  details: Record<string, TagCategoryDetail>;
  sectorGroupUsed: string;
  sliderDistances?: Record<string, { seekerValue: number; candidateValue: number; distance: number; score: number }>;
}

export interface ExpandedHardFilterResult {
  passes: boolean;
  failedFilters: string[];
}

export interface CandidateSelfTags {
  sectorTags: string[];
  backgroundTags: string[];
  personalityTags: string[];
  careerTags: string[];
  lifestyleTags: string[];
  familyVisionTags: string[];
  relationshipTags: string[];
  aiDerivedTags?: string[];
}

// ─── Sector-Specific Weight Profiles ─────────────────────────────────────────

type CategoryWeightProfile = Record<string, { maxScore: number; hardFilter: boolean }>;

const SECTOR_WEIGHTS: Record<string, CategoryWeightProfile> = {
  charedi: {
    sector: { maxScore: 20, hardFilter: true },
    family: { maxScore: 12, hardFilter: false },
    personality: { maxScore: 6, hardFilter: false },
    lifestyle: { maxScore: 4, hardFilter: false },
    relationship: { maxScore: 4, hardFilter: false },
    career: { maxScore: 2, hardFilter: false },
    background: { maxScore: 2, hardFilter: false },
  },
  dati_leumi: {
    sector: { maxScore: 14, hardFilter: true },
    personality: { maxScore: 10, hardFilter: false },
    lifestyle: { maxScore: 8, hardFilter: false },
    family: { maxScore: 8, hardFilter: false },
    relationship: { maxScore: 5, hardFilter: false },
    career: { maxScore: 3, hardFilter: false },
    background: { maxScore: 2, hardFilter: false },
  },
  masorti: {
    sector: { maxScore: 10, hardFilter: true },
    personality: { maxScore: 12, hardFilter: false },
    lifestyle: { maxScore: 10, hardFilter: false },
    family: { maxScore: 7, hardFilter: false },
    relationship: { maxScore: 5, hardFilter: false },
    career: { maxScore: 3, hardFilter: false },
    background: { maxScore: 3, hardFilter: false },
  },
  hiloni: {
    sector: { maxScore: 5, hardFilter: false },
    personality: { maxScore: 14, hardFilter: false },
    lifestyle: { maxScore: 12, hardFilter: false },
    career: { maxScore: 6, hardFilter: false },
    family: { maxScore: 5, hardFilter: false },
    relationship: { maxScore: 5, hardFilter: false },
    background: { maxScore: 3, hardFilter: false },
  },
};

// Default weights for sector groups not listed above (chozer_bteshuva, diaspora, in_process)
const DEFAULT_WEIGHTS: CategoryWeightProfile = {
  sector: { maxScore: 15, hardFilter: true },
  personality: { maxScore: 10, hardFilter: false },
  lifestyle: { maxScore: 8, hardFilter: false },
  family: { maxScore: 7, hardFilter: false },
  relationship: { maxScore: 5, hardFilter: false },
  career: { maxScore: 3, hardFilter: false },
  background: { maxScore: 2, hardFilter: false },
};

/**
 * Get weight profile for a sector group
 */
function getWeightsForSector(sectorGroup?: string): CategoryWeightProfile {
  if (!sectorGroup) return DEFAULT_WEIGHTS;
  return SECTOR_WEIGHTS[sectorGroup] || DEFAULT_WEIGHTS;
}

// ─── Slider Distance Scoring ─────────────────────────────────────────────────

/**
 * Calculate compatibility score for slider-based questions (e.g. introvert/extrovert scale)
 * Returns 0.0-1.0 where 1.0 is perfect match
 */
function calculateSliderDistance(
  seekerValue: number,   // 0-100 (what seeker prefers in a partner)
  candidateValue: number, // 0-100 (candidate's self-reported value)
  tolerance: number = 25  // how far apart is still considered good
): number {
  const distance = Math.abs(seekerValue - candidateValue);
  if (distance <= tolerance) return 1.0;
  if (distance <= tolerance * 2) return 0.5;
  if (distance <= tolerance * 3) return 0.2;
  return 0.05;
}

// ─── Category Overlap Scoring ────────────────────────────────────────────────

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

// ─── Main Tag Compatibility Function ─────────────────────────────────────────

/**
 * Main tag compatibility calculation (V3)
 * Compares seeker's partner preferences against candidate's self tags
 *
 * Key improvements:
 * - Sector-specific weight profiles
 * - "Doesn't matter" = 90% of max category score (not 0)
 * - Slider distance scoring for energy_type
 * - Detailed breakdown with notes
 */
export function calculateTagCompatibility(
  seekerPartnerTags: PartnerTagPreferences | null,
  candidateSelfTags: CandidateSelfTags | null,
  seekerSectorGroup?: string,
  seekerAnswers?: Record<string, unknown> | null,
  candidateAnswers?: Record<string, unknown> | null,
): TagCompatibilityResult {
  const weights = getWeightsForSector(seekerSectorGroup);
  const maxPossibleScore = Object.values(weights).reduce((sum, w) => sum + w.maxScore, 0);

  const result: TagCompatibilityResult = {
    score: 0,
    maxPossibleScore,
    matchedTags: [],
    details: {},
    sectorGroupUsed: seekerSectorGroup || 'default',
  };

  if (!seekerPartnerTags || !candidateSelfTags) {
    // Fill in empty details for all categories
    for (const [category, weight] of Object.entries(weights)) {
      result.details[category] = {
        score: 0,
        maxScore: weight.maxScore,
        matchedTags: [],
        note: 'no_data',
      };
    }
    return result;
  }

  const doesntMatter = new Set(seekerPartnerTags.doesntMatterCategories);

  // Map categories to their tag arrays
  const categoryMap: Record<string, { seekerPrefs: string[]; candidateTags: string[] }> = {
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

  for (const [category, weight] of Object.entries(weights)) {
    // "Doesn't matter" = 90% of max category score
    if (doesntMatter.has(category)) {
      const score = Math.round(weight.maxScore * 0.9);
      result.details[category] = {
        score,
        maxScore: weight.maxScore,
        matchedTags: [],
        note: 'doesnt_matter',
      };
      totalScore += score;
      continue;
    }

    const { seekerPrefs, candidateTags } = categoryMap[category] || {
      seekerPrefs: [],
      candidateTags: [],
    };

    const overlap = calculateCategoryOverlap(seekerPrefs, candidateTags, weight.maxScore);

    result.details[category] = {
      score: overlap.score,
      maxScore: weight.maxScore,
      matchedTags: overlap.matchedTags,
    };

    totalScore += overlap.score;
    allMatchedTags.push(...overlap.matchedTags);
  }

  // ─── Slider distance scoring (bonus adjustment within personality) ──────
  if (seekerAnswers && candidateAnswers) {
    const seekerEnergyPref = seekerAnswers['p_energy_type'] as number | undefined;
    const candidateEnergy = candidateAnswers['s3_energy_type'] as number | undefined;

    if (
      seekerEnergyPref !== undefined && seekerEnergyPref !== null &&
      candidateEnergy !== undefined && candidateEnergy !== null
    ) {
      const sliderScore = calculateSliderDistance(seekerEnergyPref, candidateEnergy);
      result.sliderDistances = {
        energy_type: {
          seekerValue: seekerEnergyPref,
          candidateValue: candidateEnergy,
          distance: Math.abs(seekerEnergyPref - candidateEnergy),
          score: sliderScore,
        },
      };

      // Adjust personality score: blend tag overlap (70%) with slider distance (30%)
      const personalityDetail = result.details['personality'];
      if (personalityDetail) {
        const tagPart = personalityDetail.score * 0.7;
        const sliderPart = sliderScore * personalityDetail.maxScore * 0.3;
        const adjustedScore = Math.round(tagPart + sliderPart);

        // Only adjust if it changes the score
        if (adjustedScore !== personalityDetail.score) {
          totalScore = totalScore - personalityDetail.score + adjustedScore;
          personalityDetail.score = adjustedScore;
          personalityDetail.note = (personalityDetail.note || '') + ' slider_adjusted';
        }
      }
    }
  }

  result.score = totalScore;
  result.matchedTags = allMatchedTags;

  return result;
}

// ─── Expanded Hard Filters ───────────────────────────────────────────────────

/**
 * Check if candidate passes expanded hard filters
 * Goes beyond just sector to include kashrut, smoking, and children preferences
 */
export function passesExpandedHardFilters(
  seekerPartnerTags: PartnerTagPreferences | null,
  seekerProfile: {
    preferredReligiousLevels?: string[];
    hasChildren?: boolean;
  },
  candidateSelfTags: CandidateSelfTags | null,
  candidateProfile: {
    religiousLevel?: string;
    hasChildren?: boolean;
    smoking?: string;
  },
  seekerAnswers?: Record<string, unknown> | null,
  candidateAnswers?: Record<string, unknown> | null,
): ExpandedHardFilterResult {
  const failedFilters: string[] = [];

  // 1. Sector hard filter (existing logic)
  if (seekerPartnerTags && candidateSelfTags) {
    if (
      !seekerPartnerTags.doesntMatterCategories.includes('sector') &&
      seekerPartnerTags.sectorTags.length > 0 &&
      candidateSelfTags.sectorTags.length > 0
    ) {
      const sectorMatch = seekerPartnerTags.sectorTags.some((s) =>
        candidateSelfTags.sectorTags.includes(s)
      );
      if (!sectorMatch) {
        failedFilters.push('sector');
      }
    }
  }

  // 2. Smoking hard filter (tags-based + profile fallback)
  {
    const smokingTags = ['non_smoker', 'social_smoker', 'regular_smoker', 'quit_smoking'];

    // Get seeker's smoking preference from tags
    const seekerSmokingPrefs = seekerPartnerTags?.lifestyleTags.filter(t => smokingTags.includes(t)) || [];

    // Get candidate's smoking status: prefer tags, fallback to profile
    let candidateSmoking: string | undefined;
    if (candidateSelfTags) {
      const candidateSmokingTags = candidateSelfTags.lifestyleTags.filter(t => smokingTags.includes(t));
      if (candidateSmokingTags.length > 0) candidateSmoking = candidateSmokingTags[0];
    }
    if (!candidateSmoking && candidateProfile.smoking) {
      // Map profile smokingStatus to tag values
      const profileToTag: Record<string, string> = {
        never: 'non_smoker',
        occasionally: 'social_smoker',
        regularly: 'regular_smoker',
        trying_to_quit: 'quit_smoking',
      };
      candidateSmoking = profileToTag[candidateProfile.smoking] || candidateProfile.smoking;
    }

    if (seekerSmokingPrefs.length > 0 && candidateSmoking) {
      // If seeker wants non_smoker and candidate is regular_smoker → fail
      if (
        seekerSmokingPrefs.includes('non_smoker') &&
        !seekerSmokingPrefs.includes('regular_smoker') &&
        candidateSmoking === 'regular_smoker'
      ) {
        failedFilters.push('smoking');
      }
    }
  }

  // 3. Kashrut hard filter
  if (seekerPartnerTags && candidateSelfTags) {
    const kashrutLevels = [
      'mehadrin', 'kosher_strict', 'kosher_regular', 'kosher_basic',
      'traditional_kosher', 'not_kosher_jewish',
    ];

    const seekerKashrutPrefs = seekerPartnerTags.lifestyleTags.filter(t => kashrutLevels.includes(t));
    const candidateKashrutTags = candidateSelfTags.lifestyleTags.filter(t => kashrutLevels.includes(t));

    if (seekerKashrutPrefs.length > 0 && candidateKashrutTags.length > 0) {
      // Strict kashrut hierarchy: mehadrin > kosher_strict > kosher_regular > etc.
      const kashrutRank: Record<string, number> = {
        mehadrin: 6,
        kosher_strict: 5,
        kosher_regular: 4,
        kosher_basic: 3,
        traditional_kosher: 2,
        not_kosher_jewish: 1,
      };

      const seekerMinRank = Math.max(...seekerKashrutPrefs.map(k => kashrutRank[k] || 0));
      const candidateRank = Math.max(...candidateKashrutTags.map(k => kashrutRank[k] || 0));

      // Fail if candidate is 2+ levels below seeker's minimum requirement
      if (seekerMinRank - candidateRank >= 2) {
        failedFilters.push('kashrut');
      }
    }
  }

  // 4. Children hard filter (for divorce/widowed situations)
  if (seekerAnswers && candidateProfile) {
    const partnerChildrenPref = seekerAnswers['s6_partner_children'] as string | string[] | undefined;
    if (partnerChildrenPref && candidateProfile.hasChildren !== undefined) {
      const prefs = Array.isArray(partnerChildrenPref) ? partnerChildrenPref : [partnerChildrenPref];
      // If seeker explicitly chose "no_children_only" and candidate has children
      if (prefs.includes('no_children_only') && candidateProfile.hasChildren) {
        failedFilters.push('children');
      }
    }
  }

  return {
    passes: failedFilters.length === 0,
    failedFilters,
  };
}

// ─── Legacy Hard Filter (kept for backward compatibility) ────────────────────

/**
 * Check if a candidate passes the hard tag filter (sector match only)
 * Used as Tier 1.5 in scanning — replaced by passesExpandedHardFilters for V3
 */
export function passesTagHardFilter(
  seekerPartnerTags: PartnerTagPreferences | null,
  candidateSectorTags: string[]
): boolean {
  if (!seekerPartnerTags) return true;
  if (seekerPartnerTags.doesntMatterCategories.includes('sector')) return true;
  if (seekerPartnerTags.sectorTags.length === 0) return true;

  return seekerPartnerTags.sectorTags.some((s) => candidateSectorTags.includes(s));
}

// ─── Database Loading Functions ──────────────────────────────────────────────

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
      sectionAnswers: true,
      source: true,
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
      sectionAnswers: true,
      source: true,
    },
  });

  const map = new Map<string, (typeof tags)[number]>();
  for (const t of tags) {
    map.set(t.profileId, t);
  }
  return map;
}

// ─── Utility: Get sector group from profile tags ─────────────────────────────

/**
 * Determine sector group from a user's sector tags
 */
export function getSectorGroupFromTags(sectorTags: string[]): SectorGroup {
  if (!sectorTags || sectorTags.length === 0) return 'in_process';

  const primary = sectorTags[0]; // First sector tag is the primary

  const charediSectors = ['charedi_litvish', 'charedi_hasidic', 'charedi_sephardi', 'charedi_modern'];
  const dlSectors = ['hardal', 'dati_leumi_torani', 'dati_leumi_classic', 'dati_leumi_modern', 'dati_lite', 'datlash'];
  const masortiSectors = ['masorti_strong', 'masorti_medium', 'masorti_light'];
  const hiloniSectors = ['hiloni_jewish', 'hiloni_cultural', 'hiloni'];

  if (charediSectors.includes(primary)) return 'charedi';
  if (dlSectors.includes(primary)) return 'dati_leumi';
  if (masortiSectors.includes(primary)) return 'masorti';
  if (hiloniSectors.includes(primary)) return 'hiloni';
  if (primary === 'chozer_bteshuva') return 'chozer_bteshuva';
  if (primary === 'diaspora') return 'diaspora';

  return 'in_process';
}
