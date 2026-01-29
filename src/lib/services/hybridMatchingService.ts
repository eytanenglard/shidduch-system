// ============================================================
// NeshamaTech - Hybrid Matching Service V1.0
// src/lib/services/hybridMatchingService.ts
// 
// משלב את היתרונות של:
// - scanSingleUserV2: יעילות SQL, metrics, vectors
// - matchingAlgorithmService: ניתוח רקע, AI עמוק, cache
// ============================================================

import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus, MatchSuggestionStatus, PotentialMatchStatus } from "@prisma/client";
import { GoogleGenerativeAI } from '@google/generative-ai';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

// --- Background Types (מ-matchingAlgorithmService) ---
export type BackgroundCategory = 
  | 'sabra'
  | 'sabra_international'
  | 'oleh_veteran'
  | 'oleh_mid'
  | 'oleh_new';

export interface BackgroundProfile {
  category: BackgroundCategory;
  confidence: number;
  nativeLanguage: string | null;
  additionalLanguages: string[];
  aliyaCountry: string | null;
  aliyaYear: number | null;
  yearsInIsrael: number | null;
  textLanguage: 'hebrew' | 'english' | 'mixed' | 'other';
  hebrewQuality: 'native' | 'strong' | 'moderate' | 'weak' | 'none';
  indicators: string[];
}

export interface BackgroundMatchResult {
  multiplier: number;
  compatibility: 'excellent' | 'good' | 'possible' | 'problematic' | 'not_recommended';
  bonusPoints: number;
  reasoning: string;
}

export interface AgeScoreResult {
  score: number;
  eligible: boolean;
  description: string;
}

// --- Score Breakdown (מ-matchingAlgorithmService) ---
export interface ScoreBreakdown {
  religious: number;      // /30
  ageCompatibility: number; // /10
  careerFamily: number;   // /15
  lifestyle: number;      // /13
  ambition: number;       // /11
  communication: number;  // /11
  values: number;         // /10
}

// --- Scan Options ---
export interface HybridScanOptions {
  // Tier controls
  maxTier1Candidates?: number;      // ברירת מחדל: 300
  maxTier2Candidates?: number;      // ברירת מחדל: 50
  maxTier3Candidates?: number;      // ברירת מחדל: 20
  topForDeepAnalysis?: number;      // ברירת מחדל: 15
  
  // Feature flags
  useVectors?: boolean;             // ברירת מחדל: true
  useBackgroundAnalysis?: boolean;  // ברירת מחדל: true
  useAIFirstPass?: boolean;         // ברירת מחדל: true
  useAIDeepAnalysis?: boolean;      // ברירת מחדל: true
  
  // Thresholds
  minScoreToSave?: number;          // ברירת מחדל: 65
  minScoreForAI?: number;           // ברירת מחדל: 50
  
  // Behavior
  forceRefresh?: boolean;           // דלג על cache
  forceUpdateMetrics?: boolean;     // עדכן metrics גם אם קיימים
  skipCandidateMetricsUpdate?: boolean;
  autoSave?: boolean;               // ברירת מחדל: true
}

// --- Candidate Data (Internal) ---
interface RawCandidate {
  profileId: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: Date | null;
  age: number | null;
  city: string | null;
  religiousLevel: string | null;
  occupation: string | null;
  about: string | null;
  
  // From metrics
  confidenceScore: number | null;
  religiousStrictness: number | null;
  socialEnergy: number | null;
  careerOrientation: number | null;
  urbanScore: number | null;
  socioEconomicLevel: number | null;
  jobSeniorityLevel: number | null;
  educationLevelScore: number | null;
  
  // Inferred values
  inferredAge: number | null;
  inferredCity: string | null;
  inferredReligiousLevel: string | null;
  inferredPreferredAgeMin: number | null;
  inferredPreferredAgeMax: number | null;
  
  // AI summaries
  aiPersonalitySummary: string | null;
  aiSeekingSummary: string | null;
  aiBackgroundSummary: string | null;
  
  // For background analysis
  nativeLanguage: string | null;
  additionalLanguages: string[];
  aliyaCountry: string | null;
  aliyaYear: number | null;
  origin: string | null;
  matchingNotes: string | null;
  
  // Profile dates
  profileUpdatedAt: Date;
}

interface ScoredCandidate extends RawCandidate {
  // Computed scores
  metricsScore: number;
  vectorScore: number | null;
  backgroundProfile: BackgroundProfile | null;
  backgroundMatch: BackgroundMatchResult | null;
  ageScore: AgeScoreResult | null;
  
  // Combined Tier 2 score
  tier2Score: number;
}

interface AIFirstPassCandidate extends ScoredCandidate {
  aiFirstPassScore: number;
  scoreBreakdown: ScoreBreakdown;
  shortReasoning: string;
  
  // Combined score after AI
  tier3Score: number;
}

interface FinalCandidate extends AIFirstPassCandidate {
  finalScore: number;
  rank: number;
  detailedReasoning: string;
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

// --- Scan Result ---
export interface HybridScanResult {
  userId: string;
  profileId: string;
  scanStartedAt: Date;
  scanCompletedAt: Date;
  durationMs: number;
  
  tiers: {
    tier1: { input: number; output: number; durationMs: number };
    tier2: { input: number; output: number; durationMs: number };
    tier3: { input: number; output: number; durationMs: number };
    tier4: { input: number; output: number; durationMs: number };
  };
  
  stats: {
    totalCandidatesScanned: number;
    passedFilters: number;
    aiAnalyzed: number;
    deepAnalyzed: number;
    savedToDb: number;
    fromCache: boolean;
  };
  
