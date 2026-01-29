// ============================================================
// NeshamaTech - Single User Scan Service V2 (FULLY UPDATED)
// src/lib/services/scanSingleUserV2.ts
// 
// עדכון: 28/01/2025
// - תיקון 1: סינון גיל דו-כיווני ב-Tier 1
// - תיקון 2: סינון היסטוריית MatchSuggestion
// - תיקון 3: סף מינימלי 65+ לשמירה
// - תיקון 4: עדכון אוטומטי של מדדים/וקטורים למועמדים
// - תיקון 5: שימוש במדדים החדשים (socioEconomic, jobSeniority, educationLevel)
// - תיקון 6: שימוש בערכים מוסקים (inferred) כשחסרים נתונים
// - תיקון 7: סיכומי AI מורחבים (background, matchmakerGuidelines)
// ============================================================

import prisma from "@/lib/prisma";
import { calculatePairCompatibility } from "./compatibilityServiceV2";
import { updateProfileVectorsAndMetrics } from "./dualVectorService";
import { PairCompatibilityResult } from "@/types/profileMetrics";
import { Gender } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MIN_SCORE_TO_SAVE = 65; // סף מינימלי לשמירה ב-DB
const MAX_CANDIDATES_TO_UPDATE = 30; // כמה מועמדים לעדכן מדדים בכל סריקה

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ScanOptions {
  useVectors?: boolean;
  useAIDeepAnalysis?: boolean;
  maxCandidates?: number;
  topForAI?: number;
  forceUpdateMetrics?: boolean;
  skipCandidateMetricsUpdate?: boolean;
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
  
  scoreForUser: number;
  scoreForCandidate: number;
  symmetricScore: number;
  
  metricsScore: number;
  vectorScore?: number;
  softPenalties: number;
  
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  tier: 1 | 2 | 3;
  
  flags: string[];
  failedDealBreakers: string[];
  
  // 🆕 מידע מורחב מהמדדים החדשים
  candidateBackground?: {
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
  console.log(`[ScanV2] Starting scan for user: ${userId}`);
  console.log(`${'='.repeat(60)}`);

  const {
    useVectors = true,
    useAIDeepAnalysis = true,
    maxCandidates = 100,
    topForAI = 30,
    forceUpdateMetrics = false,
    skipCandidateMetricsUpdate = false,
  } = options;

  // ═══════════════════════════════════════════════════════════
  // TIER 0: וידוא מוכנות היוזר הנסרק
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2] ═══ TIER 0: Readiness Check ═══`);

  const profile = await prisma.profile.findFirst({
    where: { userId },
    include: { user: true },
  });

  if (!profile) {
    throw new Error(`Profile not found for user: ${userId}`);
  }

  // 🆕 שליפת המדדים של היוזר כולל השדות החדשים
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
      pm."aiInferredMustHaves"
    FROM "profile_metrics" pm
    WHERE pm."profileId" = ${profile.id}
    LIMIT 1
  `;

  const metrics = userMetrics[0] || null;

  // 🆕 חישוב גיל - עם fallback לערך מוסק
  let userAge: number;
  if (profile.birthDate) {
    userAge = Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  } else if (metrics?.inferredAge) {
    userAge = metrics.inferredAge;
    console.log(`[ScanV2] Using inferred age: ${userAge}`);
  } else {
    userAge = 30; // ברירת מחדל
    warnings.push('No age found, using default 30');
  }

  // 🆕 חישוב טווח גילאים - עם fallback לערכים מוסקים
  let preferredAgeMin: number;
  let preferredAgeMax: number;

  if (profile.preferredAgeMin !== null && profile.preferredAgeMax !== null) {
    preferredAgeMin = profile.preferredAgeMin;
    preferredAgeMax = profile.preferredAgeMax;
    console.log(`[ScanV2] Using user's explicit age preferences: ${preferredAgeMin}-${preferredAgeMax}`);
  } else if (metrics?.inferredPreferredAgeMin && metrics?.inferredPreferredAgeMax) {
    preferredAgeMin = metrics.inferredPreferredAgeMin;
    preferredAgeMax = metrics.inferredPreferredAgeMax;
    console.log(`[ScanV2] Using AI inferred age preferences: ${preferredAgeMin}-${preferredAgeMax}`);
  } else {
    // ברירת מחדל חכמה לפי מגדר וגיל
    if (profile.gender === Gender.MALE) {
      preferredAgeMin = Math.max(18, userAge - 7);
      preferredAgeMax = userAge + 2;
    } else {
      preferredAgeMin = Math.max(18, userAge - 2);
      preferredAgeMax = userAge + 10;
    }
    console.log(`[ScanV2] Using smart default age range (${profile.gender}): ${preferredAgeMin}-${preferredAgeMax}`);
  }

  // 🆕 עיר - עם fallback לערך מוסק
  const userCity = profile.city || metrics?.inferredCity || null;
  if (!profile.city && metrics?.inferredCity) {
    console.log(`[ScanV2] Using inferred city: ${metrics.inferredCity}`);
  }

  console.log(`[ScanV2] User: ${profile.user.firstName} ${profile.user.lastName}, Age: ${userAge}, Gender: ${profile.gender}`);
  console.log(`[ScanV2] City: ${userCity || 'Not specified'}`);
  console.log(`[ScanV2] Looking for age range: ${preferredAgeMin} - ${preferredAgeMax}`);

  // בדיקה ועדכון מדדים/וקטורים של היוזר
  const metricsExist = await checkMetricsExist(profile.id);
  const vectorsExist = await checkVectorsExist(profile.id);

  if (!metricsExist || !vectorsExist || forceUpdateMetrics) {
    console.log(`[ScanV2] Updating metrics/vectors for user profile...`);
    try {
      await updateProfileVectorsAndMetrics(profile.id);
      console.log(`[ScanV2] User metrics updated ✓`);
    } catch (error) {
      warnings.push(`Failed to update user metrics: ${error}`);
      console.error(`[ScanV2] Failed to update user metrics:`, error);
    }
  } else {
    console.log(`[ScanV2] User metrics exist ✓`);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 0.5: עדכון מדדים/וקטורים למועמדים שחסר להם
  // ═══════════════════════════════════════════════════════════
  const oppositeGender: Gender = profile.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
  let candidatesUpdated = 0;

  if (!skipCandidateMetricsUpdate) {
    console.log(`\n[ScanV2] ═══ TIER 0.5: Candidate Metrics Update ═══`);
    
    try {
      const updateResult = await ensureCandidatesReady(oppositeGender, MAX_CANDIDATES_TO_UPDATE);
      candidatesUpdated = updateResult.updated;
      
      if (updateResult.failed > 0) {
        warnings.push(`Failed to update ${updateResult.failed} candidate profiles`);
      }
    } catch (error) {
      warnings.push(`Candidate update check failed: ${error}`);
      console.error(`[ScanV2] Candidate update error:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 1: Deal Breaker Filter (SQL) - עם סינון גיל והיסטוריה
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2] ═══ TIER 1: Deal Breaker Filter ═══`);

  const preferredPartnerHasChildren = profile.preferredPartnerHasChildren ?? 'does_not_matter';

  // 🆕 שאילתה מורחבת עם השדות החדשים
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
      
      -- מדדים קיימים
      pm."confidenceScore",
      pm."religiousStrictness",
      pm."urbanScore",
      pm."backgroundCategory",
      pm."ethnicBackground",
      pm."appearancePickiness",
      pm."socialEnergy",
      pm."careerOrientation",
      pm."spiritualDepth",
      
      -- 🆕 מדדים חדשים
      pm."socioEconomicLevel",
      pm."jobSeniorityLevel",
      pm."educationLevelScore",
      
      -- 🆕 ערכים מוסקים
      pm."inferredAge",
      pm."inferredCity",
      pm."inferredReligiousLevel",
      pm."inferredPreferredAgeMin",
      pm."inferredPreferredAgeMax",
      pm."inferredParentStatus",
      pm."inferredEducationLevel",
      
      -- 🆕 סיכומי AI
      pm."aiPersonalitySummary",
      pm."aiSeekingSummary",
      pm."aiBackgroundSummary",
      pm."aiMatchmakerGuidelines",
      pm."aiInferredDealBreakers",
      pm."aiInferredMustHaves",
      pm."difficultyFlags",
      
      -- 🆕 העדפות חדשות
      pm."prefSocioEconomicMin",
      pm."prefSocioEconomicMax",
      pm."prefJobSeniorityMin",
      pm."prefJobSeniorityMax",
      pm."prefEducationLevelMin",
      pm."prefEducationLevelMax",
      
      -- חישוב גיל עם fallback לערך מוסק
      COALESCE(
        EXTRACT(YEAR FROM AGE(p."birthDate"))::int,
        pm."inferredAge"
      ) as "candidateAge"
      
    FROM "Profile" p 
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    WHERE 
      -- ═══ מגדר הפוך ═══
      p.gender = ${oppositeGender}::"Gender"
      
      -- ═══ סטטוס פעיל ═══
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND p.id != ${profile.id}
      
      -- ═══ סינון גיל: המועמד בטווח שהיוזר מחפש ═══
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
      
      -- ═══ סינון גיל הפוך: היוזר בטווח שהמועמד מחפש ═══
      AND (
        COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin") IS NULL 
        OR ${userAge} >= COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin")
      )
      AND (
        COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax") IS NULL 
        OR ${userAge} <= COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax")
      )
      
      -- ═══ סינון ילדים מקודם ═══
      AND (
        ${preferredPartnerHasChildren} = 'does_not_matter'
        OR ${preferredPartnerHasChildren} = 'yes_ok'
        OR (${preferredPartnerHasChildren} = 'no_preferred' 
            AND (p."hasChildrenFromPrevious" IS NULL OR p."hasChildrenFromPrevious" = false))
      )
      
      -- ═══ לא נדחה ב-PotentialMatch ═══
      AND NOT EXISTS (
        SELECT 1 FROM "PotentialMatch" pm2
        WHERE ((pm2."maleUserId" = ${userId} AND pm2."femaleUserId" = p."userId")
           OR (pm2."femaleUserId" = ${userId} AND pm2."maleUserId" = p."userId"))
          AND pm2.status::text IN ('DISMISSED', 'EXPIRED')
      )
      
      -- ═══ לא היתה הצעה שנדחתה ב-MatchSuggestion ═══
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

  console.log(`[ScanV2] Tier 1 Results:`);
  console.log(`  - Total candidates after all filters: ${tier1Candidates.length}`);
  console.log(`  - Age range filter: ${preferredAgeMin}-${preferredAgeMax}`);
  console.log(`  - User age for reverse filter: ${userAge}`);

  if (tier1Candidates.length === 0) {
    console.log(`[ScanV2] No candidates found, ending scan.`);
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
      },
      matches: [],
      errors,
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 2 + 3: Compatibility Calculation
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2] ═══ TIER 2-3: Compatibility Calculation ═══`);

  const scoredCandidates: {
    candidate: any;
    compatibility: PairCompatibilityResult;
  }[] = [];

  let passedCount = 0;
  let failedCount = 0;

  for (const candidate of tier1Candidates) {
    try {
      const compatibility = await calculatePairCompatibility(profile.id, candidate.profileId);
      
      if (compatibility.breakdownAtoB.dealBreakersPassed && compatibility.breakdownBtoA.dealBreakersPassed) {
        scoredCandidates.push({ candidate, compatibility });
        passedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      warnings.push(`Failed to calculate compatibility for ${candidate.firstName}: ${error}`);
      failedCount++;
    }
  }

  console.log(`[ScanV2] Tier 2-3 Results:`);
  console.log(`  - Passed deal breakers: ${passedCount}`);
  console.log(`  - Failed deal breakers: ${failedCount}`);

  // מיון לפי ציון
  scoredCandidates.sort((a, b) => b.compatibility.symmetricScore - a.compatibility.symmetricScore);

  // ═══════════════════════════════════════════════════════════
  // TIER 4: AI Deep Analysis (אופציונלי)
  // ═══════════════════════════════════════════════════════════
  let aiResults: Map<string, any> = new Map();

  if (useAIDeepAnalysis && scoredCandidates.length > 0) {
    console.log(`\n[ScanV2] ═══ TIER 4: AI Deep Analysis ═══`);
    
    // רק מועמדים עם ציון סביר (60+) יעברו AI
    const candidatesForAI = scoredCandidates
      .filter(c => c.compatibility.symmetricScore >= 60)
      .slice(0, topForAI);
    
    console.log(`[ScanV2] Analyzing ${candidatesForAI.length} candidates with AI (score >= 60)`);
    
    try {
      aiResults = await performAIDeepAnalysis(profile, metrics, candidatesForAI);
      console.log(`[ScanV2] AI analyzed ${aiResults.size} pairs`);
    } catch (error) {
      warnings.push(`AI analysis failed: ${error}`);
      console.error(`[ScanV2] AI analysis error:`, error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BUILD FINAL RESULTS
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2] ═══ Building Final Results ═══`);

  const matches: ScoredMatch[] = scoredCandidates.map(({ candidate, compatibility }) => {
    // 🆕 שימוש בגיל עם fallback
    const age = candidate.candidateAge || candidate.inferredAge || 0;

    const aiAnalysis = aiResults.get(candidate.profileId);
    
    // חישוב ציון סופי: 60% מדדים + 40% AI (אם קיים)
    let finalScore = compatibility.symmetricScore;
    if (aiAnalysis?.score) {
      finalScore = Math.round(compatibility.symmetricScore * 0.6 + aiAnalysis.score * 0.4);
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
      
      scoreForUser: compatibility.scoreAtoB,
      scoreForCandidate: compatibility.scoreBtoA,
      symmetricScore: finalScore,
      
      metricsScore: compatibility.breakdownAtoB.metricsScore,
      vectorScore: compatibility.breakdownAtoB.vectorScore,
      softPenalties: compatibility.breakdownAtoB.softPenalties,
      
      recommendation: determineRecommendation(finalScore),
      tier,
      
      flags: compatibility.flags,
      failedDealBreakers: [],
      
      // 🆕 מידע מורחב
      candidateBackground: {
        socioEconomicLevel: candidate.socioEconomicLevel,
        jobSeniorityLevel: candidate.jobSeniorityLevel,
        educationLevelScore: candidate.educationLevelScore,
        religiousStrictness: candidate.religiousStrictness,
      },
      
      aiAnalysis: aiAnalysis ? {
        score: aiAnalysis.score,
        reasoning: aiAnalysis.reasoning,
        strengths: aiAnalysis.strengths || [],
        concerns: aiAnalysis.concerns || [],
      } : undefined,
    };
  });

  // מיון סופי לפי ציון
  matches.sort((a, b) => b.symmetricScore - a.symmetricScore);

  // סטטיסטיקות לפי דרגות
  const tier1Count = matches.filter(m => m.tier === 1).length;
  const tier2Count = matches.filter(m => m.tier === 2).length;
  const tier3Count = matches.filter(m => m.tier === 3).length;
  const above65Count = matches.filter(m => m.symmetricScore >= MIN_SCORE_TO_SAVE).length;

  console.log(`[ScanV2] Final Results:`);
  console.log(`  - Total matches: ${matches.length}`);
  console.log(`  - Tier 1 (85+): ${tier1Count}`);
  console.log(`  - Tier 2 (70-84): ${tier2Count}`);
  console.log(`  - Tier 3 (<70): ${tier3Count}`);
  console.log(`  - Will be saved (${MIN_SCORE_TO_SAVE}+): ${above65Count}`);

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
    },
    matches,
    errors,
    warnings,
  };

  console.log(`\n[ScanV2] ✅ Scan completed in ${result.durationMs}ms`);
  console.log(`${'='.repeat(60)}\n`);

  return result;
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

