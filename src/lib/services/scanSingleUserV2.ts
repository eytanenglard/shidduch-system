// ============================================================
// NeshamaTech - Single User Scan Service V2.5 (MAJOR UPDATE)
// src/lib/services/scanSingleUserV2.ts
// 
// עדכון: 29/01/2025
// - שינוי 1: סטטוס != NOT_AVAILABLE (במקום = AVAILABLE)
// - שינוי 2: AI ב-batches גדולים (15 מועמדים) + השוואה ביניהם
// - שינוי 3: Deep Analysis לטופ 15 עם דירוג
// - שינוי 4: Background Multiplier (בונוס רקע תואם)
// - שינוי 5: Cache לזוגות שכבר חושבו
// - שינוי 6: חישוב חד-כיווני (רק מנקודת מבט היוזר)
// ============================================================

import prisma from "@/lib/prisma";
import { calculatePairCompatibility } from "./compatibilityServiceV2";
import { updateProfileVectorsAndMetrics } from "./dualVectorService";
import { PairCompatibilityResult } from "@/types/profileMetrics";
import { Gender } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MIN_SCORE_TO_SAVE = 65;
const MAX_CANDIDATES_TO_UPDATE = 30;
const MAX_CANDIDATES_FOR_AI = 20; // 🆕 כמה מועמדים לשלוח ל-AI (batch אחד)
const CACHE_VALIDITY_HOURS = 24;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ScanOptions {
  useVectors?: boolean;
  useAIDeepAnalysis?: boolean;
  maxCandidates?: number;
  forceUpdateMetrics?: boolean;
  skipCandidateMetricsUpdate?: boolean;
  skipCache?: boolean; // 🆕 דלג על cache
}

export interface ScanResult {
  userId: string;
  profileId: string;
  scanStartedAt: Date;
  scanCompletedAt: Date;
  durationMs: number;
  
  stats: {
    totalCandidates: number;
    passedDealBreakers: number;
    scoredCandidates: number;
    aiAnalyzed: number;
    candidatesUpdated: number;
    savedToDb: number;
    fromCache: number; // 🆕
  };
  
  matches: ScoredMatch[];
  errors: string[];
  warnings: string[];
}

export interface ScoredMatch {
  candidateProfileId: string;
  candidateUserId: string;
  candidateName: string;
  candidateAge: number;
  candidateCity?: string;
  
  // 🆕 ציון חד-כיווני (מנקודת מבט היוזר בלבד)
  score: number;
  metricsScore: number;
  aiScore?: number;
  backgroundMultiplier: number; // 🆕
  
  vectorScore?: number;
  softPenalties: number;
  
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  tier: 1 | 2 | 3;
  rank?: number; // 🆕 דירוג מה-AI
  
  flags: string[];
  failedDealBreakers: string[];
  fromCache: boolean; // 🆕
  
  candidateBackground?: {
    category?: string;
    socioEconomicLevel?: number;
    jobSeniorityLevel?: number;
    educationLevelScore?: number;
    religiousStrictness?: number;
  };
  
  aiAnalysis?: {
    score: number;
    reasoning: string;
    strengths: string[];
    concerns: string[];
  };
}

// 🆕 מטריצת התאמת רקע
type BackgroundCategory = 'sabra' | 'sabra_international' | 'oleh_veteran' | 'oleh_mid' | 'oleh_new' | 'unknown';

const BACKGROUND_MULTIPLIER_MATRIX: Record<BackgroundCategory, Record<BackgroundCategory, number>> = {
  sabra: {
    sabra: 1.15,
    sabra_international: 1.10,
    oleh_veteran: 1.0,
    oleh_mid: 0.9,
    oleh_new: 0.8,
    unknown: 1.0,
  },
  sabra_international: {
    sabra: 1.10,
    sabra_international: 1.15,
    oleh_veteran: 1.10,
    oleh_mid: 1.0,
    oleh_new: 0.9,
    unknown: 1.0,
  },
  oleh_veteran: {
    sabra: 1.0,
    sabra_international: 1.10,
    oleh_veteran: 1.15,
    oleh_mid: 1.05,
    oleh_new: 0.95,
    unknown: 1.0,
  },
  oleh_mid: {
    sabra: 0.9,
    sabra_international: 1.0,
    oleh_veteran: 1.05,
    oleh_mid: 1.15,
    oleh_new: 1.05,
    unknown: 1.0,
  },
  oleh_new: {
    sabra: 0.8,
    sabra_international: 0.9,
    oleh_veteran: 0.95,
    oleh_mid: 1.05,
    oleh_new: 1.15,
    unknown: 1.0,
  },
  unknown: {
    sabra: 1.0,
    sabra_international: 1.0,
    oleh_veteran: 1.0,
    oleh_mid: 1.0,
    oleh_new: 1.0,
    unknown: 1.0,
  },
};