  matches: FinalCandidate[];
  warnings: string[];
  errors: string[];
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CURRENT_YEAR = new Date().getFullYear();
const STALE_DAYS = 7;
const AI_BATCH_SIZE = 20;

// Religious level ordering for compatibility
const RELIGIOUS_LEVEL_ORDER: string[] = [
  'charedi_hasidic', 'charedi_litvak', 'charedi_sephardic', 'chabad', 'breslov',
  'charedi_modern', 'dati_leumi_torani', 'dati_leumi_standard', 'dati_leumi_liberal',
  'masorti_strong', 'masorti_light', 'secular_traditional_connection', 'secular',
  'spiritual_not_religious', 'other'
];

// Background compatibility matrix
const BACKGROUND_MATRIX: Record<BackgroundCategory, Record<BackgroundCategory, number>> = {
  sabra: { sabra: 1.0, sabra_international: 1.0, oleh_veteran: 0.85, oleh_mid: 0.4, oleh_new: 0.15 },
  sabra_international: { sabra: 1.0, sabra_international: 1.0, oleh_veteran: 1.0, oleh_mid: 0.85, oleh_new: 0.6 },
  oleh_veteran: { sabra: 0.85, sabra_international: 1.0, oleh_veteran: 1.0, oleh_mid: 0.85, oleh_new: 0.6 },
  oleh_mid: { sabra: 0.4, sabra_international: 0.85, oleh_veteran: 0.85, oleh_mid: 1.0, oleh_new: 0.85 },
  oleh_new: { sabra: 0.15, sabra_international: 0.6, oleh_veteran: 0.6, oleh_mid: 0.85, oleh_new: 1.0 },
};

// Blocking statuses
const BLOCKING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
  'ENDED_AFTER_FIRST_DATE', 'MATCH_DECLINED', 'FIRST_PARTY_DECLINED',
  'SECOND_PARTY_DECLINED', 'CLOSED', 'CANCELLED', 'EXPIRED',
];

const BLOCKING_POTENTIAL_MATCH_STATUSES: PotentialMatchStatus[] = ['DISMISSED'];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Age
// ═══════════════════════════════════════════════════════════════

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function calculateAgeScore(maleAge: number, femaleAge: number): AgeScoreResult {
  const ageDiff = maleAge - femaleAge;
  
  // אידיאלי: בן גדול ב-0-3 שנים
  if (ageDiff >= 0 && ageDiff <= 3) {
    return { 
      score: 100, 
      eligible: true,
      description: ageDiff === 0 ? 'אותו גיל' : `הבן גדול ב-${ageDiff} שנים - אידיאלי`
    };
  }
  
  // בן גדול ב-4-7 שנים
  if (ageDiff > 3 && ageDiff <= 7) {
    const score = 100 - ((ageDiff - 3) * 8);
    return { score: Math.round(score), eligible: true, description: `הבן גדול ב-${ageDiff} שנים` };
  }
  
  // בן גדול ב-8+ שנים - לא מתאים
  if (ageDiff > 7) {
    return { score: 0, eligible: false, description: `פער גדול מדי (${ageDiff} שנים)` };
  }
  
  // בת גדולה
  const femaleOlder = Math.abs(ageDiff);
  if (femaleOlder === 1) return { score: 80, eligible: true, description: 'הבת גדולה בשנה' };
  if (femaleOlder === 2) return { score: 65, eligible: true, description: 'הבת גדולה ב-2 שנים' };
  if (femaleOlder === 3) return { score: 45, eligible: true, description: 'הבת גדולה ב-3 שנים' };
  if (femaleOlder === 4) return { score: 25, eligible: true, description: 'הבת גדולה ב-4 שנים' };
  
  return { score: 0, eligible: false, description: `הבת גדולה ב-${femaleOlder} שנים - לא רלוונטי` };
}

function calculateAgeScoreForMatch(
  targetAge: number,
  targetGender: Gender,
  candidateAge: number
): AgeScoreResult {
  if (targetGender === 'MALE') {
    return calculateAgeScore(targetAge, candidateAge);
  } else {
    return calculateAgeScore(candidateAge, targetAge);
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Religious Level
// ═══════════════════════════════════════════════════════════════

function getCompatibleReligiousLevels(level: string | null): string[] {
  if (!level) return RELIGIOUS_LEVEL_ORDER;
  const index = RELIGIOUS_LEVEL_ORDER.indexOf(level);
  if (index === -1) return RELIGIOUS_LEVEL_ORDER;
  const minIndex = Math.max(0, index - 3);
  const maxIndex = Math.min(RELIGIOUS_LEVEL_ORDER.length - 1, index + 3);
  return RELIGIOUS_LEVEL_ORDER.slice(minIndex, maxIndex + 1);
}

function getReligiousCompatibilityScore(level1: string | null, level2: string | null): number {
  if (!level1 || !level2) return 70; // ניטרלי אם חסר מידע
  
  const idx1 = RELIGIOUS_LEVEL_ORDER.indexOf(level1);
  const idx2 = RELIGIOUS_LEVEL_ORDER.indexOf(level2);
  
  if (idx1 === -1 || idx2 === -1) return 70;
  
  const distance = Math.abs(idx1 - idx2);
  
  if (distance === 0) return 100;
  if (distance === 1) return 90;
  if (distance === 2) return 75;
  if (distance === 3) return 55;
  return 30; // רחוק מדי
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Background Analysis
// ═══════════════════════════════════════════════════════════════

function analyzeTextLanguage(text: string | null | undefined): {
  language: 'hebrew' | 'english' | 'mixed' | 'other';
  hebrewQuality: 'native' | 'strong' | 'moderate' | 'weak' | 'none';
} {
  if (!text || text.trim().length === 0) {
    return { language: 'other', hebrewQuality: 'none' };
  }

  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = hebrewChars + latinChars;
  
  if (totalChars === 0) return { language: 'other', hebrewQuality: 'none' };

  const hebrewRatio = hebrewChars / totalChars;
  
  let language: 'hebrew' | 'english' | 'mixed' | 'other';
  if (hebrewRatio > 0.8) language = 'hebrew';
  else if (hebrewRatio < 0.2) language = 'english';
  else language = 'mixed';

  let hebrewQuality: 'native' | 'strong' | 'moderate' | 'weak' | 'none';
  if (language === 'english') {
    hebrewQuality = 'none';
  } else if (language === 'hebrew' && text.length > 100) {
    hebrewQuality = 'native';
  } else if (language === 'hebrew') {
    hebrewQuality = 'strong';
  } else {
    hebrewQuality = hebrewRatio > 0.5 ? 'moderate' : 'weak';
  }

  return { language, hebrewQuality };
}

function createBackgroundProfile(
  nativeLanguage: string | null,
  additionalLanguages: string[],
  aliyaCountry: string | null,
  aliyaYear: number | null,
  origin: string | null,
  aboutText: string | null,
  matchingNotes: string | null
): BackgroundProfile {
  const indicators: string[] = [];
  const textAnalysis = analyzeTextLanguage([aboutText, matchingNotes].filter(Boolean).join(' '));
  
  let yearsInIsrael: number | null = null;
  if (aliyaYear) {
    yearsInIsrael = CURRENT_YEAR - aliyaYear;
    indicators.push(`aliyah: ${aliyaYear} (${yearsInIsrael}y)`);
  }
  
  const hebrewAsNative = nativeLanguage?.toLowerCase() === 'hebrew' || 
                         nativeLanguage?.toLowerCase() === 'עברית';
  const noAliyaInfo = !aliyaCountry && !aliyaYear;
  const originIsrael = !origin || origin.toLowerCase() === 'israel' || origin === 'ישראל';
  
  let category: BackgroundCategory;
  let confidence: number;
  
  if (hebrewAsNative && noAliyaInfo && originIsrael && textAnalysis.hebrewQuality === 'native') {
    category = 'sabra';
    confidence = 0.95;
  } else if (hebrewAsNative && (additionalLanguages.length > 0 || !originIsrael)) {
    category = 'sabra_international';
    confidence = 0.85;
  } else if (yearsInIsrael !== null) {
    if (yearsInIsrael >= 10) { category = 'oleh_veteran'; confidence = 0.9; }
    else if (yearsInIsrael >= 3) { category = 'oleh_mid'; confidence = 0.9; }
    else { category = 'oleh_new'; confidence = 0.9; }
  } else if (textAnalysis.language === 'english' && textAnalysis.hebrewQuality === 'none') {
    category = 'oleh_new';
    confidence = 0.7;
  } else if (textAnalysis.language === 'english' || textAnalysis.hebrewQuality === 'weak') {
    category = 'oleh_mid';
    confidence = 0.6;
  } else {
    category = 'sabra_international';
    confidence = 0.4;
  }
  
  return {
    category, confidence, nativeLanguage, additionalLanguages,
    aliyaCountry, aliyaYear, yearsInIsrael,
    textLanguage: textAnalysis.language,
    hebrewQuality: textAnalysis.hebrewQuality,
    indicators,
  };
}

function calculateBackgroundMatch(
  targetProfile: BackgroundProfile,
  candidateProfile: BackgroundProfile
): BackgroundMatchResult {
  let multiplier = BACKGROUND_MATRIX[targetProfile.category][candidateProfile.category];
  let bonusPoints = 0;
  const reasons: string[] = [];
  
  // בונוס שפת אם זהה (לא עברית)
  if (targetProfile.nativeLanguage && 
      candidateProfile.nativeLanguage &&
      targetProfile.nativeLanguage.toLowerCase() === candidateProfile.nativeLanguage.toLowerCase() &&
      !['hebrew', 'עברית'].includes(targetProfile.nativeLanguage.toLowerCase())) {
    bonusPoints += 15;
    multiplier = Math.min(1.25, multiplier + 0.15);
    reasons.push(`same native: ${targetProfile.nativeLanguage}`);
  }
  
  // בונוס שפה משותפת
  const commonLangs = targetProfile.additionalLanguages.filter(
    lang => candidateProfile.additionalLanguages.includes(lang) ||
            candidateProfile.nativeLanguage?.toLowerCase() === lang.toLowerCase()
  );
  if (commonLangs.length > 0) {
    bonusPoints += 8;
    multiplier = Math.min(1.25, multiplier + 0.08);
  }
  
  // בונוס ארץ מוצא זהה
  if (targetProfile.aliyaCountry && candidateProfile.aliyaCountry &&
      targetProfile.aliyaCountry.toLowerCase() === candidateProfile.aliyaCountry.toLowerCase()) {
    bonusPoints += 10;
    multiplier = Math.min(1.25, multiplier + 0.1);
  }
  
  let compatibility: BackgroundMatchResult['compatibility'];
  if (multiplier >= 0.95) compatibility = 'excellent';
  else if (multiplier >= 0.8) compatibility = 'good';
  else if (multiplier >= 0.55) compatibility = 'possible';
  else if (multiplier >= 0.3) compatibility = 'problematic';
  else compatibility = 'not_recommended';
  
  return { multiplier, compatibility, bonusPoints, reasoning: reasons.join('; ') };
}

// ═══════════════════════════════════════════════════════════════
// TIER 0: READINESS CHECK
// ═══════════════════════════════════════════════════════════════

async function ensureUserReady(profileId: string, forceUpdate: boolean = false): Promise<{
  metricsExist: boolean;
  vectorsExist: boolean;
  updated: boolean;
}> {
  const [metricsResult, vectorsResult] = await Promise.all([
    prisma.$queryRaw<any[]>`SELECT 1 FROM "profile_metrics" WHERE "profileId" = ${profileId} LIMIT 1`,
    prisma.$queryRaw<any[]>`SELECT 1 FROM "profile_vectors" WHERE "profileId" = ${profileId} AND "selfVector" IS NOT NULL LIMIT 1`,
  ]);
  
  const metricsExist = metricsResult.length > 0;
  const vectorsExist = vectorsResult.length > 0;
  
  if ((!metricsExist || !vectorsExist || forceUpdate)) {
    try {
      // Import dynamically to avoid circular deps
      const { updateProfileVectorsAndMetrics } = await import('./dualVectorService');
      await updateProfileVectorsAndMetrics(profileId);
      return { metricsExist: true, vectorsExist: true, updated: true };
    } catch (error) {
      console.error(`[Hybrid] Failed to update metrics for ${profileId}:`, error);
      return { metricsExist, vectorsExist, updated: false };
    }
  }
  
  return { metricsExist, vectorsExist, updated: false };
}

// ═══════════════════════════════════════════════════════════════
// TIER 1: SQL FILTERING
// ═══════════════════════════════════════════════════════════════

async function tier1SqlFilter(
  userId: string,
  profileId: string,
  userGender: Gender,
  userAge: number,
  userReligiousLevel: string | null,
  preferredAgeMin: number,
  preferredAgeMax: number,
  maxCandidates: number
): Promise<RawCandidate[]> {
  const oppositeGender = userGender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
  
  const candidates = await prisma.$queryRaw<RawCandidate[]>`
    SELECT 
      p.id as "profileId",
      p."userId",
      u."firstName",
      u."lastName",
      p.gender,
      p."birthDate",
      p.city,
      p."religiousLevel",
      p.occupation,
      p.about,
      p."nativeLanguage",
      p."additionalLanguages",
      p."aliyaCountry",
      p."aliyaYear",
      p.origin,
      p."matchingNotes",
      p."updatedAt" as "profileUpdatedAt",
      
      -- Metrics
      pm."confidenceScore",
      pm."religiousStrictness",
      pm."socialEnergy",
      pm."careerOrientation",
      pm."urbanScore",
      pm."socioEconomicLevel",
      pm."jobSeniorityLevel",
      pm."educationLevelScore",
      
      -- Inferred
      pm."inferredAge",
      pm."inferredCity",
      pm."inferredReligiousLevel",
      pm."inferredPreferredAgeMin",
      pm."inferredPreferredAgeMax",
      
      -- AI Summaries
      pm."aiPersonalitySummary",
      pm."aiSeekingSummary",
      pm."aiBackgroundSummary",
      
      -- Computed age with fallback
      COALESCE(
        EXTRACT(YEAR FROM AGE(p."birthDate"))::int,
        pm."inferredAge"
      ) as "age"
      
    FROM "Profile" p 
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    
    WHERE 
      -- מגדר הפוך
      p.gender = ${oppositeGender}::"Gender"
      
      -- סטטוס פעיל (כולל MANUAL_ENTRY)
      AND (
        u.status = 'ACTIVE'
        OR (u.status = 'PENDING_EMAIL_VERIFICATION' AND u.source = 'MANUAL_ENTRY')
      )
      
      -- זמין ונראה
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND p.id != ${profileId}
      
      -- סינון גיל: המועמד בטווח שהיוזר מחפש
      AND COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") >= ${preferredAgeMin}
      AND COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") <= ${preferredAgeMax}
      
      -- סינון גיל הפוך: היוזר בטווח שהמועמד מחפש
      AND (
        COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin") IS NULL 
        OR ${userAge} >= COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin")
      )
      AND (
        COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax") IS NULL 
        OR ${userAge} <= COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax")
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
            'FIRST_PARTY_DECLINED', 'SECOND_PARTY_DECLINED', 
            'CLOSED', 'CANCELLED', 'ENDED_AFTER_FIRST_DATE', 'MATCH_DECLINED'
          )
      )
      
    ORDER BY pm."confidenceScore" DESC NULLS LAST
    LIMIT ${maxCandidates}
  `;

  return candidates;
}

// ═══════════════════════════════════════════════════════════════
// TIER 2: METRICS + BACKGROUND SCORING
// ═══════════════════════════════════════════════════════════════

async function tier2MetricsScoring(
  candidates: RawCandidate[],
  targetProfile: {
    age: number;
    gender: Gender;
    religiousLevel: string | null;
    backgroundProfile: BackgroundProfile;
    metricsScore?: number;
    socialEnergy?: number;
    careerOrientation?: number;
    urbanScore?: number;
  },
  useVectors: boolean,
  useBackgroundAnalysis: boolean,
  maxOutput: number
): Promise<ScoredCandidate[]> {
  
  const scoredCandidates: ScoredCandidate[] = [];
  
  for (const candidate of candidates) {
    // 1. Age Score
    const candidateAge = candidate.age || candidate.inferredAge || 30;
    const ageScore = calculateAgeScoreForMatch(targetProfile.age, targetProfile.gender, candidateAge);
    
    if (!ageScore.eligible) continue; // סנן מועמדים עם פער גיל גדול מדי
    
    // 2. Religious Compatibility
    const candidateReligious = candidate.religiousLevel || candidate.inferredReligiousLevel;
    const religiousScore = getReligiousCompatibilityScore(targetProfile.religiousLevel, candidateReligious);
    
    // 3. Background Analysis
    let backgroundProfile: BackgroundProfile | null = null;
    let backgroundMatch: BackgroundMatchResult | null = null;
    
    if (useBackgroundAnalysis) {
      backgroundProfile = createBackgroundProfile(
        candidate.nativeLanguage,
        candidate.additionalLanguages || [],
        candidate.aliyaCountry,
        candidate.aliyaYear,
        candidate.origin,
        candidate.about,
        candidate.matchingNotes
      );
      backgroundMatch = calculateBackgroundMatch(targetProfile.backgroundProfile, backgroundProfile);
    }
    
    // 4. Metrics similarity
    let metricsScore = 50; // baseline
    
    if (candidate.confidenceScore) {
      // Weight different metrics
      const weights = {
        religious: 0.3,
        social: 0.2,
        career: 0.2,
        urban: 0.15,
        age: 0.15,
      };
      
      metricsScore = (
        religiousScore * weights.religious +
        (100 - Math.abs((targetProfile.socialEnergy || 50) - (candidate.socialEnergy || 50))) * weights.social +
        (100 - Math.abs((targetProfile.careerOrientation || 50) - (candidate.careerOrientation || 50)) * 2) * weights.career +
        (100 - Math.abs((targetProfile.urbanScore || 50) - (candidate.urbanScore || 50))) * weights.urban +
        ageScore.score * weights.age
      );
    }
    
    // 5. Vector similarity (if available)
    const vectorScore: number | null = null;
    if (useVectors) {
      // TODO: Implement vector similarity lookup
      // vectorScore = await getVectorSimilarity(targetProfileId, candidate.profileId);
    }
    
    // 6. Combined Tier 2 Score
    let tier2Score = metricsScore;
    
    // Apply background multiplier
    if (backgroundMatch) {
      tier2Score = tier2Score * backgroundMatch.multiplier;
      tier2Score += backgroundMatch.bonusPoints;
    }
    
    // Weight in vector score if available
    if (vectorScore !== null) {
      tier2Score = tier2Score * 0.7 + vectorScore * 0.3;
    }
    
    // Clamp to 0-100
    tier2Score = Math.min(100, Math.max(0, Math.round(tier2Score)));
    
    scoredCandidates.push({
      ...candidate,
      metricsScore,
      vectorScore,
      backgroundProfile,
      backgroundMatch,
      ageScore,
      tier2Score,
    });
  }
  
  // Sort by tier2Score and take top N
  scoredCandidates.sort((a, b) => b.tier2Score - a.tier2Score);
  
  return scoredCandidates.slice(0, maxOutput);
}

// ═══════════════════════════════════════════════════════════════
// TIER 3: AI FIRST PASS
// ═══════════════════════════════════════════════════════════════

async function tier3AIFirstPass(
  candidates: ScoredCandidate[],
  targetProfileSummary: string,
  targetBackgroundInfo: string,
  maxOutput: number
): Promise<AIFirstPassCandidate[]> {
  
  const model = await getGeminiModel();
  const allResults: AIFirstPassCandidate[] = [];
  
  const totalBatches = Math.ceil(candidates.length / AI_BATCH_SIZE);
  
  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batchStart = batchIdx * AI_BATCH_SIZE;
    const batchEnd = Math.min(batchStart + AI_BATCH_SIZE, candidates.length);
    const batch = candidates.slice(batchStart, batchEnd);
    
    const prompt = generateFirstPassPrompt(targetProfileSummary, targetBackgroundInfo, batch, batchIdx + 1, totalBatches);
    
    try {
      const result = await model.generateContent(prompt);
      const jsonString = result.response.text();
      const parsed = parseJsonResponse<{ candidates: any[] }>(jsonString);
      
      for (const aiResult of parsed.candidates || []) {
        const candidate = batch[aiResult.index - 1];
        if (!candidate) continue;
        
        const aiScore = Math.min(100, Math.max(0, aiResult.totalScore || 0));
        const breakdown: ScoreBreakdown = aiResult.breakdown || {
          religious: 0, ageCompatibility: 0, careerFamily: 0,
          lifestyle: 0, ambition: 0, communication: 0, values: 0
        };
        
        // Combined score: 50% Tier2 + 50% AI
        const tier3Score = Math.round(candidate.tier2Score * 0.5 + aiScore * 0.5);
        
        allResults.push({
          ...candidate,
          aiFirstPassScore: aiScore,
          scoreBreakdown: breakdown,
          shortReasoning: aiResult.shortReasoning || '',
          tier3Score,
        });
      }
    } catch (error) {
      console.error(`[Tier3] Batch ${batchIdx + 1} failed:`, error);
      // Fallback: use Tier 2 scores
      for (const candidate of batch) {
        allResults.push({
          ...candidate,
          aiFirstPassScore: candidate.tier2Score,
          scoreBreakdown: {
            religious: 0, ageCompatibility: 0, careerFamily: 0,
            lifestyle: 0, ambition: 0, communication: 0, values: 0
          },
          shortReasoning: 'AI analysis unavailable',
          tier3Score: candidate.tier2Score,
        });
      }
    }
  }
  
  allResults.sort((a, b) => b.tier3Score - a.tier3Score);
  return allResults.slice(0, maxOutput);
}

function generateFirstPassPrompt(
  targetProfile: string,
  targetBackgroundInfo: string,
  candidates: ScoredCandidate[],
  batchNum: number,
  totalBatches: number
): string {
  const candidatesText = candidates.map((c, idx) => {
    const bgInfo = c.backgroundProfile 
      ? `רקע: ${c.backgroundProfile.category} | התאמה: ${c.backgroundMatch?.compatibility || 'unknown'}`
      : '';
    const ageInfo = c.ageScore ? `גיל: ${c.ageScore.score}/100 (${c.ageScore.description})` : 'גיל לא ידוע';
    
    const summary = c.aiPersonalitySummary || c.about || `${c.firstName}, ${c.religiousLevel || ''}, ${c.city || ''}`;
    
    return `[${idx + 1}] ${c.firstName} ${c.lastName}
גיל: ${c.age || 'לא ידוע'} | דתיות: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'}
${bgInfo}
${ageInfo}
ציון מקדים: ${c.tier2Score}/100
${summary.substring(0, 500)}
---`;
  }).join('\n\n');

  return `אתה שדכן AI מומחה. נתח התאמות.
(Batch ${batchNum}/${totalBatches})

=== פרופיל מסומן ===
${targetProfile}

=== רקע ===
${targetBackgroundInfo}

=== מועמדים (${candidates.length}) ===
${candidatesText}

=== מערכת ציון (100 נקודות) ===
1. דתי (30), 2. גיל (10), 3. קריירה-משפחה (15), 4. סגנון חיים (13), 5. שאפתנות (11), 6. תקשורת (11), 7. ערכים (10)

=== פורמט JSON ===
{"candidates":[{"index":1,"totalScore":85,"breakdown":{"religious":26,"ageCompatibility":10,"careerFamily":12,"lifestyle":11,"ambition":9,"communication":9,"values":8},"shortReasoning":"התאמה טובה"}]}`;
}

// ═══════════════════════════════════════════════════════════════
// TIER 4: AI DEEP ANALYSIS
// ═══════════════════════════════════════════════════════════════

async function tier4AIDeepAnalysis(
  candidates: AIFirstPassCandidate[],
  targetProfileSummary: string,
  targetBackgroundInfo: string
): Promise<FinalCandidate[]> {
  
  const model = await getGeminiModel();
  const prompt = generateDeepAnalysisPrompt(targetProfileSummary, targetBackgroundInfo, candidates);
  
  try {
    const result = await model.generateContent(prompt);
    const jsonString = result.response.text();
    const parsed = parseJsonResponse<{ deepAnalysis: any[] }>(jsonString);
    
    const finalCandidates: FinalCandidate[] = [];
    
    for (const aiResult of parsed.deepAnalysis || []) {
      const candidate = candidates[aiResult.index - 1];
      if (!candidate) continue;
      
      const finalScore = Math.min(100, Math.max(0, aiResult.finalScore || candidate.tier3Score));
      const rank = aiResult.rank || 999;
      
      let recommendation: FinalCandidate['recommendation'];
      if (finalScore >= 85) recommendation = 'EXCELLENT';
      else if (finalScore >= 70) recommendation = 'GOOD';
      else if (finalScore >= 55) recommendation = 'FAIR';
      else recommendation = 'POOR';
      
      finalCandidates.push({
        ...candidate,
        finalScore,
        rank,
        detailedReasoning: aiResult.detailedReasoning || candidate.shortReasoning,
        recommendation,
      });
    }
    
    finalCandidates.sort((a, b) => a.rank - b.rank);
    return finalCandidates;
    
  } catch (error) {
    console.error(`[Tier4] Deep analysis failed:`, error);
    
    // Fallback
    return candidates.map((c, idx) => ({
      ...c,
      finalScore: c.tier3Score,
      rank: idx + 1,
      detailedReasoning: c.shortReasoning,
      recommendation: c.tier3Score >= 70 ? 'GOOD' as const : 'FAIR' as const,
    }));
  }
}

function generateDeepAnalysisPrompt(
  targetProfile: string,
  targetBackgroundInfo: string,
  candidates: AIFirstPassCandidate[]
): string {
  const candidatesText = candidates.map((c, idx) => {
    const summary = c.aiPersonalitySummary || c.about || '';
    return `[${idx + 1}] ${c.firstName} ${c.lastName} - ציון ${c.tier3Score}
${c.shortReasoning}
פירוט: דתי=${c.scoreBreakdown.religious}/30, גיל=${c.scoreBreakdown.ageCompatibility}/10
${summary.substring(0, 300)}
---`;
  }).join('\n\n');

  return `אתה שדכן AI מומחה. בצע ניתוח מעמיק והשוואה.

=== פרופיל מסומן ===
${targetProfile}

=== רקע ===
${targetBackgroundInfo}

=== ${candidates.length} מועמדים מובילים ===
${candidatesText}

=== המשימה ===
1. סקור כל מועמד/ת מחדש
2. תן ציון סופי 0-100
3. דרג מ-1 (הכי מתאים) עד ${candidates.length}
4. כתוב נימוק מפורט (3-5 שורות)

=== פורמט JSON ===
{"deepAnalysis":[{"index":1,"finalScore":92,"rank":1,"detailedReasoning":"התאמה יוצאת דופן..."}]}`;
}

// ═══════════════════════════════════════════════════════════════
// AI UTILITIES
// ═══════════════════════════════════════════════════════════════

async function getGeminiModel() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });
}