// ═══════════════════════════════════════════════════════════════
// ENSURE CANDIDATES HAVE METRICS/VECTORS
// ═══════════════════════════════════════════════════════════════

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
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
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
    console.log(`[ScanV2] All candidates have metrics/vectors ✓`);
    return { updated: 0, failed: 0 };
  }

  console.log(`[ScanV2] Found ${candidatesNeedingUpdate.length} candidates needing metrics update`);

  let updated = 0;
  let failed = 0;

  for (const candidate of candidatesNeedingUpdate) {
    try {
      await updateProfileVectorsAndMetrics(candidate.profileId);
      updated++;
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      failed++;
      console.error(`[ScanV2] Failed to update ${candidate.firstName}:`, error);
    }
  }

  console.log(`[ScanV2] Metrics update: ${updated} success, ${failed} failed`);
  return { updated, failed };
}

// ═══════════════════════════════════════════════════════════════
// AI DEEP ANALYSIS - 🆕 מעודכן עם סיכומים חדשים
// ═══════════════════════════════════════════════════════════════

async function performAIDeepAnalysis(
  userProfile: any,
  userMetrics: any,
  candidates: { candidate: any; compatibility: PairCompatibilityResult }[]
): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  const userDetails = await fetchProfileDetailsForAI(userProfile.id);

  const batchSize = 5;
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async ({ candidate, compatibility }) => {
      try {
        const candidateDetails = await fetchProfileDetailsForAI(candidate.profileId);
        
        const analysis = await analyzeMatchWithAI(
          userDetails,
          candidateDetails,
          compatibility
        );
        
        results.set(candidate.profileId, analysis);
      } catch (error) {
        console.error(`[AI] Failed to analyze ${candidate.firstName}:`, error);
      }
    });

    await Promise.all(batchPromises);
    
    if (i + batchSize < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return results;
}