// ═══════════════════════════════════════════════════════════════
// MAIN SCAN FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function scanSingleUserV2(
  userId: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[ScanV2.5] Starting scan for user: ${userId}`);
  console.log(`${'='.repeat(60)}`);

  const {
    useVectors = true,
    useAIDeepAnalysis = true,
    maxCandidates = 100,
    forceUpdateMetrics = false,
    skipCandidateMetricsUpdate = false,
    skipCache = false,
  } = options;

  // ═══════════════════════════════════════════════════════════
  // TIER 0: וידוא מוכנות היוזר הנסרק
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2.5] ═══ TIER 0: Readiness Check ═══`);

  const profile = await prisma.profile.findFirst({
    where: { userId },
    include: { user: true },
  });

  if (!profile) {
    throw new Error(`Profile not found for user: ${userId}`);
  }

  const userMetrics = await prisma.$queryRaw<any[]>`
    SELECT 
      pm.*,
      pm."socioEconomicLevel",
      pm."jobSeniorityLevel",
      pm."educationLevelScore",
      pm."inferredAge",
      pm."inferredCity",
      pm."inferredReligiousLevel",
      pm."inferredPreferredAgeMin",
      pm."inferredPreferredAgeMax",
      pm."inferredPreferredReligiousLevels",
      pm."aiBackgroundSummary",
      pm."aiMatchmakerGuidelines",
      pm."aiInferredDealBreakers",
      pm."aiInferredMustHaves",
      pm."backgroundCategory"
    FROM "profile_metrics" pm
    WHERE pm."profileId" = ${profile.id}
    LIMIT 1
  `;

  const metrics = userMetrics[0] || null;

  // חישוב גיל עם fallback
  let userAge: number;
  if (profile.birthDate) {
    userAge = Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  } else if (metrics?.inferredAge) {
    userAge = metrics.inferredAge;
    console.log(`[ScanV2.5] Using inferred age: ${userAge}`);
  } else {
    userAge = 30;
    warnings.push('No age found, using default 30');
  }

  // חישוב טווח גילאים עם fallback
  let preferredAgeMin: number;
  let preferredAgeMax: number;

  if (profile.preferredAgeMin !== null && profile.preferredAgeMax !== null) {
    preferredAgeMin = profile.preferredAgeMin;
    preferredAgeMax = profile.preferredAgeMax;
  } else if (metrics?.inferredPreferredAgeMin && metrics?.inferredPreferredAgeMax) {
    preferredAgeMin = metrics.inferredPreferredAgeMin;
    preferredAgeMax = metrics.inferredPreferredAgeMax;
  } else {
    if (profile.gender === Gender.MALE) {
      preferredAgeMin = Math.max(18, userAge - 7);
      preferredAgeMax = userAge + 2;
    } else {
      preferredAgeMin = Math.max(18, userAge - 2);
      preferredAgeMax = userAge + 10;
    }
  }

  const userCity = profile.city || metrics?.inferredCity || null;
  const userBackgroundCategory: BackgroundCategory = (metrics?.backgroundCategory as BackgroundCategory) || 'unknown';

  console.log(`[ScanV2.5] User: ${profile.user.firstName} ${profile.user.lastName}, Age: ${userAge}, Gender: ${profile.gender}`);
  console.log(`[ScanV2.5] Background: ${userBackgroundCategory}`);
  console.log(`[ScanV2.5] Looking for age range: ${preferredAgeMin} - ${preferredAgeMax}`);

  // בדיקה ועדכון מדדים/וקטורים
  const metricsExist = await checkMetricsExist(profile.id);
  const vectorsExist = await checkVectorsExist(profile.id);

  if (!metricsExist || !vectorsExist || forceUpdateMetrics) {
    console.log(`[ScanV2.5] Updating metrics/vectors for user profile...`);
    try {
      await updateProfileVectorsAndMetrics(profile.id);
      console.log(`[ScanV2.5] User metrics updated ✓`);
    } catch (error) {
      warnings.push(`Failed to update user metrics: ${error}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 0.5: עדכון מדדים למועמדים שחסר להם
  // ═══════════════════════════════════════════════════════════
  const oppositeGender: Gender = profile.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
  let candidatesUpdated = 0;

  if (!skipCandidateMetricsUpdate) {
    console.log(`\n[ScanV2.5] ═══ TIER 0.5: Candidate Metrics Update ═══`);
    try {
      const updateResult = await ensureCandidatesReady(oppositeGender, MAX_CANDIDATES_TO_UPDATE);
      candidatesUpdated = updateResult.updated;
    } catch (error) {
      warnings.push(`Candidate update check failed: ${error}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 TIER 0.7: בדיקת Cache
  // ═══════════════════════════════════════════════════════════
  let cachedMatches: Map<string, any> = new Map();
  let fromCacheCount = 0;

  if (!skipCache) {
    console.log(`\n[ScanV2.5] ═══ TIER 0.7: Cache Check ═══`);
    cachedMatches = await getCachedMatches(userId, CACHE_VALIDITY_HOURS);
    console.log(`[ScanV2.5] Found ${cachedMatches.size} cached matches`);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 1: Deal Breaker Filter (SQL) - 🆕 סטטוס != NOT_AVAILABLE
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2.5] ═══ TIER 1: Deal Breaker Filter ═══`);

  const preferredPartnerHasChildren = profile.preferredPartnerHasChildren ?? 'does_not_matter';

  // 🆕 שאילתה מעודכנת: סטטוס != NOT_AVAILABLE
  const tier1Candidates = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id as "profileId",
      p."userId",
      u."firstName",
      u."lastName",
      p.gender,
      p."birthDate",
      p.city,
      p."religiousLevel",
      p.height,
      p."nativeLanguage",
      p."additionalLanguages",
      p."preferredAgeMin",
      p."preferredAgeMax",
      p."hasChildrenFromPrevious",
      p."educationLevel",
      p.occupation,
      p."parentStatus",
      
      pm."confidenceScore",
      pm."religiousStrictness",
      pm."urbanScore",
      pm."backgroundCategory",
      pm."ethnicBackground",
      pm."appearancePickiness",
      pm."socialEnergy",
      pm."careerOrientation",
      pm."spiritualDepth",
      pm."socioEconomicLevel",
      pm."jobSeniorityLevel",
      pm."educationLevelScore",
      pm."inferredAge",
      pm."inferredCity",
      pm."inferredReligiousLevel",
      pm."inferredPreferredAgeMin",
      pm."inferredPreferredAgeMax",
      pm."aiPersonalitySummary",
      pm."aiSeekingSummary",
      pm."aiBackgroundSummary",
      pm."aiMatchmakerGuidelines",
      pm."aiInferredDealBreakers",
      pm."aiInferredMustHaves",
      pm."difficultyFlags",
      
      COALESCE(
        EXTRACT(YEAR FROM AGE(p."birthDate"))::int,
        pm."inferredAge"
      ) as "candidateAge"
      
    FROM "Profile" p 
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    WHERE 
      -- מגדר הפוך
      p.gender = ${oppositeGender}::"Gender"
      
      -- 🆕 סטטוס: כל דבר חוץ מ-NOT_AVAILABLE
      AND (p."availabilityStatus" IS NULL OR p."availabilityStatus" != 'NOT_AVAILABLE'::"AvailabilityStatus")
      
      -- פרופיל גלוי
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND p.id != ${profile.id}
      
      -- סינון גיל: המועמד בטווח שהיוזר מחפש
      AND (
        COALESCE(
          EXTRACT(YEAR FROM AGE(p."birthDate"))::int,
          pm."inferredAge"
        ) >= ${preferredAgeMin}
      )
      AND (
        COALESCE(
          EXTRACT(YEAR FROM AGE(p."birthDate"))::int,
          pm."inferredAge"
        ) <= ${preferredAgeMax}
      )
      
      -- סינון גיל הפוך: היוזר בטווח שהמועמד מחפש
      AND (
        COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin") IS NULL 
        OR ${userAge} >= COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin")
      )
      AND (
        COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax") IS NULL 
        OR ${userAge} <= COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax")
      )
      
      -- סינון ילדים מקודם
      AND (
        ${preferredPartnerHasChildren} = 'does_not_matter'
        OR ${preferredPartnerHasChildren} = 'yes_ok'
        OR (${preferredPartnerHasChildren} = 'no_preferred' 
            AND (p."hasChildrenFromPrevious" IS NULL OR p."hasChildrenFromPrevious" = false))
      )
      
      -- לא נדחה ב-PotentialMatch
      AND NOT EXISTS (
        SELECT 1 FROM "PotentialMatch" pm2
        WHERE ((pm2."maleUserId" = ${userId} AND pm2."femaleUserId" = p."userId")
           OR (pm2."femaleUserId" = ${userId} AND pm2."maleUserId" = p."userId"))
          AND pm2.status::text IN ('DISMISSED', 'EXPIRED')
      )
      
      -- לא היתה הצעה שנדחתה
      AND NOT EXISTS (
        SELECT 1 FROM "MatchSuggestion" ms
        WHERE ((ms."firstPartyId" = ${userId} AND ms."secondPartyId" = p."userId")
           OR (ms."secondPartyId" = ${userId} AND ms."firstPartyId" = p."userId"))
          AND ms.status::text IN (
            'FIRST_PARTY_DECLINED', 
            'SECOND_PARTY_DECLINED', 
            'CLOSED', 
            'CANCELLED',
            'ENDED_AFTER_FIRST_DATE',
            'MATCH_DECLINED'
          )
      )
      
    ORDER BY pm."confidenceScore" DESC NULLS LAST
    LIMIT ${maxCandidates}
  `;

  console.log(`[ScanV2.5] Tier 1 Results: ${tier1Candidates.length} candidates`);

  if (tier1Candidates.length === 0) {
    return {
      userId,
      profileId: profile.id,
      scanStartedAt: new Date(startTime),
      scanCompletedAt: new Date(),
      durationMs: Date.now() - startTime,
      stats: { 
        totalCandidates: 0, 
        passedDealBreakers: 0, 
        scoredCandidates: 0, 
        aiAnalyzed: 0,
        candidatesUpdated,
        savedToDb: 0,
        fromCache: 0,
      },
      matches: [],
      errors,
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 2-3: Compatibility Calculation (חד-כיווני!)
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2.5] ═══ TIER 2-3: Compatibility Calculation ═══`);

  const scoredCandidates: {
    candidate: any;
    metricsScore: number;
    vectorScore: number;
    softPenalties: number;
    backgroundMultiplier: number;
    totalScore: number;
    fromCache: boolean;
    flags: string[];
  }[] = [];

  for (const candidate of tier1Candidates) {
    // 🆕 בדיקת Cache
    const cacheKey = `${profile.id}_${candidate.profileId}`;
    const cached = cachedMatches.get(cacheKey);
    
    if (cached && !skipCache) {
      scoredCandidates.push({
        candidate,
        metricsScore: cached.metricsScore,
        vectorScore: cached.vectorScore || 0,
        softPenalties: cached.softPenalties || 0,
        backgroundMultiplier: cached.backgroundMultiplier || 1.0,
        totalScore: cached.totalScore,
        fromCache: true,
        flags: cached.flags || [],
      });
      fromCacheCount++;
      continue;
    }

    try {
      // 🆕 חישוב חד-כיווני - רק מנקודת מבט היוזר
      const compatibility = await calculatePairCompatibility(profile.id, candidate.profileId);
      
      // לוקחים רק את הציון מכיוון היוזר
      const metricsScore = compatibility.breakdownAtoB.metricsScore;
      const vectorScore = compatibility.breakdownAtoB.vectorScore || 0;
      const softPenalties = compatibility.breakdownAtoB.softPenalties || 0;
      
      // 🆕 Background Multiplier
      const candidateBgCategory: BackgroundCategory = (candidate.backgroundCategory as BackgroundCategory) || 'unknown';
      const backgroundMultiplier = BACKGROUND_MULTIPLIER_MATRIX[userBackgroundCategory][candidateBgCategory];
      
      // חישוב ציון כולל
      let totalScore = metricsScore;
      if (vectorScore > 0) {
        totalScore = metricsScore * 0.7 + vectorScore * 0.3;
      }
      totalScore = Math.round((totalScore - softPenalties) * backgroundMultiplier);
      totalScore = Math.max(0, Math.min(100, totalScore));
      
      scoredCandidates.push({
        candidate,
        metricsScore,
        vectorScore,
        softPenalties,
        backgroundMultiplier,
        totalScore,
        fromCache: false,
        flags: compatibility.flags,
      });
      
    } catch (error) {
      warnings.push(`Failed to calculate compatibility for ${candidate.firstName}: ${error}`);
    }
  }

  console.log(`[ScanV2.5] Scored ${scoredCandidates.length} candidates (${fromCacheCount} from cache)`);

  // מיון לפי ציון
  scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

  // ═══════════════════════════════════════════════════════════
  // 🆕 TIER 4: AI Batch Comparison (קריאה אחת בלבד!)
  // ═══════════════════════════════════════════════════════════
  let aiResults: Map<string, any> = new Map();

  if (useAIDeepAnalysis && scoredCandidates.length > 0) {
    console.log(`\n[ScanV2.5] ═══ TIER 4: AI Batch Comparison ═══`);
    
    // לוקחים את הטופ לפי ציון מדדים (55+) - עד 20 מועמדים
    const candidatesForAI = scoredCandidates
      .filter(c => c.totalScore >= 55 && !c.fromCache)
      .slice(0, MAX_CANDIDATES_FOR_AI);
    
    if (candidatesForAI.length >= 3) {
      console.log(`[ScanV2.5] Sending top ${candidatesForAI.length} candidates to AI for comparison`);
      
      try {
        const userDetails = await fetchProfileDetailsForAI(profile.id);
        
        // 🆕 קריאה אחת בלבד - ה-AI רואה את כולם ומשווה!
        aiResults = await runBatchComparison(userDetails, candidatesForAI);
        
        console.log(`[ScanV2.5] AI comparison completed: ${aiResults.size} results`);
        
      } catch (error) {
        warnings.push(`AI analysis failed: ${error}`);
        console.error(`[ScanV2.5] AI analysis error:`, error);
      }
    } else {
      console.log(`[ScanV2.5] Not enough candidates for AI comparison (need 3+, have ${candidatesForAI.length})`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BUILD FINAL RESULTS
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2.5] ═══ Building Final Results ═══`);

  const matches: ScoredMatch[] = scoredCandidates.map(({ candidate, metricsScore, vectorScore, softPenalties, backgroundMultiplier, totalScore, fromCache, flags }) => {
    const age = candidate.candidateAge || candidate.inferredAge || 0;
    const aiAnalysis = aiResults.get(candidate.profileId);
    
    // 🆕 חישוב ציון סופי: אם יש AI, נותנים לו משקל משמעותי
    let finalScore = totalScore;
    if (aiAnalysis?.score) {
      // 50% מדדים + 50% AI (כי המדדים כבר סיננו)
      finalScore = Math.round(totalScore * 0.5 + aiAnalysis.score * 0.5);
    }

    // קביעת דרגה
    let tier: 1 | 2 | 3;
    if (finalScore >= 85) tier = 1;
    else if (finalScore >= 70) tier = 2;
    else tier = 3;

    return {
      candidateProfileId: candidate.profileId,
      candidateUserId: candidate.userId,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      candidateAge: age,
      candidateCity: candidate.city || candidate.inferredCity,
      
      score: finalScore,
      metricsScore,
      aiScore: aiAnalysis?.score,
      backgroundMultiplier,
      
      vectorScore,
      softPenalties,
      
      recommendation: determineRecommendation(finalScore),
      tier,
      rank: aiAnalysis?.rank,
      
      flags,
      failedDealBreakers: [],
      fromCache,
      
      candidateBackground: {
        category: candidate.backgroundCategory,
        socioEconomicLevel: candidate.socioEconomicLevel,
        jobSeniorityLevel: candidate.jobSeniorityLevel,
        educationLevelScore: candidate.educationLevelScore,
        religiousStrictness: candidate.religiousStrictness,
      },
      
      aiAnalysis: aiAnalysis ? {
        score: aiAnalysis.score,
        reasoning: aiAnalysis.reasoning || '',
        strengths: aiAnalysis.strengths || [],
        concerns: aiAnalysis.concerns || [],
      } : undefined,
    };
  });

  // מיון סופי - עדיפות לדירוג AI אם קיים
  matches.sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return b.score - a.score;
  });

  // סטטיסטיקות
  const tier1Count = matches.filter(m => m.tier === 1).length;
  const tier2Count = matches.filter(m => m.tier === 2).length;
  const tier3Count = matches.filter(m => m.tier === 3).length;
  const above65Count = matches.filter(m => m.score >= MIN_SCORE_TO_SAVE).length;

  console.log(`[ScanV2.5] Final Results:`);
  console.log(`  - Total matches: ${matches.length}`);
  console.log(`  - Tier 1 (85+): ${tier1Count}`);
  console.log(`  - Tier 2 (70-84): ${tier2Count}`);
  console.log(`  - Tier 3 (<70): ${tier3Count}`);
  console.log(`  - From cache: ${fromCacheCount}`);
  console.log(`  - Will be saved (${MIN_SCORE_TO_SAVE}+): ${above65Count}`);

  // 🆕 שמירת Cache
  await saveCachedMatches(userId, profile.id, scoredCandidates);

  const result: ScanResult = {
    userId,
    profileId: profile.id,
    scanStartedAt: new Date(startTime),
    scanCompletedAt: new Date(),
    durationMs: Date.now() - startTime,
    stats: {
      totalCandidates: tier1Candidates.length,
      passedDealBreakers: scoredCandidates.length,
      scoredCandidates: scoredCandidates.length,
      aiAnalyzed: aiResults.size,
      candidatesUpdated,
      savedToDb: above65Count,
      fromCache: fromCacheCount,
    },
    matches,
    errors,
    warnings,
  };

  console.log(`\n[ScanV2.5] ✅ Scan completed in ${result.durationMs}ms`);
  console.log(`${'='.repeat(60)}\n`);

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 🆕 AI BATCH COMPARISON - קריאה אחת בלבד!
// ═══════════════════════════════════════════════════════════════

async function runBatchComparison(
  userDetails: any,
  candidates: any[]
): Promise<Map<string, any>> {
  
  // בניית טקסט המועמדים
  const candidatesText = candidates.map((c, index) => {
    const cand = c.candidate;
    const age = cand.candidateAge || cand.inferredAge || 'לא ידוע';
    
    return `[מועמד/ת ${index + 1}]
שם: ${cand.firstName}
גיל: ${age}
עיר: ${cand.city || cand.inferredCity || 'לא צוין'}
רמה דתית: ${cand.religiousLevel || cand.inferredReligiousLevel || 'לא צוין'}
מקצוע: ${cand.occupation || 'לא צוין'}
ציון מדדים: ${c.totalScore}/100
מכפיל רקע: ${c.backgroundMultiplier.toFixed(2)}

סיכום אישיות: ${cand.aiPersonalitySummary || 'לא זמין'}
מה מחפש/ת: ${cand.aiSeekingSummary || 'לא זמין'}
רקע: ${cand.aiBackgroundSummary || 'לא זמין'}
---`;
  }).join('\n\n');

  const prompt = `אתה שדכן AI מומחה במערכת NeshamaTech.

המשימה: לנתח ולהשוות ${candidates.length} מועמדים עבור המחפש/ת ולדרג אותם.

=== פרופיל המחפש/ת ===
שם: ${userDetails.name}
גיל: ${userDetails.age}
עיר: ${userDetails.city || 'לא צוין'}
רמה דתית: ${userDetails.religiousLevel || 'לא צוין'}
מקצוע: ${userDetails.occupation || 'לא צוין'}

סיכום אישיות: ${userDetails.aiPersonalitySummary || 'לא זמין'}
מה מחפש/ת: ${userDetails.aiSeekingSummary || 'לא זמין'}
רקע: ${userDetails.aiBackgroundSummary || 'לא זמין'}
הנחיות שדכן: ${userDetails.aiMatchmakerGuidelines || 'אין'}

=== ${candidates.length} מועמדים לניתוח והשוואה ===
${candidatesText}

=== הנחיות ===
1. השווה בין כל המועמדים - מי הכי מתאים/ה למחפש/ת?
2. דרג את כולם מ-1 (הכי מתאים) עד ${candidates.length} (הכי פחות מתאים)
3. לכל מועמד/ת תן ציון מ-50 עד 100:
   - 90-100: התאמה יוצאת דופן - הכל מסתדר מצוין
   - 80-89: התאמה טובה מאוד - רוב הפרמטרים מתאימים  
   - 70-79: התאמה טובה - יש פוטנציאל עם כמה סימני שאלה
   - 60-69: התאמה סבירה - יש חששות
   - 50-59: התאמה בעייתית

4. כתוב נימוק קצר (1-2 משפטים) לכל מועמד/ת

חשוב: 
- ציון המדדים כבר חושב - השתמש בו כבסיס אבל תן את הדעת שלך!
- אתה רואה את כולם יחד - השווה ביניהם!
- אל תפחד לתת 90+ אם ההתאמה באמת מעולה

=== פורמט התשובה (JSON בלבד) ===
{
  "analysis": [
    {
      "index": 1,
      "rank": 1,
      "score": 92,
      "reasoning": "התאמה מצוינת - רקע דומה, רמה דתית תואמת, שניהם שאפתניים",
      "strengths": ["רקע דומה", "רמה דתית תואמת"],
      "concerns": []
    },
    {
      "index": 2,
      "rank": 3,
      "score": 78,
      "reasoning": "התאמה טובה אך יש פער בגישה לקריירה",
      "strengths": ["גיל מתאים", "עיר קרובה"],
      "concerns": ["פער בשאפתנות"]
    }
  ]
}

החזר JSON תקין בלבד.`;

  try {
    console.log(`[ScanV2.5] Calling Gemini API with ${candidates.length} candidates...`);
    const startTime = Date.now();
    
    const response = await callGeminiAPI(prompt);
    const duration = Date.now() - startTime;
    console.log(`[ScanV2.5] AI response received in ${duration}ms`);
    
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    const results = new Map<string, any>();
    
    for (const result of parsed.analysis || []) {
      const candidate = candidates[result.index - 1];
      if (candidate) {
        results.set(candidate.candidate.profileId, {
          score: Math.min(100, Math.max(50, result.score)),
          rank: result.rank,
          reasoning: result.reasoning || '',
          strengths: result.strengths || [],
          concerns: result.concerns || [],
        });
      }
    }
    
    // לוג תוצאות
    console.log(`[ScanV2.5] AI Results (top 5):`);
    const sorted = Array.from(results.entries()).sort((a, b) => a[1].rank - b[1].rank);
    sorted.slice(0, 5).forEach(([profileId, r]) => {
      const cand = candidates.find(c => c.candidate.profileId === profileId);
      console.log(`  ${r.rank}. ${cand?.candidate.firstName} - Score: ${r.score} (metrics: ${cand?.totalScore})`);
    });
    
    return results;
    
  } catch (error) {
    console.error('[ScanV2.5] AI comparison error:', error);
    return new Map();
  }
}

// ═══════════════════════════════════════════════════════════════
// 🆕 CACHE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getCachedMatches(
  userId: string,
  validityHours: number
): Promise<Map<string, any>> {
  const cached = new Map<string, any>();
  
  try {
    const cutoffTime = new Date(Date.now() - validityHours * 60 * 60 * 1000);
    
    // שליפת PotentialMatches שנסרקו לאחרונה
    const recentScans = await prisma.potentialMatch.findMany({
      where: {
        OR: [
          { maleUserId: userId },
          { femaleUserId: userId },
        ],
        scannedAt: { gte: cutoffTime },
      },
      select: {
        maleUserId: true,
        femaleUserId: true,
        aiScore: true,
        firstPassScore: true,
      },
    });
    
    const userProfile = await prisma.profile.findFirst({
      where: { userId },
      select: { id: true },
    });
    
    if (!userProfile) return cached;
    
    for (const scan of recentScans) {
      const candidateUserId = scan.maleUserId === userId ? scan.femaleUserId : scan.maleUserId;
      const candidateProfile = await prisma.profile.findFirst({
        where: { userId: candidateUserId },
        select: { id: true },
      });
      
      if (candidateProfile) {
        const cacheKey = `${userProfile.id}_${candidateProfile.id}`;
        cached.set(cacheKey, {
          metricsScore: scan.firstPassScore || 0,
          totalScore: scan.aiScore || scan.firstPassScore || 0,
          backgroundMultiplier: 1.0,
          flags: [],
        });
      }
    }
  } catch (error) {
    console.error('[Cache] Error fetching cached matches:', error);
  }
  
  return cached;
}