function parseJsonResponse<T>(jsonString: string): T {
  let cleaned = jsonString;
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7, -3).trim();
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3, -3).trim();
  return JSON.parse(cleaned) as T;
}

// ═══════════════════════════════════════════════════════════════
// SAVE RESULTS
// ═══════════════════════════════════════════════════════════════

async function saveResults(
  userId: string,
  profileId: string,
  userGender: Gender,
  matches: FinalCandidate[],
  minScoreToSave: number
): Promise<number> {
  const matchesToSave = matches.filter(m => m.finalScore >= minScoreToSave);
  
  let saved = 0;
  
  for (const match of matchesToSave) {
    const isMale = userGender === Gender.MALE;
    const maleUserId = isMale ? userId : match.userId;
    const femaleUserId = isMale ? match.userId : userId;
    
    try {
      await prisma.potentialMatch.upsert({
        where: { maleUserId_femaleUserId: { maleUserId, femaleUserId } },
        create: {
          maleUserId,
          femaleUserId,
          aiScore: match.finalScore,
          firstPassScore: match.tier2Score,
          status: 'PENDING',
          shortReasoning: match.shortReasoning,
          scoreForMale: isMale ? match.finalScore : match.tier3Score,
          scoreForFemale: isMale ? match.tier3Score : match.finalScore,
          asymmetryGap: Math.abs(match.finalScore - match.tier3Score),
        },
        update: {
          aiScore: match.finalScore,
          firstPassScore: match.tier2Score,
          shortReasoning: match.shortReasoning,
          scannedAt: new Date(),
        },
      });
      saved++;
    } catch (error) {
      console.error(`[Save] Failed to save ${match.firstName}:`, error);
    }
  }
  
  // Update lastScannedAt
  await prisma.profile.update({
    where: { id: profileId },
    data: { lastScannedAt: new Date() },
  });
  
  return saved;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function hybridScan(
  userId: string,
  options: HybridScanOptions = {}
): Promise<HybridScanResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Default options
  const {
    maxTier1Candidates = 300,
    maxTier2Candidates = 50,
    maxTier3Candidates = 20,
    topForDeepAnalysis = 15,
    useVectors = true,
    useBackgroundAnalysis = true,
    useAIFirstPass = true,
    useAIDeepAnalysis = true,
    minScoreToSave = 65,
    minScoreForAI = 50,
    forceRefresh = false,
    forceUpdateMetrics = false,
    autoSave = true,
  } = options;

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[HybridScan] Starting for user: ${userId}`);
  console.log(`${'═'.repeat(70)}`);

  // ═══════════════════════════════════════════════════════════
  // TIER 0: Load User Profile
  // ═══════════════════════════════════════════════════════════
  
  const profile = await prisma.profile.findFirst({
    where: { userId },
    include: { user: true },
  });

  if (!profile) throw new Error(`Profile not found for user: ${userId}`);
  
  const userMetrics = await prisma.$queryRaw<any[]>`
    SELECT * FROM "profile_metrics" WHERE "profileId" = ${profile.id} LIMIT 1
  `;
  const metrics = userMetrics[0] || null;
  
  // Calculate user's age with fallback
  let userAge: number;
  if (profile.birthDate) {
    userAge = calculateAge(profile.birthDate);
  } else if (metrics?.inferredAge) {
    userAge = metrics.inferredAge;
  } else {
    userAge = 30;
    warnings.push('No age found, using default 30');
  }
  
  // Age preferences with fallback
  let preferredAgeMin: number, preferredAgeMax: number;
  if (profile.preferredAgeMin !== null && profile.preferredAgeMax !== null) {
    preferredAgeMin = profile.preferredAgeMin;
    preferredAgeMax = profile.preferredAgeMax;
  } else if (metrics?.inferredPreferredAgeMin && metrics?.inferredPreferredAgeMax) {
    preferredAgeMin = metrics.inferredPreferredAgeMin;
    preferredAgeMax = metrics.inferredPreferredAgeMax;
  } else {
    // Smart defaults by gender
    if (profile.gender === Gender.MALE) {
      preferredAgeMin = Math.max(18, userAge - 7);
      preferredAgeMax = userAge + 2;
    } else {
      preferredAgeMin = Math.max(18, userAge - 2);
      preferredAgeMax = userAge + 10;
    }
  }
  
  // Background profile for user
  const userBackgroundProfile = createBackgroundProfile(
    profile.nativeLanguage,
    profile.additionalLanguages || [],
    profile.aliyaCountry,
    profile.aliyaYear,
    profile.origin,
    profile.about,
    profile.matchingNotes
  );
  
  console.log(`[HybridScan] User: ${profile.user.firstName} ${profile.user.lastName}`);
  console.log(`[HybridScan] Age: ${userAge}, Gender: ${profile.gender}`);
  console.log(`[HybridScan] Preferred Age: ${preferredAgeMin}-${preferredAgeMax}`);
  console.log(`[HybridScan] Background: ${userBackgroundProfile.category}`);

  // Ensure user has metrics
  await ensureUserReady(profile.id, forceUpdateMetrics);

  const tiersStats = {
    tier1: { input: 0, output: 0, durationMs: 0 },
    tier2: { input: 0, output: 0, durationMs: 0 },
    tier3: { input: 0, output: 0, durationMs: 0 },
    tier4: { input: 0, output: 0, durationMs: 0 },
  };

  // ═══════════════════════════════════════════════════════════
  // TIER 1: SQL Filtering
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[HybridScan] ═══ TIER 1: SQL Filter ═══`);
  const tier1Start = Date.now();
  
  const tier1Candidates = await tier1SqlFilter(
    userId,
    profile.id,
    profile.gender,
    userAge,
    profile.religiousLevel,
    preferredAgeMin,
    preferredAgeMax,
    maxTier1Candidates
  );
  
  tiersStats.tier1 = {
    input: maxTier1Candidates,
    output: tier1Candidates.length,
    durationMs: Date.now() - tier1Start,
  };
  
  console.log(`[HybridScan] Tier 1: ${tier1Candidates.length} candidates in ${tiersStats.tier1.durationMs}ms`);

  if (tier1Candidates.length === 0) {
    return createEmptyResult(userId, profile.id, startTime, tiersStats, warnings, errors);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 2: Metrics + Background Scoring
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[HybridScan] ═══ TIER 2: Metrics + Background ═══`);
  const tier2Start = Date.now();
  
  const tier2Candidates = await tier2MetricsScoring(
    tier1Candidates,
    {
      age: userAge,
      gender: profile.gender,
      religiousLevel: profile.religiousLevel,
      backgroundProfile: userBackgroundProfile,
      socialEnergy: metrics?.socialEnergy,
      careerOrientation: metrics?.careerOrientation,
      urbanScore: metrics?.urbanScore,
    },
    useVectors,
    useBackgroundAnalysis,
    maxTier2Candidates
  );
  
  tiersStats.tier2 = {
    input: tier1Candidates.length,
    output: tier2Candidates.length,
    durationMs: Date.now() - tier2Start,
  };
  
  console.log(`[HybridScan] Tier 2: ${tier2Candidates.length} candidates in ${tiersStats.tier2.durationMs}ms`);
  console.log(`[HybridScan] Top 3 after Tier 2:`);
  tier2Candidates.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i+1}. ${c.firstName} - Score: ${c.tier2Score}, BG: ${c.backgroundMatch?.compatibility || 'N/A'}`);
  });

  // ═══════════════════════════════════════════════════════════
  // TIER 3: AI First Pass
  // ═══════════════════════════════════════════════════════════
  let tier3Candidates: AIFirstPassCandidate[];
  
  if (useAIFirstPass) {
    console.log(`\n[HybridScan] ═══ TIER 3: AI First Pass ═══`);
    const tier3Start = Date.now();
    
    // Filter candidates with minimum score
    const candidatesForAI = tier2Candidates.filter(c => c.tier2Score >= minScoreForAI);
    console.log(`[HybridScan] Sending ${candidatesForAI.length} candidates to AI (score >= ${minScoreForAI})`);
    
    // Prepare profile summary for AI
    const targetProfileSummary = prepareProfileSummary(profile, metrics);
    const targetBackgroundInfo = prepareBackgroundInfo(userBackgroundProfile);
    
    tier3Candidates = await tier3AIFirstPass(
      candidatesForAI,
      targetProfileSummary,
      targetBackgroundInfo,
      maxTier3Candidates
    );
    
    tiersStats.tier3 = {
      input: candidatesForAI.length,
      output: tier3Candidates.length,
      durationMs: Date.now() - tier3Start,
    };
    
    console.log(`[HybridScan] Tier 3: ${tier3Candidates.length} candidates in ${tiersStats.tier3.durationMs}ms`);
  } else {
    // Skip AI, convert Tier 2 candidates
    tier3Candidates = tier2Candidates.slice(0, maxTier3Candidates).map(c => ({
      ...c,
      aiFirstPassScore: c.tier2Score,
      scoreBreakdown: { religious: 0, ageCompatibility: 0, careerFamily: 0, lifestyle: 0, ambition: 0, communication: 0, values: 0 },
      shortReasoning: 'AI skipped',
      tier3Score: c.tier2Score,
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 4: AI Deep Analysis
  // ═══════════════════════════════════════════════════════════
  let finalCandidates: FinalCandidate[];
  
  if (useAIDeepAnalysis && tier3Candidates.length > 0) {
    console.log(`\n[HybridScan] ═══ TIER 4: AI Deep Analysis ═══`);
    const tier4Start = Date.now();
    
    const topForDeep = tier3Candidates.slice(0, topForDeepAnalysis);
    const targetProfileSummary = prepareProfileSummary(profile, metrics);
    const targetBackgroundInfo = prepareBackgroundInfo(userBackgroundProfile);
    
    finalCandidates = await tier4AIDeepAnalysis(
      topForDeep,
      targetProfileSummary,
      targetBackgroundInfo
    );
    
    tiersStats.tier4 = {
      input: topForDeep.length,
      output: finalCandidates.length,
      durationMs: Date.now() - tier4Start,
    };
    
    console.log(`[HybridScan] Tier 4: ${finalCandidates.length} candidates in ${tiersStats.tier4.durationMs}ms`);
  } else {
    // Skip deep analysis
    finalCandidates = tier3Candidates.map((c, idx) => ({
      ...c,
      finalScore: c.tier3Score,
      rank: idx + 1,
      detailedReasoning: c.shortReasoning,
      recommendation: c.tier3Score >= 70 ? 'GOOD' as const : 'FAIR' as const,
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // SAVE RESULTS
  // ═══════════════════════════════════════════════════════════
  let savedCount = 0;
  
  if (autoSave && finalCandidates.length > 0) {
    console.log(`\n[HybridScan] ═══ Saving Results ═══`);
    savedCount = await saveResults(userId, profile.id, profile.gender, finalCandidates, minScoreToSave);
    console.log(`[HybridScan] Saved ${savedCount} matches to DB`);
  }

  // ═══════════════════════════════════════════════════════════
  // FINAL RESULT
  // ═══════════════════════════════════════════════════════════
  const totalDuration = Date.now() - startTime;
  
  console.log(`\n[HybridScan] ✅ Completed in ${totalDuration}ms`);
  console.log(`[HybridScan] Final Top 5:`);
  finalCandidates.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i+1}. ${c.firstName} ${c.lastName} - Final: ${c.finalScore}, Rank: ${c.rank}, Rec: ${c.recommendation}`);
  });
  console.log(`${'═'.repeat(70)}\n`);

  return {
    userId,
    profileId: profile.id,
    scanStartedAt: new Date(startTime),
    scanCompletedAt: new Date(),
    durationMs: totalDuration,
    tiers: tiersStats,
    stats: {
      totalCandidatesScanned: tier1Candidates.length,
      passedFilters: tier2Candidates.length,
      aiAnalyzed: tiersStats.tier3.output,
      deepAnalyzed: tiersStats.tier4.output,
      savedToDb: savedCount,
      fromCache: false,
    },
    matches: finalCandidates,
    warnings,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function createEmptyResult(
  userId: string,
  profileId: string,
  startTime: number,
  tiers: HybridScanResult['tiers'],
  warnings: string[],
  errors: string[]
): HybridScanResult {
  return {
    userId,
    profileId,
    scanStartedAt: new Date(startTime),
    scanCompletedAt: new Date(),
    durationMs: Date.now() - startTime,
    tiers,
    stats: {
      totalCandidatesScanned: 0,
      passedFilters: 0,
      aiAnalyzed: 0,
      deepAnalyzed: 0,
      savedToDb: 0,
      fromCache: false,
    },
    matches: [],
    warnings,
    errors,
  };
}

function prepareProfileSummary(profile: any, metrics: any): string {
  const aiSummary = metrics?.aiPersonalitySummary;
  const seeking = metrics?.aiSeekingSummary;
  
  if (aiSummary) {
    return `שם: ${profile.user.firstName}
גיל: ${profile.birthDate ? calculateAge(profile.birthDate) : metrics?.inferredAge || 'לא ידוע'}
רמה דתית: ${profile.religiousLevel || 'לא צוין'}
עיר: ${profile.city || metrics?.inferredCity || 'לא צוין'}

=== אישיות ===
${aiSummary}

=== מה מחפש/ת ===
${seeking || 'לא צוין'}`;
  }
  
  return `${profile.user.firstName}, ${profile.religiousLevel || ''}, ${profile.city || ''}
${profile.about || ''}`;
}

function prepareBackgroundInfo(bg: BackgroundProfile): string {
  const categoryNames: Record<BackgroundCategory, string> = {
    sabra: 'צבר/ית',
    sabra_international: 'צבר/ית עם רקע בינלאומי',
    oleh_veteran: 'עולה ותיק/ה (10+ שנים)',
    oleh_mid: 'עולה (3-10 שנים)',
    oleh_new: 'עולה חדש/ה',
  };
  
  let info = `קטגוריה: ${categoryNames[bg.category]}
שפת אם: ${bg.nativeLanguage || 'לא צוין'}
שפות נוספות: ${bg.additionalLanguages.join(', ') || 'אין'}`;
  
  if (bg.aliyaCountry) info += `\nארץ עלייה: ${bg.aliyaCountry}`;
  if (bg.aliyaYear) info += `\nשנת עלייה: ${bg.aliyaYear} (${bg.yearsInIsrael} שנים)`;
  
  return info;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const hybridMatchingService = {
  hybridScan,
  
  // Utility exports
  calculateAge,
  calculateAgeScore,
  calculateAgeScoreForMatch,
  createBackgroundProfile,
  calculateBackgroundMatch,
  getCompatibleReligiousLevels,
  getReligiousCompatibilityScore,
};

export default hybridMatchingService;