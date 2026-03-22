// ============================================================
// NeshamaTech - Compatibility Calculation Service V2.5
// src/lib/services/compatibilityServiceV2.ts
// 
// עדכון: 29/01/2025
// - שינוי 1: הסרת Deal Breaker שפה (אנגלית בלבד)
// - שינוי 2: תמיכה בחישוב חד-כיווני (oneDirectional option)
// - שינוי 3: שפה הפכה ל-Soft Penalty קל במקום Deal Breaker
// ============================================================

import prisma from "@/lib/prisma";
import { Gender } from "@prisma/client";
import {
  ProfileMetrics,
  HardDealBreaker,
  SoftDealBreaker,
  MetricCompatibilityResult,
  PairCompatibilityResult,
  DEFAULT_METRIC_WEIGHTS,
  BACKGROUND_COMPATIBILITY_MATRIX,
  BackgroundCategory,
  EthnicBackground,
  calculateRangeCompatibility,
  PERSONALITY_COMPATIBILITY_MATRIX,
  ATTACHMENT_COMPATIBILITY_MATRIX,
  calculateLoveLanguageOverlap,
  calculateSocioEconomicScore,
  calculateEducationScore,
  calculateJobSeniorityScore,
  getReligiousCompatibilityScore,
} from "@/types/profileMetrics";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProfileWithMetrics {
  id: string;
  userId: string;
  gender: Gender;
  age: number;
  height?: number;
  city?: string;
  occupation?: string;
  religiousLevel?: string;
  religiousJourney?: string;
  nativeLanguage?: string;
  additionalLanguages?: string[];
  hasChildrenFromPrevious?: boolean;
  smoking?: string;
  shomerNegiah?: boolean;
  headCovering?: string;
  kippahType?: string;
  bodyType?: string;
  appearanceTone?: string;
  groomingStyle?: string;
  preferredBodyTypes?: string[];
  preferredAppearanceTones?: string[];
  preferredGroomingStyles?: string[];
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  preferredHeightMin?: number;
  preferredHeightMax?: number;
  preferredReligiousLevels?: string[];
  preferredReligiousJourneys?: string[];
  metrics?: ProfileMetrics;
}

interface VectorSimilarityResult {
  selfToSeeking: number;
  seekingToSelf: number;
  symmetric: number;
}