async function saveCachedMatches(
  userId: string,
  profileId: string,
  scoredCandidates: any[]
): Promise<void> {
  // ה-cache נשמר אוטומטית דרך saveScanResults
  // פונקציה זו יכולה לשמש לשמירה נוספת אם נדרש
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function checkMetricsExist(profileId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 1 FROM "profile_metrics" WHERE "profileId" = ${profileId} LIMIT 1
  `;
  return result.length > 0;
}

async function checkVectorsExist(profileId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT 1 FROM "profile_vectors" 
    WHERE "profileId" = ${profileId} 
      AND "selfVector" IS NOT NULL 
      AND "seekingVector" IS NOT NULL 
    LIMIT 1
  `;
  return result.length > 0;
}

function determineRecommendation(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
  if (score >= 85) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 55) return 'FAIR';
  return 'POOR';
}

async function ensureCandidatesReady(
  oppositeGender: Gender,
  maxToUpdate: number = 30
): Promise<{ updated: number; failed: number }> {
  
  const candidatesNeedingUpdate = await prisma.$queryRaw<{ profileId: string; firstName: string }[]>`
    SELECT 
      p.id as "profileId",
      u."firstName"
    FROM "Profile" p
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors" pv ON pv."profileId" = p.id
    WHERE 
      p.gender = ${oppositeGender}::"Gender"
      AND (p."availabilityStatus" IS NULL OR p."availabilityStatus" != 'NOT_AVAILABLE'::"AvailabilityStatus")
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND (
        pm.id IS NULL
        OR pv.id IS NULL
        OR pv."selfVector" IS NULL
        OR pv."seekingVector" IS NULL
      )
    ORDER BY p."updatedAt" DESC
    LIMIT ${maxToUpdate}
  `;

  if (candidatesNeedingUpdate.length === 0) {
    console.log(`[ScanV2.5] All candidates have metrics/vectors ✓`);
    return { updated: 0, failed: 0 };
  }

  console.log(`[ScanV2.5] Found ${candidatesNeedingUpdate.length} candidates needing metrics update`);

  let updated = 0;
  let failed = 0;

  for (const candidate of candidatesNeedingUpdate) {
    try {
      await updateProfileVectorsAndMetrics(candidate.profileId);
      updated++;
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      failed++;
    }
  }

  console.log(`[ScanV2.5] Metrics update: ${updated} success, ${failed} failed`);
  return { updated, failed };
}