// 🆕 פונקציה מעודכנת לשליפת פרטים עם השדות החדשים
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
      "aiInferredDealBreakers",
      "aiInferredMustHaves",
      "socialEnergy",
      "religiousStrictness",
      "careerOrientation",
      "urbanScore",
      "appearancePickiness",
      "difficultyFlags",
      "socioEconomicLevel",
      "jobSeniorityLevel",
      "educationLevelScore",
      "inferredAge",
      "inferredCity",
      "inferredReligiousLevel",
      "inferredPreferredAgeMin",
      "inferredPreferredAgeMax"
    FROM "profile_metrics" 
    WHERE "profileId" = ${profileId}
  `;

  const m = metrics[0] || {};

  // 🆕 גיל עם fallback
  const age = profile.birthDate
    ? Math.floor((Date.now() - new Date(profile.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : m.inferredAge || 0;

  // 🆕 עיר עם fallback
  const city = profile.city || m.inferredCity || null;

  return {
    name: `${profile.user.firstName}`,
    gender: profile.gender,
    age,
    city,
    religiousLevel: profile.religiousLevel || m.inferredReligiousLevel,
    occupation: profile.occupation,
    education: profile.education,
    educationLevel: profile.educationLevel || m.inferredEducationLevel,
    about: profile.about,
    matchingNotes: profile.matchingNotes,
    
    // סיכומי AI
    aiPersonalitySummary: m.aiPersonalitySummary,
    aiSeekingSummary: m.aiSeekingSummary,
    aiBackgroundSummary: m.aiBackgroundSummary,
    aiMatchmakerGuidelines: m.aiMatchmakerGuidelines,
    
    // דגלים
    aiInferredDealBreakers: m.aiInferredDealBreakers || [],
    aiInferredMustHaves: m.aiInferredMustHaves || [],
    
    // מדדים
    metrics: {
      socialEnergy: m.socialEnergy,
      religiousStrictness: m.religiousStrictness,
      careerOrientation: m.careerOrientation,
      urbanScore: m.urbanScore,
      appearancePickiness: m.appearancePickiness,
      socioEconomicLevel: m.socioEconomicLevel,
      jobSeniorityLevel: m.jobSeniorityLevel,
      educationLevelScore: m.educationLevelScore,
      difficultyFlags: m.difficultyFlags || [],
    },
    
    // העדפות
    preferences: {
      ageMin: profile.preferredAgeMin || m.inferredPreferredAgeMin,
      ageMax: profile.preferredAgeMax || m.inferredPreferredAgeMax,
    },
  };
}

// 🆕 פרומפט מעודכן עם סיכומים חדשים
async function analyzeMatchWithAI(
  userDetails: any,
  candidateDetails: any,
  compatibility: PairCompatibilityResult
): Promise<any> {
  const prompt = `אתה שדכן מומחה. נתח את ההתאמה בין שני הפרופילים הבאים.