// 🆕 אפשרויות לחישוב
interface CalculationOptions {
  oneDirectional?: boolean; // אם true - מחשב רק מ-A ל-B
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function calculatePairCompatibility(
  profileAId: string,
  profileBId: string,
  options: CalculationOptions = {}
): Promise<PairCompatibilityResult> {
  const { oneDirectional = false } = options;

  const [profileA, profileB] = await Promise.all([
    fetchProfileWithMetrics(profileAId),
    fetchProfileWithMetrics(profileBId),
  ]);

  if (!profileA || !profileB) {
    throw new Error('One or both profiles not found');
  }

  // חישוב מ-A ל-B (תמיד)
  const dealBreakersAtoB = checkHardDealBreakers(profileA, profileB);
  const softPenaltiesAtoB = calculateSoftPenalties(profileA, profileB);
  const metricsAtoB = calculateMetricsCompatibility(profileA, profileB);

  // 🆕 חישוב מ-B ל-A (רק אם לא חד-כיווני)
  let dealBreakersBtoA: { passed: boolean; failed: string[] };
  let softPenaltiesBtoA: { totalPenalty: number; applied: { type: string; penalty: number }[] };
  let metricsBtoA: { score: number; details: MetricCompatibilityResult[] };

  if (oneDirectional) {
    // בחישוב חד-כיווני - מעתיקים את הערכים מ-A→B
    dealBreakersBtoA = { passed: true, failed: [] };
    softPenaltiesBtoA = { totalPenalty: 0, applied: [] };
    metricsBtoA = { score: metricsAtoB.score, details: [] };
  } else {
    dealBreakersBtoA = checkHardDealBreakers(profileB, profileA);
    softPenaltiesBtoA = calculateSoftPenalties(profileB, profileA);
    metricsBtoA = calculateMetricsCompatibility(profileB, profileA);
  }

  const vectorSimilarity = await calculateVectorSimilarity(profileAId, profileBId);

  // Tag compatibility (Soul Fingerprint) — V3: sector-adaptive weights + slider distance
  let tagScoreAtoB: number | undefined;
  let tagScoreBtoA: number | undefined;
  let tagBreakdownAtoB: import('./tagMatchingService').TagCompatibilityResult | undefined;
  let tagBreakdownBtoA: import('./tagMatchingService').TagCompatibilityResult | undefined;
  try {
    const { calculateTagCompatibility, loadProfileTags, getSectorGroupFromTags } = await import('./tagMatchingService');
    const [tagsA, tagsB] = await Promise.all([
      loadProfileTags(profileAId),
      loadProfileTags(profileBId),
    ]);
    if (tagsA && tagsB) {
      const partnerPrefsA = tagsA.partnerTags as import('@/components/soul-fingerprint/types').PartnerTagPreferences | null;
      const partnerPrefsB = tagsB.partnerTags as import('@/components/soul-fingerprint/types').PartnerTagPreferences | null;
      const sectorGroupA = getSectorGroupFromTags(tagsA.sectorTags);
      const sectorGroupB = getSectorGroupFromTags(tagsB.sectorTags);
      const answersA = tagsA.sectionAnswers as Record<string, unknown> | null;
      const answersB = tagsB.sectionAnswers as Record<string, unknown> | null;

      if (partnerPrefsA) {
        tagBreakdownAtoB = calculateTagCompatibility(partnerPrefsA, tagsB, sectorGroupA, answersA, answersB);
        tagScoreAtoB = tagBreakdownAtoB.score;
      }
      if (partnerPrefsB && !oneDirectional) {
        tagBreakdownBtoA = calculateTagCompatibility(partnerPrefsB, tagsA, sectorGroupB, answersB, answersA);
        tagScoreBtoA = tagBreakdownBtoA.score;
      }
    }
  } catch {
    // Tags not available, continue without
  }

  const scoreAtoB = calculateFinalScore(
    metricsAtoB.score,
    vectorSimilarity?.seekingToSelf || 0,
    softPenaltiesAtoB.totalPenalty,
    dealBreakersAtoB.passed,
    tagScoreAtoB,
    tagBreakdownAtoB?.maxPossibleScore
  );

  // 🆕 בחישוב חד-כיווני - הציון ההפוך שווה לציון הישיר
  const scoreBtoA = oneDirectional ? scoreAtoB : calculateFinalScore(
    metricsBtoA.score,
    vectorSimilarity?.selfToSeeking || 0,
    softPenaltiesBtoA.totalPenalty,
    dealBreakersBtoA.passed,
    tagScoreBtoA,
    tagBreakdownBtoA?.maxPossibleScore
  );

  // 🆕 בחישוב חד-כיווני - הציון הסימטרי הוא פשוט הציון A→B
  const symmetricScore = oneDirectional ? scoreAtoB : Math.min(scoreAtoB, scoreBtoA);

  const recommendation = determineRecommendation(
    symmetricScore,
    dealBreakersAtoB.passed && dealBreakersBtoA.passed
  );

  const flags = collectFlags(profileA, profileB, metricsAtoB, metricsBtoA);

  return {
    profileAId,
    profileBId,
    scoreAtoB,
    breakdownAtoB: {
      metricsScore: metricsAtoB.score,
      vectorScore: vectorSimilarity?.seekingToSelf,
      dealBreakersPassed: dealBreakersAtoB.passed,
      softPenalties: softPenaltiesAtoB.totalPenalty,
      metricDetails: metricsAtoB.details,
      failedDealBreakers: dealBreakersAtoB.failed,
      appliedSoftPenalties: softPenaltiesAtoB.applied,
    },
    scoreBtoA,
    breakdownBtoA: {
      metricsScore: metricsBtoA.score,
      vectorScore: vectorSimilarity?.selfToSeeking,
      dealBreakersPassed: dealBreakersBtoA.passed,
      softPenalties: softPenaltiesBtoA.totalPenalty,
      metricDetails: metricsBtoA.details,
      failedDealBreakers: dealBreakersBtoA.failed,
      appliedSoftPenalties: softPenaltiesBtoA.applied,
    },
    symmetricScore,
    recommendation,
    flags,
  };
}

// ═══════════════════════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════════════════════

async function fetchProfileWithMetrics(profileId: string): Promise<ProfileWithMetrics | null> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) return null;

  const metricsResult = await prisma.$queryRaw<any[]>`
    SELECT * FROM profile_metrics WHERE "profileId" = ${profileId}
  `;

  const metrics = metricsResult[0] || undefined;

  // 🆕 גיל עם fallback לערך מוסק
  let age = 0;
  if (profile.birthDate) {
    age = Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  } else if (metrics?.inferredAge) {
    age = metrics.inferredAge;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    gender: profile.gender,
    age,
    height: profile.height || undefined,
    city: profile.city || metrics?.inferredCity || undefined,
    occupation: profile.occupation || undefined,
    religiousLevel: profile.religiousLevel || metrics?.inferredReligiousLevel || undefined,
    religiousJourney: profile.religiousJourney || undefined,
    nativeLanguage: profile.nativeLanguage || undefined,
    additionalLanguages: profile.additionalLanguages || undefined,
    hasChildrenFromPrevious: profile.hasChildrenFromPrevious || undefined,
    smoking: profile.smokingStatus || undefined,
    shomerNegiah: profile.shomerNegiah || undefined,
    headCovering: profile.headCovering || undefined,
    kippahType: profile.kippahType || undefined,
    bodyType: profile.bodyType || undefined,
    appearanceTone: profile.appearanceTone || undefined,
    groomingStyle: profile.groomingStyle || undefined,
    preferredBodyTypes: profile.preferredBodyTypes?.length ? profile.preferredBodyTypes : undefined,
    preferredAppearanceTones: profile.preferredAppearanceTones?.length ? profile.preferredAppearanceTones : undefined,
    preferredGroomingStyles: profile.preferredGroomingStyles?.length ? profile.preferredGroomingStyles : undefined,
    preferredAgeMin: profile.preferredAgeMin || metrics?.inferredPreferredAgeMin || undefined,
    preferredAgeMax: profile.preferredAgeMax || metrics?.inferredPreferredAgeMax || undefined,
    preferredHeightMin: profile.preferredHeightMin || undefined,
    preferredHeightMax: profile.preferredHeightMax || undefined,
    preferredReligiousLevels: profile.preferredReligiousLevels || undefined,
    preferredReligiousJourneys: profile.preferredReligiousJourneys?.length ? profile.preferredReligiousJourneys : undefined,
    metrics: metrics ? {
      ...metrics,
      dealBreakersHard: parseJson(metrics.dealBreakersHard),
      dealBreakersSoft: parseJson(metrics.dealBreakersSoft),
      difficultyFlags: parseJson(metrics.difficultyFlags),
      inferredLoveLanguages: parseJson(metrics.inferredLoveLanguages),
      inferredRelationshipGoals: parseJson(metrics.inferredRelationshipGoals),
      aiInferredDealBreakers: parseJson(metrics.aiInferredDealBreakers),
      aiInferredMustHaves: parseJson(metrics.aiInferredMustHaves),
      metricsExplanations: parseJson(metrics.metricsExplanations),
    } : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
// HARD DEAL BREAKERS - 🆕 הוסרה בדיקת שפה!
// ═══════════════════════════════════════════════════════════════

interface DealBreakerCheckResult {
  passed: boolean;
  failed: string[];
}

function checkHardDealBreakers(
  seeker: ProfileWithMetrics,
  candidate: ProfileWithMetrics
): DealBreakerCheckResult {
  const failed: string[] = [];

  // מגדר זהה
  if (seeker.gender === candidate.gender) {
    failed.push('SAME_GENDER');
  }

  // גיל מתחת למינימום
  if (seeker.preferredAgeMin && candidate.age > 0 && candidate.age < seeker.preferredAgeMin) {
    failed.push(`AGE_TOO_YOUNG: ${candidate.age} < ${seeker.preferredAgeMin}`);
  }
  
  // גיל מעל מקסימום
  if (seeker.preferredAgeMax && candidate.age > 0 && candidate.age > seeker.preferredAgeMax) {
    failed.push(`AGE_TOO_OLD: ${candidate.age} > ${seeker.preferredAgeMax}`);
  }

  // רמות דתיות מועדפות
  if (seeker.preferredReligiousLevels?.length && candidate.religiousLevel) {
    if (!seeker.preferredReligiousLevels.includes(candidate.religiousLevel)) {
      failed.push(`RELIGIOUS_LEVEL: ${candidate.religiousLevel} not in preferred`);
    }
  }

  // תאימות דתית בסיסית
  if (seeker.religiousLevel && candidate.religiousLevel) {
    if (!areReligiousLevelsCompatible(seeker.religiousLevel, candidate.religiousLevel)) {
      failed.push(`RELIGIOUS_INCOMPATIBLE: ${seeker.religiousLevel} ↔ ${candidate.religiousLevel}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 הוסר: בדיקת שפה כ-Deal Breaker!
  // הועבר ל-Soft Penalties במקום
  // ═══════════════════════════════════════════════════════════

  // Deal Breakers מותאמים אישית מהמדדים
  if (seeker.metrics?.dealBreakersHard) {
    const hardDealBreakers = seeker.metrics.dealBreakersHard as HardDealBreaker[];
    for (const db of hardDealBreakers) {
      const result = evaluateHardDealBreaker(db, candidate);
      if (!result.passed) {
        failed.push(result.reason);
      }
    }
  }

  return { passed: failed.length === 0, failed };
}

// 🆕 מבוסס על מטריצת תאימות דתית 15×15 — מקור אמת יחיד
function areReligiousLevelsCompatible(levelA: string, levelB: string): boolean {
  const score = getReligiousCompatibilityScore(levelA, levelB);
  return score > 20; // ציון 20 ומטה = לא מומלץ בכלל
}

function evaluateHardDealBreaker(
  db: HardDealBreaker,
  candidate: ProfileWithMetrics
): { passed: boolean; reason: string } {
  switch (db.type) {
    case 'HAS_CHILDREN':
      if (db.operator === 'EQUALS' && db.value === false && candidate.hasChildrenFromPrevious) {
        return { passed: false, reason: 'HAS_CHILDREN' };
      }
      break;
    case 'SMOKING':
      if (db.operator === 'EQUALS' && db.value === false) {
        if (candidate.smoking && !['no', 'never'].includes(candidate.smoking)) {
          return { passed: false, reason: 'SMOKING' };
        }
      }
      break;
    case 'SHOMER_NEGIA':
      if (db.operator === 'EQUALS' && candidate.shomerNegiah !== db.value) {
        return { passed: false, reason: 'SHOMER_NEGIA' };
      }
      break;
    case 'HEAD_COVERING':
      if (db.operator === 'NOT_IN' && db.values && candidate.headCovering) {
        if (db.values.includes(candidate.headCovering)) {
          return { passed: false, reason: 'HEAD_COVERING' };
        }
      }
      break;
    case 'RELIGIOUS_LEVEL':
      if (db.operator === 'NOT_IN' && db.values && candidate.religiousLevel) {
        if (db.values.includes(candidate.religiousLevel)) {
          return { passed: false, reason: 'RELIGIOUS_LEVEL' };
        }
      }
      break;
  }
  return { passed: true, reason: '' };
}

// ═══════════════════════════════════════════════════════════════
// SOFT PENALTIES - 🆕 שפה הועברה לכאן!
// ═══════════════════════════════════════════════════════════════

interface SoftPenaltiesResult {
  totalPenalty: number;
  applied: { type: string; penalty: number }[];
}

function calculateSoftPenalties(
  seeker: ProfileWithMetrics,
  candidate: ProfileWithMetrics
): SoftPenaltiesResult {
  const applied: { type: string; penalty: number }[] = [];

  // גובה מתחת למינימום
  if (seeker.preferredHeightMin && candidate.height && candidate.height < seeker.preferredHeightMin) {
    const gap = seeker.preferredHeightMin - candidate.height;
    applied.push({ type: `HEIGHT_SHORT (-${gap}cm)`, penalty: Math.min(gap * 2, 20) });
  }
  
  // גובה מעל מקסימום
  if (seeker.preferredHeightMax && candidate.height && candidate.height > seeker.preferredHeightMax) {
    const gap = candidate.height - seeker.preferredHeightMax;
    applied.push({ type: `HEIGHT_TALL (+${gap}cm)`, penalty: Math.min(gap * 2, 15) });
  }

  // אי התאמת רקע
  if (seeker.metrics?.backgroundCategory && candidate.metrics?.backgroundCategory) {
    const multiplier = BACKGROUND_COMPATIBILITY_MATRIX[seeker.metrics.backgroundCategory as BackgroundCategory]?.[candidate.metrics.backgroundCategory as BackgroundCategory];
    
    if (multiplier && multiplier < 0.8) {
      applied.push({ type: 'BACKGROUND_MISMATCH', penalty: Math.round((1 - multiplier) * 20) });
    }
  }

  // אי התאמה אתנית
  if (seeker.metrics?.ethnicBackground && candidate.metrics?.ethnicBackground) {
    const ethnicPenalty = calculateEthnicPenalty(
      seeker.metrics.ethnicBackground as EthnicBackground,
      candidate.metrics.ethnicBackground as EthnicBackground
    );
    if (ethnicPenalty > 0) {
      applied.push({ type: 'ETHNIC_MISMATCH', penalty: ethnicPenalty });
    }
  }

  // אי התאמת אורבניות
  if (seeker.metrics?.urbanScore !== undefined && candidate.metrics?.urbanScore !== undefined) {
    const gap = Math.abs(seeker.metrics.urbanScore - candidate.metrics.urbanScore);
    if (gap > 40) {
      applied.push({ type: 'URBAN_MISMATCH', penalty: Math.round((gap - 40) * 0.2) });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 שפה - Soft Penalty משמעותי (לא Deal Breaker אבל גבוה יותר)
  // ═══════════════════════════════════════════════════════════
  const seekerFluency = seeker.metrics?.englishFluency ?? 50;
  const candidateFluency = candidate.metrics?.englishFluency ?? 50;
  const fluencyGap = Math.abs(seekerFluency - candidateFluency);

  if (isEnglishOnly(seeker) && !speaksEnglish(candidate)) {
    if (fluencyGap > 60) {
      // פער חמור — אחד דובר אנגלית בלבד והשני בקושי
      applied.push({ type: 'SEVERE_LANGUAGE_BARRIER', penalty: 25 });
    } else {
      applied.push({ type: 'LANGUAGE_BARRIER', penalty: 20 });
    }
  } else if (isEnglishOnly(candidate) && !speaksEnglish(seeker)) {
    // בדיקה דו-כיוונית: גם אם המועמד דובר אנגלית בלבד
    if (fluencyGap > 60) {
      applied.push({ type: 'SEVERE_LANGUAGE_BARRIER', penalty: 25 });
    } else {
      applied.push({ type: 'LANGUAGE_BARRIER', penalty: 20 });
    }
  } else if (fluencyGap > 60) {
    // פער שפה גדול גם בלי להיות "English only"
    applied.push({ type: 'LANGUAGE_GAP', penalty: 12 });
  }

  // מסלול דתי - בונוס/קנס עדין
  if (seeker.preferredReligiousJourneys?.length && candidate.religiousJourney) {
    if (!seeker.preferredReligiousJourneys.includes(candidate.religiousJourney)) {
      applied.push({ type: 'RELIGIOUS_JOURNEY_MISMATCH', penalty: 5 });
    }
  }

  // אי התאמת גזרה
  if (seeker.preferredBodyTypes?.length && candidate.bodyType) {
    if (!seeker.preferredBodyTypes.includes(candidate.bodyType)) {
      const pickiness = seeker.metrics?.appearancePickiness || 50;
      const penalty = Math.round(5 + (pickiness / 100) * 10); // 5-15 נקודות בהתאם לרגישות
      applied.push({ type: 'BODY_TYPE_MISMATCH', penalty });
    }
  }

  // אי התאמת טון מראה
  if (seeker.preferredAppearanceTones?.length && candidate.appearanceTone) {
    if (!seeker.preferredAppearanceTones.includes(candidate.appearanceTone)) {
      const pickiness = seeker.metrics?.appearancePickiness || 50;
      const penalty = Math.round(5 + (pickiness / 100) * 10);
      applied.push({ type: 'APPEARANCE_TONE_MISMATCH', penalty });
    }
  }

  // אי התאמת סגנון טיפוח
  if (seeker.preferredGroomingStyles?.length && candidate.groomingStyle) {
    if (!seeker.preferredGroomingStyles.includes(candidate.groomingStyle)) {
      applied.push({ type: 'GROOMING_STYLE_MISMATCH', penalty: 5 });
    }
  }

  // Deal Breakers רכים מותאמים אישית
  if (seeker.metrics?.dealBreakersSoft) {
    for (const db of seeker.metrics.dealBreakersSoft as SoftDealBreaker[]) {
      if (db.penalty > 0) {
        applied.push({ type: db.type, penalty: db.penalty });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 AI Deal Breakers — קווי אדום שזוהו ע"י AI מהשאלון
  // ═══════════════════════════════════════════════════════════
  const aiDealBreakers = (seeker.metrics as any)?.aiInferredDealBreakers as string[] | null;
  if (aiDealBreakers?.length) {
    let aiDealBreakerTotal = 0;
    for (const dealBreaker of aiDealBreakers) {
      if (aiDealBreakerTotal >= 40) break; // cap at 40
      const lower = dealBreaker.toLowerCase();

      if ((lower.includes('ילדים') || lower.includes('children')) && candidate.hasChildrenFromPrevious) {
        applied.push({ type: `AI_DEAL_BREAKER: ${dealBreaker}`, penalty: 20 });
        aiDealBreakerTotal += 20;
      }

      if ((lower.includes('חרדי') || lower.includes('charedi')) && candidate.religiousLevel?.startsWith('charedi')) {
        applied.push({ type: `AI_DEAL_BREAKER: ${dealBreaker}`, penalty: 20 });
        aiDealBreakerTotal += 20;
      }

      if ((lower.includes('חילוני') || lower.includes('secular')) && candidate.religiousLevel === 'secular') {
        applied.push({ type: `AI_DEAL_BREAKER: ${dealBreaker}`, penalty: 20 });
        aiDealBreakerTotal += 20;
      }

      const ageMatch = lower.match(/גיל\s*(\d+)/);
      if (ageMatch) {
        const maxAge = parseInt(ageMatch[1]);
        if (candidate.age > 0 && candidate.age > maxAge) {
          applied.push({ type: `AI_DEAL_BREAKER: ${dealBreaker}`, penalty: 20 });
          aiDealBreakerTotal += 20;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 AI Must Haves — דרישות שזוהו ע"י AI מהשאלון
  // ═══════════════════════════════════════════════════════════
  const aiMustHaves = (seeker.metrics as any)?.aiInferredMustHaves as string[] | null;
  if (aiMustHaves?.length) {
    let aiMustHaveTotal = 0;
    for (const mustHave of aiMustHaves) {
      if (aiMustHaveTotal >= 30) break; // cap at 30
      const lower = mustHave.toLowerCase();

      if ((lower.includes('תואר') || lower.includes('degree') || lower.includes('השכלה'))
          && (candidate.metrics as any)?.educationLevelScore !== null
          && (candidate.metrics as any)?.educationLevelScore < 3) {
        applied.push({ type: `AI_MUST_HAVE_MISSING: ${mustHave}`, penalty: 12 });
        aiMustHaveTotal += 12;
      }

      if ((lower.includes('עובד') || lower.includes('employed') || lower.includes('עבודה'))
          && !candidate.occupation) {
        applied.push({ type: `AI_MUST_HAVE_MISSING: ${mustHave}`, penalty: 12 });
        aiMustHaveTotal += 12;
      }

      if (lower.includes('ירושלים') || lower.includes('jerusalem')) {
        const city = candidate.city || (candidate.metrics as any)?.inferredCity;
        if (city && !city.includes('ירושלים') && !city.toLowerCase().includes('jerusalem')) {
          applied.push({ type: `AI_MUST_HAVE_MISSING: ${mustHave}`, penalty: 12 });
          aiMustHaveTotal += 12;
        }
      }

      if (lower.includes('תל אביב') || lower.includes('tel aviv')) {
        const city = candidate.city || (candidate.metrics as any)?.inferredCity;
        if (city && !city.includes('תל אביב') && !city.toLowerCase().includes('tel aviv')) {
          applied.push({ type: `AI_MUST_HAVE_MISSING: ${mustHave}`, penalty: 12 });
          aiMustHaveTotal += 12;
        }
      }
    }
  }

  return { totalPenalty: applied.reduce((sum, p) => sum + p.penalty, 0), applied };
}

function calculateEthnicPenalty(ethnicA: EthnicBackground, ethnicB: EthnicBackground): number {
  if (ethnicA === EthnicBackground.MIXED || ethnicB === EthnicBackground.MIXED) return 0;
  if ((ethnicA === EthnicBackground.ASHKENAZI && ethnicB === EthnicBackground.ETHIOPIAN) ||
      (ethnicA === EthnicBackground.ETHIOPIAN && ethnicB === EthnicBackground.ASHKENAZI)) return 15;
  if ((ethnicA === EthnicBackground.ASHKENAZI && ethnicB === EthnicBackground.YEMENITE) ||
      (ethnicA === EthnicBackground.YEMENITE && ethnicB === EthnicBackground.ASHKENAZI)) return 10;
  if (ethnicA !== ethnicB) return 5;
  return 0;
}

// Helper functions לשפה
function isEnglishOnly(profile: ProfileWithMetrics): boolean {
  return (
    profile.nativeLanguage?.toLowerCase() === 'english' &&
    (!profile.additionalLanguages || 
     !profile.additionalLanguages.some(l => ['hebrew', 'עברית'].includes(l.toLowerCase())))
  );
}

function speaksEnglish(profile: ProfileWithMetrics): boolean {
  if (profile.nativeLanguage?.toLowerCase() === 'english') return true;
  if (profile.additionalLanguages?.some(l => l.toLowerCase() === 'english')) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════
// METRICS COMPATIBILITY
// ═══════════════════════════════════════════════════════════════

interface MetricsCompatibilityResult {
  score: number;
  details: MetricCompatibilityResult[];
}

function calculateMetricsCompatibility(
  seeker: ProfileWithMetrics,
  candidate: ProfileWithMetrics
): MetricsCompatibilityResult {
  const details: MetricCompatibilityResult[] = [];

  if (!seeker.metrics || !candidate.metrics) {
    return { score: 50, details };
  }

  const metricsToCheck = [
    { name: 'socialEnergy', selfKey: 'socialEnergy', prefMinKey: 'prefSocialEnergyMin', prefMaxKey: 'prefSocialEnergyMax', prefWeightKey: 'prefSocialEnergyWeight' },
    { name: 'emotionalExpression', selfKey: 'emotionalExpression', prefMinKey: 'prefEmotionalExpressionMin', prefMaxKey: 'prefEmotionalExpressionMax', prefWeightKey: 'prefEmotionalExpressionWeight' },
    { name: 'stabilityVsSpontaneity', selfKey: 'stabilityVsSpontaneity', prefMinKey: 'prefStabilityMin', prefMaxKey: 'prefStabilityMax', prefWeightKey: 'prefStabilityWeight' },
    { name: 'religiousStrictness', selfKey: 'religiousStrictness', prefMinKey: 'prefReligiousStrictnessMin', prefMaxKey: 'prefReligiousStrictnessMax', prefWeightKey: 'prefReligiousStrictnessWeight' },
    { name: 'spiritualDepth', selfKey: 'spiritualDepth', prefMinKey: 'prefSpiritualDepthMin', prefMaxKey: 'prefSpiritualDepthMax', prefWeightKey: 'prefSpiritualDepthWeight' },
    { name: 'careerOrientation', selfKey: 'careerOrientation', prefMinKey: 'prefCareerOrientationMin', prefMaxKey: 'prefCareerOrientationMax', prefWeightKey: 'prefCareerOrientationWeight' },
    { name: 'ambitionLevel', selfKey: 'ambitionLevel', prefMinKey: 'prefAmbitionMin', prefMaxKey: 'prefAmbitionMax', prefWeightKey: 'prefAmbitionWeight' },
    { name: 'financialApproach', selfKey: 'financialApproach', prefMinKey: 'prefFinancialMin', prefMaxKey: 'prefFinancialMax', prefWeightKey: 'prefFinancialWeight' },
    { name: 'urbanScore', selfKey: 'urbanScore', prefMinKey: 'prefUrbanScoreMin', prefMaxKey: 'prefUrbanScoreMax', prefWeightKey: 'prefUrbanScoreWeight' },
    { name: 'adventureScore', selfKey: 'adventureScore', prefMinKey: 'prefAdventureScoreMin', prefMaxKey: 'prefAdventureScoreMax', prefWeightKey: 'prefAdventureScoreWeight' },
    { name: 'nightOwlScore', selfKey: 'nightOwlScore', prefMinKey: 'prefNightOwlMin', prefMaxKey: 'prefNightOwlMax', prefWeightKey: 'prefNightOwlWeight' },
    { name: 'togetherVsAutonomy', selfKey: 'togetherVsAutonomy', prefMinKey: 'prefTogetherVsAutonomyMin', prefMaxKey: 'prefTogetherVsAutonomyMax', prefWeightKey: 'prefTogetherVsAutonomyWeight' },
    { name: 'familyInvolvement', selfKey: 'familyInvolvement', prefMinKey: 'prefFamilyInvolvementMin', prefMaxKey: 'prefFamilyInvolvementMax', prefWeightKey: 'prefFamilyInvolvementWeight' },
    { name: 'growthVsAcceptance', selfKey: 'growthVsAcceptance', prefMinKey: 'prefGrowthVsAcceptanceMin', prefMaxKey: 'prefGrowthVsAcceptanceMax', prefWeightKey: 'prefGrowthVsAcceptanceWeight' },
  ];

  let totalWeightedScore = 0;
  let totalWeight = 0;

  // 🆕 שליפת confidence מתוך metricsExplanations לשקלול משקל
  const explanations = (seeker.metrics as any)?.metricsExplanations || {};

  for (const metric of metricsToCheck) {
    const candidateValue = (candidate.metrics as any)[metric.selfKey];
    const seekerPrefMin = (seeker.metrics as any)[metric.prefMinKey];
    const seekerPrefMax = (seeker.metrics as any)[metric.prefMaxKey];
    const baseWeight = (seeker.metrics as any)[metric.prefWeightKey] ?? DEFAULT_METRIC_WEIGHTS[metric.name] ?? 5;

    if (candidateValue === undefined || candidateValue === null) continue;

    // 🆕 Confidence weighting: confidence 0% → 50% weight, 100% → full weight
    const metricConfidence = explanations[metric.name]?.confidence ?? 70;
    const seekerWeight = baseWeight * (0.5 + metricConfidence / 200);

    const compatibility = calculateRangeCompatibility(candidateValue, seekerPrefMin, seekerPrefMax, baseWeight);
    const penalty = compatibility < 100 ? Math.round((100 - compatibility) * seekerWeight / 100) : 0;

    details.push({
      metric: metric.name,
      valueA: candidateValue,
      preferenceMinB: seekerPrefMin ?? 0,
      preferenceMaxB: seekerPrefMax ?? 100,
      weightB: Math.round(seekerWeight * 10) / 10,
      compatibilityScore: compatibility,
      penalty,
    });

    totalWeightedScore += compatibility * seekerWeight;
    totalWeight += seekerWeight;
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 מדדים נוספים: סוציו-אקונומי, השכלה, בכירות תעסוקתית
  // ═══════════════════════════════════════════════════════════
  const sm = seeker.metrics as any;
  const cm = candidate.metrics as any;

  const socioScore = calculateSocioEconomicScore(
    sm.socioEconomicLevel, cm.socioEconomicLevel,
    sm.prefSocioEconomicMin ?? null, sm.prefSocioEconomicMax ?? null,
    cm.prefSocioEconomicMin ?? null, cm.prefSocioEconomicMax ?? null
  );
  if (socioScore !== 70) { // 70 = neutral/missing, skip if no data
    const w = DEFAULT_METRIC_WEIGHTS.socioEconomicLevel;
    totalWeightedScore += socioScore * w;
    totalWeight += w;
    details.push({ metric: 'socioEconomicLevel', valueA: cm.socioEconomicLevel, preferenceMinB: sm.prefSocioEconomicMin ?? 0, preferenceMaxB: sm.prefSocioEconomicMax ?? 10, weightB: w, compatibilityScore: socioScore, penalty: socioScore < 50 ? Math.round((100 - socioScore) * w / 100) : 0 });
  }

  const eduScore = calculateEducationScore(
    sm.educationLevelScore, cm.educationLevelScore,
    sm.prefEducationMin ?? null, cm.prefEducationMin ?? null
  );
  if (eduScore !== 70) {
    const w = DEFAULT_METRIC_WEIGHTS.educationLevelScore;
    totalWeightedScore += eduScore * w;
    totalWeight += w;
    details.push({ metric: 'educationLevelScore', valueA: cm.educationLevelScore, preferenceMinB: sm.prefEducationMin ?? 0, preferenceMaxB: 5, weightB: w, compatibilityScore: eduScore, penalty: eduScore < 50 ? Math.round((100 - eduScore) * w / 100) : 0 });
  }

  const jobScore = calculateJobSeniorityScore(
    sm.jobSeniorityLevel, cm.jobSeniorityLevel,
    sm.prefJobSeniorityMin ?? null, cm.prefJobSeniorityMin ?? null
  );
  if (jobScore !== 70) {
    const w = DEFAULT_METRIC_WEIGHTS.jobSeniorityLevel;
    totalWeightedScore += jobScore * w;
    totalWeight += w;
    details.push({ metric: 'jobSeniorityLevel', valueA: cm.jobSeniorityLevel, preferenceMinB: sm.prefJobSeniorityMin ?? 0, preferenceMaxB: 5, weightB: w, compatibilityScore: jobScore, penalty: jobScore < 50 ? Math.round((100 - jobScore) * w / 100) : 0 });
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 תאימות אישיות, סגנון התקשרות, שפות אהבה
  // ═══════════════════════════════════════════════════════════
  if (sm.inferredPersonalityType && cm.inferredPersonalityType) {
    const personalityScore = PERSONALITY_COMPATIBILITY_MATRIX[sm.inferredPersonalityType]?.[cm.inferredPersonalityType];
    if (personalityScore !== undefined) {
      const w = DEFAULT_METRIC_WEIGHTS.personalityType;
      totalWeightedScore += personalityScore * w;
      totalWeight += w;
      details.push({ metric: 'personalityType', valueA: cm.inferredPersonalityType, preferenceMinB: 0, preferenceMaxB: 100, weightB: w, compatibilityScore: personalityScore, penalty: 0 });
    }
  }

  if (sm.inferredAttachmentStyle && cm.inferredAttachmentStyle) {
    const attachScore = ATTACHMENT_COMPATIBILITY_MATRIX[sm.inferredAttachmentStyle]?.[cm.inferredAttachmentStyle];
    if (attachScore !== undefined) {
      const w = DEFAULT_METRIC_WEIGHTS.attachmentStyle;
      totalWeightedScore += attachScore * w;
      totalWeight += w;
      details.push({ metric: 'attachmentStyle', valueA: cm.inferredAttachmentStyle, preferenceMinB: 0, preferenceMaxB: 100, weightB: w, compatibilityScore: attachScore, penalty: 0 });
    }
  }

  const loveOverlap = calculateLoveLanguageOverlap(sm.inferredLoveLanguages, cm.inferredLoveLanguages);
  if (loveOverlap !== 50) { // 50 = neutral/missing
    const w = DEFAULT_METRIC_WEIGHTS.loveLanguages;
    totalWeightedScore += loveOverlap * w;
    totalWeight += w;
    details.push({ metric: 'loveLanguages', valueA: cm.inferredLoveLanguages, preferenceMinB: 0, preferenceMaxB: 100, weightB: w, compatibilityScore: loveOverlap, penalty: 0 });
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 תאימות גיל רציפה (לא רק pass/fail)
  // ═══════════════════════════════════════════════════════════
  if (seeker.preferredAgeMin && seeker.preferredAgeMax && candidate.age > 0) {
    const idealAge = (seeker.preferredAgeMin + seeker.preferredAgeMax) / 2;
    const ageDist = Math.abs(candidate.age - idealAge);
    let ageScore: number;
    if (ageDist <= 0.5) ageScore = 100;
    else if (ageDist <= 1.5) ageScore = 95;
    else if (ageDist <= 2.5) ageScore = 90;
    else if (ageDist <= 3.5) ageScore = 80;
    else if (ageDist <= 4.5) ageScore = 70;
    else if (ageDist <= 5.5) ageScore = 60;
    else ageScore = 50;

    const w = DEFAULT_METRIC_WEIGHTS.ageCompatibility;
    totalWeightedScore += ageScore * w;
    totalWeight += w;
    details.push({ metric: 'ageCompatibility', valueA: candidate.age, preferenceMinB: seeker.preferredAgeMin, preferenceMaxB: seeker.preferredAgeMax, weightB: w, compatibilityScore: ageScore, penalty: 0 });
  }

  return { score: totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 50, details };
}

// ═══════════════════════════════════════════════════════════════
// VECTOR SIMILARITY
// ═══════════════════════════════════════════════════════════════

async function calculateVectorSimilarity(
  profileAId: string,
  profileBId: string
): Promise<VectorSimilarityResult | null> {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        1 - (pv_a."selfVector" <=> pv_b."seekingVector") as "selfToSeeking",
        1 - (pv_a."seekingVector" <=> pv_b."selfVector") as "seekingToSelf"
      FROM profile_vectors pv_a
      CROSS JOIN profile_vectors pv_b
      WHERE pv_a."profileId" = ${profileAId}
        AND pv_b."profileId" = ${profileBId}
        AND pv_a."selfVector" IS NOT NULL
        AND pv_a."seekingVector" IS NOT NULL
        AND pv_b."selfVector" IS NOT NULL
        AND pv_b."seekingVector" IS NOT NULL
    `;

    if (!result[0]) return null;

    return {
      selfToSeeking: result[0].selfToSeeking,
      seekingToSelf: result[0].seekingToSelf,
      symmetric: Math.min(result[0].selfToSeeking, result[0].seekingToSelf),
    };
  } catch (error) {
    console.error('[Compatibility] Vector similarity failed:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// FINAL SCORE & HELPERS
// ═══════════════════════════════════════════════════════════════

function calculateFinalScore(
  metricsScore: number,
  vectorScore: number,
  softPenalty: number,
  dealBreakersPassed: boolean,
  tagScore?: number, // 0-50, from tagMatchingService
  maxPossibleTagScore?: number // dynamic max based on sector weights
): number {
  if (!dealBreakersPassed) return 0;

  let baseScore: number;

  if (tagScore !== undefined && tagScore > 0) {
    // V3: Tags are the backbone — 40% of final score
    // Normalize tag score to 0-100 based on actual max possible score
    const maxTag = maxPossibleTagScore || 50;
    const normalizedTagScore = (tagScore / maxTag) * 100;

    if (vectorScore > 0) {
      // Tags 40% + Metrics 35% + Vectors 25%
      baseScore = normalizedTagScore * 0.40 + metricsScore * 0.35 + (vectorScore * 100) * 0.25;
    } else {
      // Tags 50% + Metrics 50%
      baseScore = normalizedTagScore * 0.50 + metricsScore * 0.50;
    }
  } else {
    // No tags — fallback (same as before)
    baseScore = vectorScore > 0
      ? metricsScore * 0.7 + (vectorScore * 100) * 0.3
      : metricsScore;
  }

  return Math.round(Math.max(0, baseScore - softPenalty));
}

function determineRecommendation(
  symmetricScore: number,
  dealBreakersPassed: boolean
): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'BLOCKED' {
  if (!dealBreakersPassed) return 'BLOCKED';
  if (symmetricScore >= 85) return 'EXCELLENT';
  if (symmetricScore >= 70) return 'GOOD';
  if (symmetricScore >= 55) return 'FAIR';
  return 'POOR';
}

function collectFlags(
  profileA: ProfileWithMetrics,
  profileB: ProfileWithMetrics,
  metricsAtoB: MetricsCompatibilityResult,
  metricsBtoA: MetricsCompatibilityResult
): string[] {
  const flags: string[] = [];

  // דגל pickiness
  if (profileA.metrics?.appearancePickiness && profileA.metrics.appearancePickiness > 70) {
    flags.push(`⚠️ ${profileA.gender === Gender.MALE ? 'He' : 'She'} is picky on appearance`);
  }
  if (profileB.metrics?.appearancePickiness && profileB.metrics.appearancePickiness > 70) {
    flags.push(`⚠️ ${profileB.gender === Gender.MALE ? 'He' : 'She'} is picky on appearance`);
  }

  // דגלי קושי
  if (profileA.metrics?.difficultyFlags?.length) {
    flags.push(`📌 A: ${(profileA.metrics.difficultyFlags as string[]).join(', ')}`);
  }
  if (profileB.metrics?.difficultyFlags?.length) {
    flags.push(`📌 B: ${(profileB.metrics.difficultyFlags as string[]).join(', ')}`);
  }

  // פער דתי
  const religiousMetric = metricsAtoB.details.find(d => d.metric === 'religiousStrictness');
  if (religiousMetric && religiousMetric.compatibilityScore < 60) {
    flags.push(`⛪ Religious gap`);
  }

  // פער אורבני
  const urbanMetric = metricsAtoB.details.find(d => d.metric === 'urbanScore');
  if (urbanMetric && urbanMetric.compatibilityScore < 50) {
    flags.push(`🏙️ Urban mismatch`);
  }

  // 🆕 דגל שפה משותפת (אנגלית)
  if ((isEnglishOnly(profileA) || isEnglishOnly(profileB)) && 
      speaksEnglish(profileA) && speaksEnglish(profileB)) {
    flags.push(`🌐 English-speaking couple`);
  }

  // 🆕 דגל אזהרה לשפה
  if (isEnglishOnly(profileA) && !speaksEnglish(profileB)) {
    flags.push(`🔤 Language barrier - A speaks only English`);
  }
  if (isEnglishOnly(profileB) && !speaksEnglish(profileA)) {
    flags.push(`🔤 Language barrier - B speaks only English`);
  }

  return flags;
}

function parseJson(value: any): any {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const compatibilityServiceV2 = {
  calculatePairCompatibility,
};

export default compatibilityServiceV2;