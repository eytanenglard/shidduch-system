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
    freshSkipped?: number;
  };

  matches: ScoredMatch[];
  // FRESH above-threshold candidates whose ScannedPair lastScannedAt should be bumped
  freshPassedCandidates?: Array<{ userId: string; profileId: string }>;
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
    breakdown?: {
      religious?: number;
      ageCompatibility?: number;
      careerFamily?: number;
      lifestyle?: number;
      socioEconomic?: number;
      education?: number;
      background?: number;
      values?: number;
    };
  };

  // true when at least one profile changed since last scan → stored score must be replaced
  profileChanged?: boolean;
  // contentUpdatedAt snapshots for ScannedPair upsert
  userContentUpdatedAt?: Date;
  candidateContentUpdatedAt?: Date;
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

  // בדיקה ועדכון מדדים/וקטורים של היוזר (כולל בדיקת עדכניות)
  const metricsExist = await checkMetricsExist(profile.id);
  const vectorsExist = await checkVectorsExist(profile.id);

  // בדיקת Staleness: האם הפרופיל/שאלון/טביעת נשמה עודכנו מאז שהוקטורים חושבו?
  let isStale = false;
  if (metricsExist && vectorsExist && !forceUpdateMetrics) {
    const stalenessData = await prisma.$queryRaw<{
      vectorsUpdatedAt: Date | null;
      questionnaireUpdatedAt: Date | null;
      profileUpdatedAt: Date;
      tagsUpdatedAt: Date | null;
    }[]>`
      SELECT
        pv."updatedAt"  as "vectorsUpdatedAt",
        qr."updatedAt"  as "questionnaireUpdatedAt",
        p."updatedAt"   as "profileUpdatedAt",
        pt."updatedAt"  as "tagsUpdatedAt"
      FROM "Profile" p
      LEFT JOIN "profile_vectors"       pv ON pv."profileId" = p.id
      LEFT JOIN "QuestionnaireResponse" qr ON qr."profileId" = p.id
      LEFT JOIN "ProfileTags"           pt ON pt."profileId" = p.id
      WHERE p.id = ${profile.id}
      LIMIT 1
    `;
    if (stalenessData.length > 0) {
      const { vectorsUpdatedAt, questionnaireUpdatedAt, profileUpdatedAt, tagsUpdatedAt } = stalenessData[0];
      if (vectorsUpdatedAt) {
        const vectorsTime = new Date(vectorsUpdatedAt).getTime();
        const profileTime = new Date(profileUpdatedAt).getTime();
        const questionnaireTime = questionnaireUpdatedAt ? new Date(questionnaireUpdatedAt).getTime() : 0;
        const tagsTime = tagsUpdatedAt ? new Date(tagsUpdatedAt).getTime() : 0;
        const latestDataTime = Math.max(profileTime, questionnaireTime, tagsTime);
        // Stale if any data source was updated more than 1 hour after vectors were built
        if (latestDataTime > vectorsTime + 60 * 60 * 1000) {
          isStale = true;
          const staleSource = tagsTime >= profileTime && tagsTime >= questionnaireTime
            ? 'soul fingerprint tags'
            : questionnaireTime > profileTime ? 'questionnaire' : 'profile';
          console.log(`[ScanV2] ⚠️ Vectors are stale (${staleSource} updated ${Math.round((latestDataTime - vectorsTime) / 60000)}m after vectors) — will refresh`);
        }
      }
    }
  }

  if (!metricsExist || !vectorsExist || forceUpdateMetrics || isStale) {
    const reason = !metricsExist ? 'missing metrics' : !vectorsExist ? 'missing vectors' : isStale ? 'stale data' : 'forced';
    console.log(`[ScanV2] Updating metrics/vectors for user profile (reason: ${reason})...`);
    try {
      await updateProfileVectorsAndMetrics(profile.id);
      console.log(`[ScanV2] User metrics updated ✓`);
    } catch (error) {
      warnings.push(`Failed to update user metrics: ${error}`);
      console.error(`[ScanV2] Failed to update user metrics:`, error);
    }
  } else {
    console.log(`[ScanV2] User metrics/vectors up to date ✓`);
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
  const isMaleUser = profile.gender === Gender.MALE;
  // contentUpdatedAt of the user doing the scan (significant changes only)
  const userContentUpdatedAt: Date = (profile as any).contentUpdatedAt ?? profile.updatedAt;

  // 🆕 שאילתה מורחבת עם ScannedPair + contentUpdatedAt
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
      ) as "candidateAge",

      -- שינויים משמעותיים בפרופיל המועמד
      COALESCE(p."contentUpdatedAt", p."updatedAt") as "contentUpdatedAt",

      -- ScannedPair info (if exists)
      sp."lastScannedAt"           as "spLastScannedAt",
      sp."passedThreshold"         as "spPassedThreshold",
      sp."maleProfileUpdatedAt"    as "spMaleContentAt",
      sp."femaleProfileUpdatedAt"  as "spFemaleContentAt"

    FROM "Profile" p
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    LEFT JOIN "ScannedPair" sp ON (
      (${isMaleUser}::boolean = true  AND sp."maleUserId"   = ${userId} AND sp."femaleUserId" = p."userId")
      OR
      (${isMaleUser}::boolean = false AND sp."femaleUserId" = ${userId} AND sp."maleUserId"   = p."userId")
    )
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
      
      -- ═══ לא קיימת הצעה כלשהי ב-MatchSuggestion (פעילה או שנדחתה) ═══
      AND NOT EXISTS (
        SELECT 1 FROM "MatchSuggestion" ms
        WHERE ((ms."firstPartyId" = ${userId} AND ms."secondPartyId" = p."userId")
           OR (ms."secondPartyId" = ${userId} AND ms."firstPartyId" = p."userId"))
      )
      
    ORDER BY pm."confidenceScore" DESC NULLS LAST
    LIMIT ${maxCandidates}
  `;

  // ═══════════════════════════════════════════════════════════
  // TIER 1 POST-PROCESSING: ScannedPair Categorization
  // NEW    = no ScannedPair → must score
  // STALE  = ScannedPair exists but profile changed → force rescore
  // FRESH  = ScannedPair exists, no change → skip scoring
  // ═══════════════════════════════════════════════════════════
  // Smart cooldown: shorter cooldown when profile changed, longer when nothing changed
  const RESCAN_COOLDOWN_DAYS_DEFAULT = 7;     // failed pairs with no profile change
  const RESCAN_COOLDOWN_DAYS_CHANGED = 3;     // failed pairs where at least one profile changed
  const now = Date.now();

  type ScanCategory = 'NEW' | 'STALE' | 'FRESH';
  const categorized = tier1Candidates.map((c: any) => {
    let category: ScanCategory;
    if (!c.spLastScannedAt) {
      category = 'NEW';
    } else {
      const lastScanned = new Date(c.spLastScannedAt).getTime();
      // Compare contentUpdatedAt snapshots stored in ScannedPair
      const snapshotForUser = isMaleUser ? c.spMaleContentAt : c.spFemaleContentAt;
      const snapshotForCandidate = isMaleUser ? c.spFemaleContentAt : c.spMaleContentAt;
      const userChanged = snapshotForUser
        ? userContentUpdatedAt.getTime() > new Date(snapshotForUser).getTime()
        : true;
      const candidateChanged = snapshotForCandidate
        ? new Date(c.contentUpdatedAt).getTime() > new Date(snapshotForCandidate).getTime()
        : true;

      if (!userChanged && !candidateChanged) {
        category = 'FRESH';
      } else {
        // STALE: profile changed — but apply cooldown for previously-failed pairs
        const failedPair = c.spPassedThreshold === false;
        // Use shorter cooldown when profile actually changed (more likely score will differ)
        const profileChanged = userChanged || candidateChanged;
        const cooldownDays = profileChanged ? RESCAN_COOLDOWN_DAYS_CHANGED : RESCAN_COOLDOWN_DAYS_DEFAULT;
        const cooldownExpired = now - lastScanned > cooldownDays * 24 * 60 * 60 * 1000;
        if (failedPair && !cooldownExpired) {
          category = 'FRESH'; // treat as FRESH to skip (cooldown active)
        } else {
          category = 'STALE';
        }
      }
    }
    return { ...c, scanCategory: category };
  });

  const newCount   = categorized.filter((c: any) => c.scanCategory === 'NEW').length;
  const staleCount = categorized.filter((c: any) => c.scanCategory === 'STALE').length;
  const freshCount = categorized.filter((c: any) => c.scanCategory === 'FRESH').length;

  console.log(`[ScanV2] Tier 1 Results:`);
  console.log(`  - Total candidates after all filters: ${tier1Candidates.length}`);
  console.log(`  - Age range filter: ${preferredAgeMin}-${preferredAgeMax}`);
  console.log(`  - User age for reverse filter: ${userAge}`);
  console.log(`  - NEW: ${newCount} | STALE: ${staleCount} | FRESH (skip): ${freshCount}`);

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
  // TIER 1.5: Tag Hard Filter (Soul Fingerprint)
  // Run on ALL candidates (including FRESH) — tag filter is cheap
  // ═══════════════════════════════════════════════════════════
  let tier1_5Candidates = categorized;
  try {
    const { passesTagHardFilter, batchLoadProfileTags, loadProfileTags } = await import('./tagMatchingService');
    const userTags = await loadProfileTags(profile.id);

    if (userTags?.partnerTags) {
      const partnerPrefs = userTags.partnerTags as unknown as import('@/components/soul-fingerprint/types').PartnerTagPreferences;
      const candidateProfileIds = categorized.map((c: { profileId: string }) => c.profileId);
      const candidateTagsMap = await batchLoadProfileTags(candidateProfileIds);

      tier1_5Candidates = categorized.filter((candidate: { profileId: string }) => {
        const cTags = candidateTagsMap.get(candidate.profileId);
        if (!cTags) return true; // No tags = don't filter
        return passesTagHardFilter(partnerPrefs, cTags.sectorTags);
      });

      const filtered = categorized.length - tier1_5Candidates.length;
      if (filtered > 0) {
        console.log(`[ScanV2] Tier 1.5 Tag Filter: filtered ${filtered} candidates (sector mismatch)`);
      }
    }
  } catch (err) {
    console.warn('[ScanV2] Tier 1.5 tag filter skipped (no tags):', err);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 2 + 3: Compatibility Calculation
  // FRESH candidates are skipped — their existing score is reused
  // STALE candidates are force-rescored (override existing score)
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[ScanV2] ═══ TIER 2-3: Compatibility Calculation ═══`);

  const scoredCandidates: {
    candidate: any;
    compatibility: PairCompatibilityResult;
    profileChanged: boolean; // true → force-update stored score
  }[] = [];

  let passedCount = 0;
  let failedCount = 0;
  let freshSkipped = 0;

  // Collect FRESH above-threshold candidates to include directly (no re-scoring)
  const freshPassed = tier1_5Candidates.filter(
    (c: any) => c.scanCategory === 'FRESH' && c.spPassedThreshold === true
  );
  if (freshPassed.length > 0) {
    console.log(`[ScanV2] ⚡ ${freshPassed.length} FRESH passed-threshold candidates reused from cache`);
  }
  freshSkipped = tier1_5Candidates.filter((c: any) => c.scanCategory === 'FRESH').length;

  for (const candidate of tier1_5Candidates) {
    // Skip FRESH candidates entirely — no recalculation needed
    if (candidate.scanCategory === 'FRESH') continue;

    try {
      const compatibility = await calculatePairCompatibility(profile.id, candidate.profileId);

      if (compatibility.breakdownAtoB.dealBreakersPassed && compatibility.breakdownBtoA.dealBreakersPassed) {
        scoredCandidates.push({
          candidate,
          compatibility,
          profileChanged: candidate.scanCategory === 'STALE',
        });
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
  console.log(`  - Scored (NEW+STALE): ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log(`  - Skipped FRESH: ${freshSkipped}`);

  // מיון לפי ציון
  scoredCandidates.sort((a, b) => b.compatibility.symmetricScore - a.compatibility.symmetricScore);

  // ═══════════════════════════════════════════════════════════
  // TIER 3.5: Rejection Feedback Loop
  // Apply penalties based on user's historical rejection patterns
  // ═══════════════════════════════════════════════════════════
  try {
    const rejectionPenalties = await applyRejectionFeedbackPenalties(userId, scoredCandidates);
    if (rejectionPenalties.adjustedCount > 0) {
      console.log(`[ScanV2] Tier 3.5 Rejection Feedback: adjusted ${rejectionPenalties.adjustedCount} candidates (avg penalty: ${rejectionPenalties.avgPenalty.toFixed(1)})`);
      // Re-sort after adjustments
      scoredCandidates.sort((a, b) => b.compatibility.symmetricScore - a.compatibility.symmetricScore);
    }
  } catch (error) {
    console.warn(`[ScanV2] Rejection feedback loop skipped:`, error);
  }

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

  const matches: ScoredMatch[] = scoredCandidates.map(({ candidate, compatibility, profileChanged }) => {
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

      // ScannedPair bookkeeping
      profileChanged,
      userContentUpdatedAt,
      candidateContentUpdatedAt: candidate.contentUpdatedAt
        ? new Date(candidate.contentUpdatedAt)
        : new Date(candidate.profileUpdatedAt || Date.now()),
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
      freshSkipped,
    },
    matches,
    freshPassedCandidates: freshPassed.map((c: any) => ({ userId: c.userId, profileId: c.profileId })),
    errors,
    warnings,
  };

  console.log(`\n[ScanV2] ✅ Scan completed in ${result.durationMs}ms`);
  console.log(`${'='.repeat(60)}\n`);

  return result;
}

// ═══════════════════════════════════════════════════════════════
// REJECTION FEEDBACK LOOP
// Uses historical rejection patterns to adjust compatibility scores
// ═══════════════════════════════════════════════════════════════

// Maps rejection categories to candidate attributes that should be penalized
const REJECTION_PENALTY_MAP: Record<string, {
  check: (candidate: any, compatibility: PairCompatibilityResult) => boolean;
  penalty: number;
  label: string;
}> = {
  AGE_GAP: {
    check: (candidate, compat) => {
      // Penalize candidates at the edges of the age range
      const flags = compat.flags || [];
      return flags.some(f => f.includes('AGE')) || (candidate.candidateAge && Math.abs(candidate.candidateAge - 30) > 8);
    },
    penalty: 5,
    label: 'REJECTION_PATTERN:AGE',
  },
  RELIGIOUS_GAP: {
    check: (_candidate, compat) => {
      const flags = compat.flags || [];
      return flags.some(f => f.includes('RELIGIOUS') || f.includes('RELIG'));
    },
    penalty: 7,
    label: 'REJECTION_PATTERN:RELIGIOUS',
  },
  BACKGROUND_GAP: {
    check: (_candidate, compat) => {
      const penalties = compat.breakdownAtoB?.appliedSoftPenalties || [];
      return penalties.some((p: any) => p.type?.includes('BACKGROUND') || p.type?.includes('ETHNIC'));
    },
    penalty: 5,
    label: 'REJECTION_PATTERN:BACKGROUND',
  },
  NOT_ATTRACTED: {
    check: (_candidate, compat) => {
      const penalties = compat.breakdownAtoB?.appliedSoftPenalties || [];
      return penalties.some((p: any) =>
        p.type?.includes('BODY_TYPE') || p.type?.includes('APPEARANCE') || p.type?.includes('GROOMING')
      );
    },
    penalty: 4,
    label: 'REJECTION_PATTERN:APPEARANCE',
  },
  EDUCATION_GAP: {
    check: (candidate) => {
      return candidate.educationLevelScore !== undefined && candidate.educationLevelScore < 3;
    },
    penalty: 4,
    label: 'REJECTION_PATTERN:EDUCATION',
  },
  GEOGRAPHIC_GAP: {
    check: (_candidate, compat) => {
      const penalties = compat.breakdownAtoB?.appliedSoftPenalties || [];
      return penalties.some((p: any) => p.type?.includes('URBAN'));
    },
    penalty: 3,
    label: 'REJECTION_PATTERN:GEOGRAPHY',
  },
};

// Minimum rejections in a category to activate the penalty (prevents noise from 1-2 rejections)
const MIN_REJECTIONS_TO_ACTIVATE = 3;
// Percentage threshold — category must represent >= this % of user's total rejections
const MIN_REJECTION_PERCENTAGE = 30;

async function applyRejectionFeedbackPenalties(
  userId: string,
  scoredCandidates: { candidate: any; compatibility: PairCompatibilityResult; profileChanged: boolean }[]
): Promise<{ adjustedCount: number; avgPenalty: number }> {
  // Load rejection history for this user (rejections they MADE, not received)
  const rejectionsByUser = await prisma.rejectionFeedback.groupBy({
    by: ['category'],
    where: { rejectingUserId: userId },
    _count: { category: true },
  });

  if (rejectionsByUser.length === 0) {
    return { adjustedCount: 0, avgPenalty: 0 };
  }

  const totalRejections = rejectionsByUser.reduce((sum, r) => sum + r._count.category, 0);
  if (totalRejections < MIN_REJECTIONS_TO_ACTIVATE) {
    return { adjustedCount: 0, avgPenalty: 0 };
  }

  // Find dominant rejection patterns
  const activePatterns: { category: string; penalty: number; label: string; check: (c: any, comp: PairCompatibilityResult) => boolean }[] = [];

  for (const rej of rejectionsByUser) {
    const percentage = (rej._count.category / totalRejections) * 100;
    const penaltyConfig = REJECTION_PENALTY_MAP[rej.category];

    if (
      penaltyConfig &&
      rej._count.category >= MIN_REJECTIONS_TO_ACTIVATE &&
      percentage >= MIN_REJECTION_PERCENTAGE
    ) {
      // Scale penalty based on how dominant this pattern is (30%-100% → 1x-2x)
      const scaleFactor = 1 + (percentage - MIN_REJECTION_PERCENTAGE) / 100;
      activePatterns.push({
        category: rej.category,
        penalty: Math.round(penaltyConfig.penalty * scaleFactor),
        label: penaltyConfig.label,
        check: penaltyConfig.check,
      });
    }
  }

  if (activePatterns.length === 0) {
    return { adjustedCount: 0, avgPenalty: 0 };
  }

  console.log(`[ScanV2] Rejection patterns found: ${activePatterns.map(p => `${p.category}(-${p.penalty})`).join(', ')}`);

  let adjustedCount = 0;
  let totalPenalty = 0;

  for (const entry of scoredCandidates) {
    let pairPenalty = 0;

    for (const pattern of activePatterns) {
      if (pattern.check(entry.candidate, entry.compatibility)) {
        pairPenalty += pattern.penalty;
      }
    }

    if (pairPenalty > 0) {
      // Cap penalty at 15 points to avoid over-penalizing
      pairPenalty = Math.min(pairPenalty, 15);

      // Mutate the compatibility scores to reflect the penalty
      entry.compatibility = {
        ...entry.compatibility,
        symmetricScore: Math.max(0, entry.compatibility.symmetricScore - pairPenalty),
        scoreAtoB: Math.max(0, entry.compatibility.scoreAtoB - pairPenalty),
        flags: [...entry.compatibility.flags, ...activePatterns.filter(p => p.check(entry.candidate, entry.compatibility)).map(p => p.label)],
      };

      adjustedCount++;
      totalPenalty += pairPenalty;
    }
  }

  return {
    adjustedCount,
    avgPenalty: adjustedCount > 0 ? totalPenalty / adjustedCount : 0,
  };
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

  const STALE_THRESHOLD_HOURS = 2;
  // כולל בדיקת ProfileTags (טביעת נשמה) — אם עודכן מאז הוקטורים → stale
  const candidatesNeedingUpdate = await prisma.$queryRaw<{ profileId: string; firstName: string; reason: string }[]>`
    SELECT
      p.id as "profileId",
      u."firstName",
      CASE
        WHEN pm.id IS NULL OR pv.id IS NULL OR pv."selfVector" IS NULL OR pv."seekingVector" IS NULL
          THEN 'missing'
        WHEN GREATEST(
               p."updatedAt",
               COALESCE(qr."updatedAt", p."updatedAt"),
               COALESCE(pt."updatedAt", p."updatedAt")
             ) > pv."updatedAt" + INTERVAL '${STALE_THRESHOLD_HOURS} hours'
          THEN 'stale'
        ELSE 'ok'
      END as reason
    FROM "Profile" p
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics"       pm ON pm."profileId" = p.id
    LEFT JOIN "profile_vectors"       pv ON pv."profileId" = p.id
    LEFT JOIN "QuestionnaireResponse" qr ON qr."profileId" = p.id
    LEFT JOIN "ProfileTags"           pt ON pt."profileId" = p.id
    WHERE
      p.gender = ${oppositeGender}::"Gender"
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND (
        pm.id IS NULL
        OR pv.id IS NULL
        OR pv."selfVector" IS NULL
        OR pv."seekingVector" IS NULL
        OR GREATEST(
             p."updatedAt",
             COALESCE(qr."updatedAt", p."updatedAt"),
             COALESCE(pt."updatedAt", p."updatedAt")
           ) > pv."updatedAt" + INTERVAL '${STALE_THRESHOLD_HOURS} hours'
      )
    ORDER BY p."updatedAt" DESC
    LIMIT ${maxToUpdate}
  `;

  if (candidatesNeedingUpdate.length === 0) {
    console.log(`[ScanV2] All candidates have up-to-date metrics/vectors ✓`);
    return { updated: 0, failed: 0 };
  }

  const missingCount = candidatesNeedingUpdate.filter(c => c.reason === 'missing').length;
  const staleCount = candidatesNeedingUpdate.filter(c => c.reason === 'stale').length;
  console.log(`[ScanV2] Found ${candidatesNeedingUpdate.length} candidates needing update (${missingCount} missing, ${staleCount} stale)`);

  let updated = 0;
  let failed = 0;

  // Run updates in parallel batches of 5 (instead of serial with 200ms sleep)
  const PARALLEL_BATCH_SIZE = 5;
  for (let i = 0; i < candidatesNeedingUpdate.length; i += PARALLEL_BATCH_SIZE) {
    const batch = candidatesNeedingUpdate.slice(i, i + PARALLEL_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(candidate => updateProfileVectorsAndMetrics(candidate.profileId))
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === 'fulfilled') {
        updated++;
      } else {
        failed++;
        console.error(`[ScanV2] Failed to update ${batch[j].firstName}:`, (results[j] as PromiseRejectedResult).reason);
      }
    }
  }

  console.log(`[ScanV2] Metrics update: ${updated} success, ${failed} failed (parallel batches of ${PARALLEL_BATCH_SIZE})`);
  return { updated, failed };
}

// ═══════════════════════════════════════════════════════════════
// AI DEEP ANALYSIS - 🆕 מעודכן עם סיכומים חדשים
// ═══════════════════════════════════════════════════════════════

async function performAIDeepAnalysis(
  userProfile: any,
  userMetrics: any,
  candidates: { candidate: any; compatibility: PairCompatibilityResult; profileChanged?: boolean }[]
): Promise<Map<string, any>> {
  const results = new Map<string, any>();

  // ═══ AI CACHING: Load existing PotentialMatch records to reuse cached AI analysis ═══
  const isMale = userProfile.gender === Gender.MALE;
  const candidateUserIds = candidates.map(c => c.candidate.userId);

  let cachedAnalyses: Map<string, { aiScore: number; reasoning: string | null; profileId: string }> = new Map();
  try {
    const existingMatches = await prisma.potentialMatch.findMany({
      where: isMale
        ? { maleUserId: userProfile.userId, femaleUserId: { in: candidateUserIds } }
        : { femaleUserId: userProfile.userId, maleUserId: { in: candidateUserIds } },
      select: {
        maleUserId: true,
        femaleUserId: true,
        metricsV2Score: true,
        metricsV2Reasoning: true,
        metricsV2ScannedAt: true,
        shortReasoning: true,
        aiScore: true,
      },
    });

    for (const match of existingMatches) {
      const candidateUserId = isMale ? match.femaleUserId : match.maleUserId;
      if (match.metricsV2Reasoning && match.metricsV2Score) {
        cachedAnalyses.set(candidateUserId, {
          aiScore: match.metricsV2Score,
          reasoning: match.metricsV2Reasoning,
          profileId: candidateUserId,
        });
      }
    }
    if (cachedAnalyses.size > 0) {
      console.log(`[AI] Found ${cachedAnalyses.size} cached AI analyses from previous scans`);
    }
  } catch (error) {
    console.warn(`[AI] Failed to load cached analyses:`, error);
  }

  // Determine which candidates need fresh AI analysis vs can reuse cache
  const AI_SCORE_DELTA_THRESHOLD = 5; // Reuse cache if metrics score changed by less than this
  const needsAI: typeof candidates = [];
  let cacheHits = 0;

  for (const entry of candidates) {
    const cached = cachedAnalyses.get(entry.candidate.userId);
    // Reuse cached AI analysis if:
    // 1. Profile hasn't changed (not STALE)
    // 2. Metrics score is within threshold of previous score
    // 3. Cached reasoning exists
    if (
      cached?.reasoning &&
      !entry.profileChanged &&
      Math.abs(entry.compatibility.symmetricScore - cached.aiScore) <= AI_SCORE_DELTA_THRESHOLD
    ) {
      // Parse cached reasoning back into analysis format
      results.set(entry.candidate.profileId, {
        score: cached.aiScore,
        reasoning: cached.reasoning,
        strengths: [],
        concerns: [],
        _cached: true,
      });
      cacheHits++;
    } else {
      needsAI.push(entry);
    }
  }

  if (cacheHits > 0) {
    console.log(`[AI] ⚡ Reused ${cacheHits} cached analyses, ${needsAI.length} need fresh Gemini calls`);
  }

  if (needsAI.length === 0) return results;

  const userDetails = await fetchProfileDetailsForAI(userProfile.id);

  const batchSize = 5;

  for (let i = 0; i < needsAI.length; i += batchSize) {
    const batch = needsAI.slice(i, i + batchSize);

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

    if (i + batchSize < needsAI.length) {
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

// 🆕 הנחיות מותאמות סקטור
function getSectorGuidance(religiousLevel: string | undefined): string {
  if (!religiousLevel) return '';
  const level = religiousLevel.toLowerCase();
  if (level.startsWith('charedi') || level === 'chabad' || level === 'breslov') {
    return `\n## הנחיות סקטוריאליות:\nשים דגש על התאמת משפחות (יחוס), מחויבות ללימוד תורה, תאימות קהילתית. מראה חיצוני וקריירה משניים יחסית. חשוב לבדוק רמת צניעות ושמירת מצוות.\n`;
  }
  if (level.startsWith('dati_leumi')) {
    return `\n## הנחיות סקטוריאליות:\nאזן בין צמיחה דתית, שאיפות מקצועיות, ותאימות אישית. התאמת השקפת עולם (תורנית/ליברלית) היא מפתח. שילוב שירות צבאי/לאומי ותפיסת חיים רלוונטיים.\n`;
  }
  if (level.startsWith('masorti')) {
    return `\n## הנחיות סקטוריאליות:\nבדוק תאימות ברמת שמירת מסורת (שבת, כשרות, חגים). התמקד בערכים משותפים, תאימות אורח חיים, וגמישות דתית הדדית.\n`;
  }
  // hiloni / secular / spiritual
  return `\n## הנחיות סקטוריאליות:\nהתמקד בתאימות אורח חיים, ערכים משותפים, כימיה אישית, ומטרות חיים. פחות רלוונטי לבדוק התאמה דתית-הלכתית.\n`;
}

// 🆕 פרומפט מעודכן עם סיכומים חדשים + הנחיות סקטוריאליות
async function analyzeMatchWithAI(
  userDetails: any,
  candidateDetails: any,
  compatibility: PairCompatibilityResult
): Promise<any> {
  const sectorGuidance = getSectorGuidance(userDetails.religiousLevel);
  const prompt = `אתה שדכן מומחה. נתח את ההתאמה בין שני הפרופילים הבאים.
${sectorGuidance}

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

// scanSingleUserV2.ts - פונקציה saveScanResults (בסוף הקובץ)

export async function saveScanResults(result: ScanResult, scanSessionId?: string): Promise<number> {
  const userProfile = await prisma.profile.findFirst({
    where: { userId: result.userId },
  });

  if (!userProfile) {
    console.error(`[ScanV2] Cannot save - profile not found for user: ${result.userId}`);
    return 0;
  }

  const isMale = userProfile.gender === Gender.MALE;
  const matchesToSave = result.matches.filter(m => m.symmetricScore >= MIN_SCORE_TO_SAVE);

  console.log(`[ScanV2] Saving to DB: ${matchesToSave.length} matches`);

  let savedCount = 0;
  let updatedCount = 0;

  for (const match of matchesToSave) {
    const maleUserId = isMale ? result.userId : match.candidateUserId;
    const femaleUserId = isMale ? match.candidateUserId : result.userId;

    // 🆕 יצירת scoreBreakdown מהמדדים
    const generatedBreakdown = {
      religious: Math.round((match.metricsScore || 70) * 0.25),
      ageCompatibility: 8,
      careerFamily: Math.round((match.metricsScore || 70) * 0.15),
      lifestyle: Math.round((match.metricsScore || 70) * 0.10),
      socioEconomic: match.candidateBackground?.socioEconomicLevel || 5,
      education: match.candidateBackground?.educationLevelScore || 5,
      background: 5,
      values: Math.round((match.metricsScore || 70) * 0.10),
    };

    try {
      const existing = await prisma.potentialMatch.findFirst({
        where: { maleUserId, femaleUserId },
      });

      if (existing) {
        // If profile changed (STALE), replace score regardless of value (old score is stale).
        // Otherwise only update if new score is better.
        const forceUpdate = match.profileChanged === true;
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            ...(forceUpdate || match.symmetricScore > existing.aiScore ? {
              aiScore: match.symmetricScore,
              shortReasoning: match.aiAnalysis?.reasoning || null,
              lastScanMethod: 'metrics_v2',
            } : {}),
            ...(forceUpdate || match.symmetricScore > (existing.metricsV2Score || 0) ? {
              metricsV2Score: match.symmetricScore,
              metricsV2Reasoning: match.aiAnalysis?.reasoning || null,
              metricsV2ScoreBreakdown: generatedBreakdown,
            } : {}),
            metricsV2ScannedAt: new Date(),
            firstPassScore: match.metricsScore,
            scannedAt: new Date(),
            scoreForMale: isMale ? match.scoreForUser : match.scoreForCandidate,
            scoreForFemale: isMale ? match.scoreForCandidate : match.scoreForUser,
            asymmetryGap: Math.abs(match.scoreForUser - match.scoreForCandidate),
            ...(scanSessionId ? { scanSessionId } : {}),
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

            // 🆕 שדות ספציפיים ל-Metrics V2
            metricsV2Score: match.symmetricScore,
            metricsV2Reasoning: match.aiAnalysis?.reasoning || null,
            metricsV2ScannedAt: new Date(),
            metricsV2ScoreBreakdown: generatedBreakdown,
            lastScanMethod: 'metrics_v2',
            ...(scanSessionId ? { scanSessionId } : {}),
          },
        });
        savedCount++;
      }
    } catch (error) {
      console.error(`[ScanV2] Failed to save match for ${match.candidateName}:`, error);
    }

    // Always upsert ScannedPair — records that this pair was evaluated and what the profiles looked like
    try {
      const maleContentAt = isMale
        ? (match.userContentUpdatedAt ?? new Date())
        : (match.candidateContentUpdatedAt ?? new Date());
      const femaleContentAt = isMale
        ? (match.candidateContentUpdatedAt ?? new Date())
        : (match.userContentUpdatedAt ?? new Date());
      await prisma.scannedPair.upsert({
        where: { maleUserId_femaleUserId: { maleUserId, femaleUserId } },
        create: {
          maleUserId,
          femaleUserId,
          aiScore: match.symmetricScore,
          passedThreshold: match.symmetricScore >= MIN_SCORE_TO_SAVE,
          firstScannedAt: new Date(),
          lastScannedAt: new Date(),
          maleProfileUpdatedAt: maleContentAt,
          femaleProfileUpdatedAt: femaleContentAt,
        },
        update: {
          aiScore: match.symmetricScore,
          passedThreshold: match.symmetricScore >= MIN_SCORE_TO_SAVE,
          lastScannedAt: new Date(),
          maleProfileUpdatedAt: maleContentAt,
          femaleProfileUpdatedAt: femaleContentAt,
        },
      });
    } catch (spError) {
      // Non-critical — don't fail the whole save if ScannedPair upsert fails
      console.warn(`[ScanV2] ScannedPair upsert failed for ${match.candidateName}:`, spError);
    }
  }

  // Also upsert ScannedPair for FRESH pairs that passed threshold (so lastScannedAt stays current)
  // This prevents them from being treated as "never scanned" by other services
  if (result.freshPassedCandidates?.length) {
    for (const fc of result.freshPassedCandidates) {
      try {
        const maleUserId2 = isMale ? result.userId : fc.userId;
        const femaleUserId2 = isMale ? fc.userId : result.userId;
        await prisma.scannedPair.update({
          where: { maleUserId_femaleUserId: { maleUserId: maleUserId2, femaleUserId: femaleUserId2 } },
          data: { lastScannedAt: new Date() },
        });
      } catch { /* ignore */ }
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