async function fetchProfileDetailsForAI(profileId: string): Promise<any> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });

  if (!profile) return null;

  const metrics = await prisma.$queryRaw<any[]>`
    SELECT 
      "aiPersonalitySummary",
      "aiSeekingSummary",
      "aiBackgroundSummary",
      "aiMatchmakerGuidelines",
      "inferredAge",
      "inferredCity",
      "inferredReligiousLevel"
    FROM "profile_metrics" 
    WHERE "profileId" = ${profileId}
  `;

  const m = metrics[0] || {};

  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : m.inferredAge || 0;

  return {
    name: profile.user.firstName,
    gender: profile.gender,
    age,
    city: profile.city || m.inferredCity,
    religiousLevel: profile.religiousLevel || m.inferredReligiousLevel,
    occupation: profile.occupation,
    aiPersonalitySummary: m.aiPersonalitySummary,
    aiSeekingSummary: m.aiSeekingSummary,
    aiBackgroundSummary: m.aiBackgroundSummary,
    aiMatchmakerGuidelines: m.aiMatchmakerGuidelines,
  };
}

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing API Key for Gemini");
  }

  const model = 'gemini-2.0-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ═══════════════════════════════════════════════════════════════
// SAVE RESULTS TO DB
// ═══════════════════════════════════════════════════════════════