## פרופיל A (מחפש/ת):
שם: ${userDetails.name}
מגדר: ${userDetails.gender}
גיל: ${userDetails.age}
עיר: ${userDetails.city || 'לא צוין'}
רמה דתית: ${userDetails.religiousLevel || 'לא צוין'}
מקצוע: ${userDetails.occupation || 'לא צוין'}

סיכום אישיות:
${userDetails.aiPersonalitySummary || 'לא זמין'}

מה מחפש/ת:
${userDetails.aiSeekingSummary || 'לא זמין'}

רקע:
${userDetails.aiBackgroundSummary || 'לא זמין'}

הנחיות שדכן:
${userDetails.aiMatchmakerGuidelines || 'לא זמין'}

חובות: ${userDetails.aiInferredMustHaves?.join(', ') || 'לא צוין'}
קווי אדום: ${userDetails.aiInferredDealBreakers?.join(', ') || 'לא צוין'}

## פרופיל B (מועמד/ת):
שם: ${candidateDetails.name}
מגדר: ${candidateDetails.gender}
גיל: ${candidateDetails.age}
עיר: ${candidateDetails.city || 'לא צוין'}
רמה דתית: ${candidateDetails.religiousLevel || 'לא צוין'}
מקצוע: ${candidateDetails.occupation || 'לא צוין'}

סיכום אישיות:
${candidateDetails.aiPersonalitySummary || 'לא זמין'}

מה מחפש/ת:
${candidateDetails.aiSeekingSummary || 'לא זמין'}

רקע:
${candidateDetails.aiBackgroundSummary || 'לא זמין'}

חובות: ${candidateDetails.aiInferredMustHaves?.join(', ') || 'לא צוין'}
קווי אדום: ${candidateDetails.aiInferredDealBreakers?.join(', ') || 'לא צוין'}

## ציון מדדים מקדים: ${compatibility.symmetricScore}/100
דגלים: ${compatibility.flags.join(', ') || 'אין'}

---

נתח את ההתאמה והחזר JSON בלבד:

{
  "score": <50-100>,
  "reasoning": "<הסבר קצר של 2-3 משפטים למה מתאימים/לא מתאימים>",
  "strengths": ["<נקודת חוזק 1>", "<נקודת חוזק 2>"],
  "concerns": ["<חשש 1>", "<חשש 2>"],
  "suggestedApproach": "<איך להציג את ההצעה>"
}`;

  try {
    const response = await callGeminiAPI(prompt);
    
    const cleaned = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[AI] Parse error:', error);
    return {
      score: compatibility.symmetricScore,
      reasoning: 'AI analysis unavailable',
      strengths: [],
      concerns: [],
    };
  }
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
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ScanV2 AI Error] ${response.status}:`, errorText);
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
    console.error(`[ScanV2] Cannot save - profile not found for user: ${result.userId}`);
    return 0;
  }

  const matchesToSave = result.matches.filter(m => m.symmetricScore >= MIN_SCORE_TO_SAVE);
  
  console.log(`[ScanV2] Saving to DB: ${matchesToSave.length} matches (${result.matches.length} total, filtered >= ${MIN_SCORE_TO_SAVE})`);

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
            aiScore: match.symmetricScore,
            firstPassScore: match.metricsScore,
            shortReasoning: match.aiAnalysis?.reasoning || null,
            scannedAt: new Date(),
            scoreForMale: isMale ? match.scoreForUser : match.scoreForCandidate,
            scoreForFemale: isMale ? match.scoreForCandidate : match.scoreForUser,
            asymmetryGap: Math.abs(match.scoreForUser - match.scoreForCandidate),
          },
        });
        updatedCount++;
      } else {
        await prisma.potentialMatch.create({
          data: {
            maleUserId,
            femaleUserId,
            aiScore: match.symmetricScore,
            firstPassScore: match.metricsScore,
            status: 'PENDING',
            shortReasoning: match.aiAnalysis?.reasoning || null,
            scoreForMale: isMale ? match.scoreForUser : match.scoreForCandidate,
            scoreForFemale: isMale ? match.scoreForCandidate : match.scoreForUser,
            asymmetryGap: Math.abs(match.scoreForUser - match.scoreForCandidate),
          },
        });
        savedCount++;
      }
    } catch (error) {
      console.error(`[ScanV2] Failed to save match for ${match.candidateName}:`, error);
    }
  }

  await prisma.profile.update({
    where: { id: userProfile.id },
    data: { lastScannedAt: new Date() },
  });

  console.log(`[ScanV2] ✅ Saved ${savedCount} new, updated ${updatedCount} existing matches`);
  
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