export async function saveScanResults(result: ScanResult): Promise<number> {
  const userProfile = await prisma.profile.findFirst({
    where: { userId: result.userId },
  });

  if (!userProfile) {
    console.error(`[ScanV2.5] Cannot save - profile not found for user: ${result.userId}`);
    return 0;
  }

  const matchesToSave = result.matches.filter(m => m.score >= MIN_SCORE_TO_SAVE);
  
  console.log(`[ScanV2.5] Saving to DB: ${matchesToSave.length} matches`);

  let savedCount = 0;
  let updatedCount = 0;

  for (const match of matchesToSave) {
    const isMale = userProfile.gender === Gender.MALE;
    const maleUserId = isMale ? result.userId : match.candidateUserId;
    const femaleUserId = isMale ? match.candidateUserId : result.userId;

    try {
      const existing = await prisma.potentialMatch.findFirst({
        where: { maleUserId, femaleUserId },
      });

      if (existing) {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            aiScore: match.score,
            firstPassScore: match.metricsScore,
            shortReasoning: match.aiAnalysis?.reasoning || null,
            scannedAt: new Date(),
          },
        });
        updatedCount++;
      } else {
        await prisma.potentialMatch.create({
          data: {
            maleUserId,
            femaleUserId,
            aiScore: match.score,
            firstPassScore: match.metricsScore,
            status: 'PENDING',
            shortReasoning: match.aiAnalysis?.reasoning || null,
          },
        });
        savedCount++;
      }
    } catch (error) {
      console.error(`[ScanV2.5] Failed to save match for ${match.candidateName}:`, error);
    }
  }

  await prisma.profile.update({
    where: { id: userProfile.id },
    data: { lastScannedAt: new Date() },
  });

  console.log(`[ScanV2.5] ✅ Saved ${savedCount} new, updated ${updatedCount} existing matches`);
  
  return savedCount + updatedCount;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const scanSingleUserServiceV2 = {
  scanSingleUserV2,
  saveScanResults,
};

export default scanSingleUserServiceV2;