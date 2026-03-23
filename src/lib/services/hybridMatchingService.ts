// ============================================================
// NeshamaTech - Hybrid Matching Service V2.3
// src/lib/services/hybridMatchingService.ts
//
// שילוב מושלם של:
// - scanSingleUserV2: מדדים מתקדמים, ערכים מוסקים, AI summaries
// - hybridMatchingService V1: רקע, שפה, שיטת Tiers, batch AI
// - matchingAlgorithmService V3.4: Virtual profiles, ScannedPair, Enhanced prompts
//
// V2.2 Changes:
// - ScannedPair Optimization: SQL LEFT JOIN to fetch existing pair data
// - Smart Caching: Skip re-scoring candidates if profiles haven't changed
// - Performance: Massive reduction in AI costs for repeat scans
// - Statistics: Detailed tracking of skipped vs. new pairs
//
// V2.3 Changes:
// - 🆕 AI Call Tracking: Detailed stats for all AI/embedding calls
// - aiCallStats in result for frontend display
// ============================================================

import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus, MatchSuggestionStatus, PotentialMatchStatus } from "@prisma/client";
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getReligiousCompatibilityScore as _getReligiousCompatibilityScore,
  calculateSocioEconomicScore as _calculateSocioEconomicScore,
  calculateEducationScore as _calculateEducationScore,
  calculateJobSeniorityScore as _calculateJobSeniorityScore,
} from "@/types/profileMetrics";

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

// 🆕 V2.3: AI Call Statistics
export interface AICallStats {
  tier3FirstPass: {
    batchesSent: number;
    candidatesAnalyzed: number;
    cachedSkipped: number;
    callsMade: number;
    totalTokensEstimated: number;
    durationMs: number;
  };
  tier4DeepAnalysis: {
    candidatesAnalyzed: number;
    cachedSkipped: number;
    callsMade: number;
    totalTokensEstimated: number;
    durationMs: number;
  };
  embeddings: {
    callsMade: number;
    durationMs: number;
  };
  total: {
    aiCalls: number;
    embeddingCalls: number;
    estimatedCost: number; // בדולרים (הערכה גסה)
  };
}

// --- Background Types ---
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

// --- Virtual Profile Interface ---
export interface GeneratedVirtualProfile {
  inferredAge: number;
  inferredCity: string | null;
  inferredOccupation: string | null;
  inferredMaritalStatus: string | null;
  inferredEducation: string | null;
  personalitySummary: string;
  lookingForSummary: string;
  preferredAgeMin: number;
  preferredAgeMax: number;
  preferredReligiousLevels: string[];
  preferredLocations: string[];
  keyTraits: string[];
  idealPartnerTraits: string[];
  dealBreakers: string[];
  displaySummary: string;
}

// --- Virtual Scan Options ---
export interface VirtualScanOptions {
  maxCandidates?: number;
  useAIFirstPass?: boolean;
  useAIDeepAnalysis?: boolean;
  minScoreToReturn?: number;
}

// --- Virtual Scan Result ---
export interface VirtualScanResult {
  virtualProfileId?: string;
  scanStartedAt: Date;
  scanCompletedAt: Date;
  durationMs: number;
  stats: {
    totalCandidatesScanned: number;
    passedFilters: number;
    aiAnalyzed: number;
    deepAnalyzed: number;
  };
  matches: VirtualMatchCandidate[];
  warnings: string[];
}

export interface VirtualMatchCandidate {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  age: number | null;
  city: string | null;
  religiousLevel: string | null;
  occupation: string | null;
  score: number;
  reasoning: string;
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  strengths: string[];
  concerns: string[];
}

// --- Extended Metrics ---
export interface ExtendedMetrics {
  // מדדים בסיסיים
  confidenceScore: number | null;
  religiousStrictness: number | null;
  socialEnergy: number | null;
  careerOrientation: number | null;
  urbanScore: number | null;
  appearancePickiness: number | null;
  spiritualDepth: number | null;
  
  // מדדים חדשים
  socioEconomicLevel: number | null;
  jobSeniorityLevel: number | null;
  educationLevelScore: number | null;
  
  // ערכים מוסקים
  inferredAge: number | null;
  inferredCity: string | null;
  inferredReligiousLevel: string | null;
  inferredPreferredAgeMin: number | null;
  inferredPreferredAgeMax: number | null;
  inferredParentStatus: string | null;
  inferredEducationLevel: string | null;
  
  // סיכומי AI מורחבים
  aiPersonalitySummary: string | null;
  aiSeekingSummary: string | null;
  aiBackgroundSummary: string | null;
  aiMatchmakerGuidelines: string | null;
  aiInferredDealBreakers: string[] | null;
  aiInferredMustHaves: string[] | null;
  difficultyFlags: string[] | null;
  
  // העדפות מורחבות
  prefSocioEconomicMin: number | null;
  prefSocioEconomicMax: number | null;
  prefJobSeniorityMin: number | null;
  prefJobSeniorityMax: number | null;
  prefEducationLevelMin: number | null;
  prefEducationLevelMax: number | null;
}

// --- Score Breakdown ---
export interface ScoreBreakdown {
  religious: number;
  ageCompatibility: number;
  careerFamily: number;
  lifestyle: number;
  socioEconomic: number;
  education: number;
  background: number;
  values: number;
}

// --- Scan Options ---
export interface HybridScanOptions {
  // Tier controls
  maxTier1Candidates?: number;
  maxTier2Candidates?: number;
  maxTier3Candidates?: number;
  topForDeepAnalysis?: number;
  
  // Feature flags
  useVectors?: boolean;
  useBackgroundAnalysis?: boolean;
  useAIFirstPass?: boolean;
  useAIDeepAnalysis?: boolean;
  useExtendedMetrics?: boolean;
  
  // Thresholds
  minScoreToSave?: number;
  minScoreForAI?: number;
  
  // Behavior
  forceRefresh?: boolean;
  forceUpdateMetrics?: boolean;
  skipCandidateMetricsUpdate?: boolean;
  maxCandidatesToUpdate?: number;
  autoSave?: boolean;
  
  // 🆕 V2.2: ScannedPair optimization
  skipAlreadyScannedPairs?: boolean;  // ברירת מחדל: true
  scannedPairMaxAgeDays?: number;     // כמה ימים עד שסריקה נחשבת "ישנה" (ברירת מחדל: 30)
  saveScannedPairs?: boolean;         // ברירת מחדל: true
  
  // 🆕 V2.2: Session tracking
  sessionId?: string;
  checkCancelled?: () => Promise<boolean> | boolean;
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
  religiousJourney: string | null;
  occupation: string | null;
  education: string | null;
  educationLevel: string | null;
  about: string | null;
  matchingNotes: string | null;
  parentStatus: string | null;
  hasChildrenFromPrevious: boolean | null;
  smokingStatus: string | null;

  // Background info
  nativeLanguage: string | null;
  additionalLanguages: string[];
  aliyaCountry: string | null;
  aliyaYear: number | null;
  origin: string | null;
  
  // Preferences
  preferredAgeMin: number | null;
  preferredAgeMax: number | null;
  
  // Extended Metrics
  metrics: ExtendedMetrics;
  
  // Profile dates
  profileUpdatedAt: Date;
  contentUpdatedAt: Date; // significant content changes only

  // 🆕 V2.2: ScannedPair info (if exists)
  existingScannedPairId?: string | null;
  existingAiScore?: number | null;
  scannedPairLastScannedAt?: Date | null;
  scannedPairMaleProfileUpdatedAt?: Date | null;
  scannedPairFemaleProfileUpdatedAt?: Date | null;
  canSkipFullScan?: boolean;
}

interface ScoredCandidate extends RawCandidate {
  // Computed scores
  metricsScore: number;
  vectorScore: number | null;
  backgroundProfile: BackgroundProfile | null;
  backgroundMatch: BackgroundMatchResult | null;
  ageScore: AgeScoreResult | null;
  tier2Breakdown?: ScoreBreakdown;  // 🆕

  // Extended scores
  socioEconomicScore: number;
  educationScore: number;
  jobSeniorityScore: number;

  // Compatibility flags
  meetsUserMustHaves: boolean;
  violatesUserDealBreakers: boolean;
  meetsCandidateMustHaves: boolean;
  violatesCandidateDealBreakers: boolean;

  // Combined Tier 2 score
  tier2Score: number;

  // 🆕 V2.2: Was this score from cache?
  fromScannedPairCache?: boolean;

  // 🆕 V3: Tag matching results
  tagScore?: number;
  tagMatchDetails?: string; // Serialized tag match summary for AI prompt context
}

interface AIFirstPassCandidate extends ScoredCandidate {
  aiFirstPassScore: number;
  scoreBreakdown: ScoreBreakdown;
  shortReasoning: string;
  tier3Score: number;
}

interface FinalCandidate extends AIFirstPassCandidate {
  finalScore: number;
  rank: number;
  detailedReasoning: string;
  recommendation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  suggestedApproach?: string;
  strengths: string[];
  concerns: string[];

  // 🆕 V3: Two-directional scores
  scoreAtoB?: number;   // How well candidate matches what target wants
  scoreBtoA?: number;   // How well target matches what candidate wants
  reasoningAtoB?: string;
  reasoningBtoA?: string;
}

// --- Scan Result ---
export interface HybridScanResult {
  userId: string;
  profileId: string;
  scanStartedAt: Date;
  scanCompletedAt: Date;
  durationMs: number;
  
  tiers: {
    tier0: { candidatesUpdated: number; durationMs: number };
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
    candidatesWithDifficultyFlags: number;
    scannedPairsSaved: number;

    // 🆕 V2.2: ScannedPair stats
    skippedFromScannedPair: number;
    newPairsScanned: number;

    // 🆕 V3: Tag stats
    tagFilteredOut?: number;
    tagsGenerated?: boolean;
  };

  // 🆕 V2.3: AI Call Statistics
  aiCallStats: AICallStats;
  
  matches: FinalCandidate[];
  warnings: string[];
  errors: string[];
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const CURRENT_YEAR = new Date().getFullYear();
const STALE_DAYS = 7;
const AI_BATCH_SIZE = 10;
const MIN_SCORE_TO_SAVE = 65;
const MAX_CANDIDATES_TO_UPDATE = 30;

// Religious level ordering
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

const BACKGROUND_DESCRIPTIONS: Record<BackgroundCategory, string> = {
  sabra: 'ישראלי/ת ילידי הארץ - עברית שפת אם, משולב/ת תרבותית מלאה',
  sabra_international: 'ישראלי/ת עם רקע בינלאומי - דובר/ת שפות, חשיפה לתרבויות',
  oleh_veteran: 'עולה ותיק/ה (10+ שנים) - משולב/ת תרבותית, עברית טובה',
  oleh_mid: 'עולה בתהליך קליטה (3-10 שנים) - בתהליך השתלבות תרבותית ושפתית',
  oleh_new: 'עולה חדש/ה (פחות מ-3 שנים) - בתחילת תהליך הקליטה, אתגרי שפה ותרבות',
};

// 🆕 הועבר ל-profileMetrics.ts — מקור אמת יחיד
// ראה: RELIGIOUS_COMPATIBILITY_MATRIX ב-@/types/profileMetrics




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
  const ageDiff = maleAge - femaleAge; // Positive = male older
  
  // אידיאלי: אותו גיל או הגבר גדול ב-1-3 שנים
  if (ageDiff >= 0 && ageDiff <= 3) {
    return { 
      score: 100, 
      eligible: true,
      description: ageDiff === 0 ? 'אותו גיל - מושלם' : `הגבר גדול ב-${ageDiff} שנים - אידיאלי`
    };
  }
  
  if (ageDiff === 4) return { score: 90, eligible: true, description: 'הגבר גדול ב-4 שנים - מצוין' };
  if (ageDiff === 5) return { score: 80, eligible: true, description: 'הגבר גדול ב-5 שנים - טוב' };
  
  if (ageDiff === 6) return { score: 65, eligible: true, description: 'הגבר גדול ב-6 שנים - סביר' };
  if (ageDiff === 7) return { score: 50, eligible: true, description: 'הגבר גדול ב-7 שנים - פער ניכר' };
  
  if (ageDiff > 7) {
    return { score: 0, eligible: false, description: `פער גדול מדי (${ageDiff} שנים) - הגבר מבוגר מדי` };
  }
  
  // האישה גדולה מהגבר
  const femaleOlder = Math.abs(ageDiff);
  
  if (femaleOlder === 1) return { score: 75, eligible: true, description: 'האישה גדולה בשנה - בסדר' };
  if (femaleOlder === 2) return { score: 60, eligible: true, description: 'האישה גדולה ב-2 שנים - אפשרי' };
  if (femaleOlder === 3) return { score: 40, eligible: true, description: 'האישה גדולה ב-3 שנים - מאתגר' };
  if (femaleOlder === 4) return { score: 20, eligible: true, description: 'האישה גדולה ב-4 שנים - יוצא דופן' };
  
  return { score: 0, eligible: false, description: `האישה גדולה ב-${femaleOlder} שנים - לא רלוונטי` };
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
// HELPER FUNCTIONS - Religious & Metrics
// ═══════════════════════════════════════════════════════════════

// 🆕 מקור אמת יחיד — מוסק מ-profileMetrics.ts
function getReligiousCompatibilityScore(level1: string | null, level2: string | null): number {
  return _getReligiousCompatibilityScore(level1, level2);
}

function calculateSocioEconomicScore(
  userLevel: number | null, candidateLevel: number | null,
  userPrefMin: number | null, userPrefMax: number | null,
  candidatePrefMin: number | null, candidatePrefMax: number | null
): number {
  return _calculateSocioEconomicScore(userLevel, candidateLevel, userPrefMin, userPrefMax, candidatePrefMin, candidatePrefMax);
}

function calculateEducationScore(
  userLevel: number | null, candidateLevel: number | null,
  userPrefMin: number | null, candidatePrefMin: number | null
): number {
  return _calculateEducationScore(userLevel, candidateLevel, userPrefMin, candidatePrefMin);
}

function calculateJobSeniorityScore(
  userLevel: number | null, candidateLevel: number | null,
  userPrefMin: number | null, candidatePrefMin: number | null
): number {
  return _calculateJobSeniorityScore(userLevel, candidateLevel, userPrefMin, candidatePrefMin);
}

function checkDealBreakers(
  candidateProfile: RawCandidate,
  userDealBreakers: string[] | null
): { violated: boolean; violations: string[] } {
  if (!userDealBreakers || userDealBreakers.length === 0) {
    return { violated: false, violations: [] };
  }
  
  const violations: string[] = [];
  
  for (const dealBreaker of userDealBreakers) {
    const lower = dealBreaker.toLowerCase();
    
    if (lower.includes('ילדים') || lower.includes('children')) {
      if (candidateProfile.hasChildrenFromPrevious) {
        violations.push(`יש ילדים מקודם (דרישה: ${dealBreaker})`);
      }
    }
    
    if (lower.includes('חרדי') || lower.includes('charedi')) {
      const level = candidateProfile.religiousLevel || candidateProfile.metrics.inferredReligiousLevel;
      if (level?.startsWith('charedi')) {
        violations.push(`רמה דתית לא מתאימה (${level})`);
      }
    }
    
    if (lower.includes('חילוני') || lower.includes('secular')) {
      const level = candidateProfile.religiousLevel || candidateProfile.metrics.inferredReligiousLevel;
      if (level === 'secular') {
        violations.push(`חילוני (דרישה: ${dealBreaker})`);
      }
    }
    
    const ageMatch = lower.match(/גיל\s*(\d+)/);
    if (ageMatch) {
      const maxAge = parseInt(ageMatch[1]);
      const candidateAge = candidateProfile.age || candidateProfile.metrics.inferredAge;
      if (candidateAge && candidateAge > maxAge) {
        violations.push(`גיל ${candidateAge} (מקסימום: ${maxAge})`);
      }
    }
  }
  
  return { violated: violations.length > 0, violations };
}

function checkMustHaves(
  candidateProfile: RawCandidate,
  userMustHaves: string[] | null
): { met: boolean; missing: string[] } {
  if (!userMustHaves || userMustHaves.length === 0) {
    return { met: true, missing: [] };
  }
  
  const missing: string[] = [];
  
  for (const mustHave of userMustHaves) {
    const lower = mustHave.toLowerCase();
    
    if (lower.includes('תואר') || lower.includes('degree')) {
      const eduLevel = candidateProfile.metrics.educationLevelScore;
      if (eduLevel !== null && eduLevel < 3) {
        missing.push(`השכלה אקדמית (נדרש: ${mustHave})`);
      }
    }
    
    if (lower.includes('עובד') || lower.includes('employed')) {
      if (!candidateProfile.occupation) {
        missing.push(`תעסוקה לא ידועה (נדרש: ${mustHave})`);
      }
    }
    
    if (lower.includes('ירושלים') || lower.includes('jerusalem')) {
      const city = candidateProfile.city || candidateProfile.metrics.inferredCity;
      if (!city?.includes('ירושלים') && !city?.toLowerCase().includes('jerusalem')) {
        missing.push(`לא בירושלים (נדרש: ${mustHave})`);
      }
    }
  }
  
  return { met: missing.length === 0, missing };
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
  matchingNotes: string | null,
  aiBackgroundSummary: string | null
): BackgroundProfile {
  const indicators: string[] = [];
  
  const allText = [aboutText, matchingNotes, aiBackgroundSummary].filter(Boolean).join(' ');
  const textAnalysis = analyzeTextLanguage(allText);
  
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
  
  if (targetProfile.nativeLanguage && 
      candidateProfile.nativeLanguage &&
      targetProfile.nativeLanguage.toLowerCase() === candidateProfile.nativeLanguage.toLowerCase() &&
      !['hebrew', 'עברית'].includes(targetProfile.nativeLanguage.toLowerCase())) {
    bonusPoints += 15;
    multiplier = Math.min(1.25, multiplier + 0.15);
    reasons.push(`same native: ${targetProfile.nativeLanguage}`);
  }
  
  const commonLangs = targetProfile.additionalLanguages.filter(
    lang => candidateProfile.additionalLanguages.includes(lang) ||
            candidateProfile.nativeLanguage?.toLowerCase() === lang.toLowerCase()
  );
  if (commonLangs.length > 0) {
    bonusPoints += 8;
    multiplier = Math.min(1.25, multiplier + 0.08);
    reasons.push(`common langs: ${commonLangs.join(', ')}`);
  }
  
  if (targetProfile.aliyaCountry && candidateProfile.aliyaCountry &&
      targetProfile.aliyaCountry.toLowerCase() === candidateProfile.aliyaCountry.toLowerCase()) {
    bonusPoints += 10;
    multiplier = Math.min(1.25, multiplier + 0.1);
    reasons.push(`same country: ${targetProfile.aliyaCountry}`);
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
// 🆕 V2.2: SCANNED PAIR HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * 🆕 V2.2: Check if a pair can be skipped based on ScannedPair data
 * Returns true if both profiles haven't changed since last scan
 */
function canSkipPairScan(
  candidate: RawCandidate,
  targetContentUpdatedAt: Date
): boolean {
  // No existing scan data - must scan
  if (!candidate.existingScannedPairId || !candidate.scannedPairLastScannedAt) {
    return false;
  }

  // Compare significant content changes only (not every minor DB write)
  const candidateContentUpdatedAt = candidate.contentUpdatedAt;

  // Check if target profile had significant content change after last scan
  if (targetContentUpdatedAt > candidate.scannedPairLastScannedAt) {
    return false;
  }

  // Check if candidate profile had significant content change after last scan
  if (candidateContentUpdatedAt > candidate.scannedPairLastScannedAt) {
    return false;
  }

  // Neither profile had significant changes — can skip!
  return true;
}

/**
 * 🆕 V2.2: Save scanned pairs to database
 */
async function saveScannedPairs(
  targetUserId: string,
  targetGender: Gender,
  targetContentUpdatedAt: Date,
  candidates: FinalCandidate[]
): Promise<number> {
  let savedCount = 0;

  for (const candidate of candidates) {
    try {
      const maleUserId = targetGender === Gender.MALE ? targetUserId : candidate.userId;
      const femaleUserId = targetGender === Gender.MALE ? candidate.userId : targetUserId;
      // Store contentUpdatedAt snapshots so future scans compare significant changes only
      const maleProfileUpdatedAt = targetGender === Gender.MALE ? targetContentUpdatedAt : (candidate.contentUpdatedAt ?? candidate.profileUpdatedAt);
      const femaleProfileUpdatedAt = targetGender === Gender.MALE ? (candidate.contentUpdatedAt ?? candidate.profileUpdatedAt) : targetContentUpdatedAt;
      
      const passedThreshold = candidate.finalScore >= MIN_SCORE_TO_SAVE;
      const rejectionReason = !passedThreshold 
        ? `Score ${candidate.finalScore} below threshold ${MIN_SCORE_TO_SAVE}` 
        : null;
      
      await prisma.scannedPair.upsert({
        where: {
          maleUserId_femaleUserId: { maleUserId, femaleUserId }
        },
        create: {
          maleUserId,
          femaleUserId,
          aiScore: candidate.finalScore,
          passedThreshold,
          rejectionReason,
          firstScannedAt: new Date(),
          lastScannedAt: new Date(),
          maleProfileUpdatedAt,
          femaleProfileUpdatedAt,
        },
        update: {
          aiScore: candidate.finalScore,
          passedThreshold,
          rejectionReason,
          lastScannedAt: new Date(),
          maleProfileUpdatedAt,
          femaleProfileUpdatedAt,
        },
      });
      
      savedCount++;
    } catch (error) {
      console.error(`[ScannedPair] Failed to save pair with ${candidate.firstName}:`, error);
    }
  }
  
  console.log(`[ScannedPair] Saved ${savedCount} scanned pairs`);
  return savedCount;
}

// ═══════════════════════════════════════════════════════════════
// TIER 0: READINESS CHECK + CANDIDATE UPDATE
// ═══════════════════════════════════════════════════════════════

async function ensureUserReady(
  profileId: string, 
  forceUpdate: boolean = false
): Promise<{ metricsExist: boolean; vectorsExist: boolean; updated: boolean }> {
  const [metricsResult, vectorsResult] = await Promise.all([
    prisma.$queryRaw<any[]>`SELECT 1 FROM "profile_metrics" WHERE "profileId" = ${profileId} LIMIT 1`,
    prisma.$queryRaw<any[]>`SELECT 1 FROM "profile_vectors" WHERE "profileId" = ${profileId} AND "selfVector" IS NOT NULL LIMIT 1`,
  ]);
  
  const metricsExist = metricsResult.length > 0;
  const vectorsExist = vectorsResult.length > 0;
  
  if (!metricsExist || !vectorsExist || forceUpdate) {
    try {
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

async function ensureCandidatesReady(
  oppositeGender: Gender,
  maxToUpdate: number = 30
): Promise<{ updated: number; failed: number; durationMs: number }> {
  const startTime = Date.now();
  
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
    return { updated: 0, failed: 0, durationMs: Date.now() - startTime };
  }

  console.log(`[Hybrid] Found ${candidatesNeedingUpdate.length} candidates needing metrics update`);

  let updated = 0;
  let failed = 0;

  const { updateProfileVectorsAndMetrics } = await import('./dualVectorService');

  for (const candidate of candidatesNeedingUpdate) {
    try {
      await updateProfileVectorsAndMetrics(candidate.profileId);
      updated++;
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      failed++;
      console.error(`[Hybrid] Failed to update ${candidate.firstName}:`, error);
    }
  }

  return { updated, failed, durationMs: Date.now() - startTime };
}

// ═══════════════════════════════════════════════════════════════
// TIER 1: SQL FILTERING (V2.2 Enhanced)
// ═══════════════════════════════════════════════════════════════

async function tier1SqlFilter(
  userId: string,
  profileId: string,
  userGender: Gender,
  userAge: number,
  userReligiousLevel: string | null,
  preferredAgeMin: number,
  preferredAgeMax: number,
  preferredPartnerHasChildren: string,
  maxCandidates: number,
  // 🆕 V2.2: New parameter unused but good for future expansion
  includeScannedPairInfo: boolean = true 
): Promise<RawCandidate[]> {
  const oppositeGender = userGender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
  
  // 🆕 V2.2: Enhanced query with ScannedPair LEFT JOIN
  const candidates = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id as "profileId",
      p."userId",
      u."firstName",
      u."lastName",
      p.gender,
      p."birthDate",
      p.city,
      p."religiousLevel",
      p."religiousJourney",
      p.occupation,
      p.education,
      p."educationLevel",
      p.about,
      p."matchingNotes",
      p."parentStatus",
      p."hasChildrenFromPrevious",
      p."smokingStatus",
      p."nativeLanguage",
      p."additionalLanguages",
      p."aliyaCountry",
      p."aliyaYear",
      p.origin,
      p."preferredAgeMin",
      p."preferredAgeMax",
      p."updatedAt" as "profileUpdatedAt",
      COALESCE(p."contentUpdatedAt", p."updatedAt") as "contentUpdatedAt",

      -- Basic Metrics
      pm."confidenceScore",
      pm."religiousStrictness",
      pm."socialEnergy",
      pm."careerOrientation",
      pm."urbanScore",
      pm."appearancePickiness",
      pm."spiritualDepth",
      
      -- New Metrics
      pm."socioEconomicLevel",
      pm."jobSeniorityLevel",
      pm."educationLevelScore",
      
      -- Inferred Values
      pm."inferredAge",
      pm."inferredCity",
      pm."inferredReligiousLevel",
      pm."inferredPreferredAgeMin",
      pm."inferredPreferredAgeMax",
      pm."inferredParentStatus",
      pm."inferredEducationLevel",
      
      -- AI Summaries
      pm."aiPersonalitySummary",
      pm."aiSeekingSummary",
      pm."aiBackgroundSummary",
      pm."aiMatchmakerGuidelines",
      pm."aiInferredDealBreakers",
      pm."aiInferredMustHaves",
      pm."difficultyFlags",
      
      -- Extended Preferences
      pm."prefSocioEconomicMin",
      pm."prefSocioEconomicMax",
      pm."prefJobSeniorityMin",
      pm."prefJobSeniorityMax",
      pm."prefEducationLevelMin",
      pm."prefEducationLevelMax",
      
      -- Computed age with fallback
      COALESCE(
        EXTRACT(YEAR FROM AGE(p."birthDate"))::int,
        pm."inferredAge"
      ) as "age",

      -- 🆕 V2.2: ScannedPair info (if exists)
      sp.id as "existingScannedPairId",
      sp."aiScore" as "existingAiScore",
      sp."lastScannedAt" as "scannedPairLastScannedAt",
      sp."maleProfileUpdatedAt" as "scannedPairMaleProfileUpdatedAt",
      sp."femaleProfileUpdatedAt" as "scannedPairFemaleProfileUpdatedAt"
      
    FROM "Profile" p 
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    
    -- 🆕 V2.2: LEFT JOIN to ScannedPair
    LEFT JOIN "ScannedPair" sp ON (
      (${userGender}::"Gender" = 'MALE' AND sp."maleUserId" = ${userId} AND sp."femaleUserId" = p."userId")
      OR 
      (${userGender}::"Gender" = 'FEMALE' AND sp."femaleUserId" = ${userId} AND sp."maleUserId" = p."userId")
    )

    WHERE 
      p.gender = ${oppositeGender}::"Gender"
      AND (
        u.status = 'ACTIVE'
        OR (u.status = 'PENDING_EMAIL_VERIFICATION' AND u.source = 'MANUAL_ENTRY')
      )
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND p.id != ${profileId}
      AND COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") >= ${preferredAgeMin}
      AND COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") <= ${preferredAgeMax}
      AND (
        COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin") IS NULL 
        OR ${userAge} >= COALESCE(p."preferredAgeMin", pm."inferredPreferredAgeMin")
      )
      AND (
        COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax") IS NULL 
        OR ${userAge} <= COALESCE(p."preferredAgeMax", pm."inferredPreferredAgeMax")
      )
      AND (
        ${preferredPartnerHasChildren} = 'does_not_matter'
        OR ${preferredPartnerHasChildren} = 'yes_ok'
        OR (${preferredPartnerHasChildren} = 'no_preferred' 
            AND (p."hasChildrenFromPrevious" IS NULL OR p."hasChildrenFromPrevious" = false))
      )
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
      
    ORDER BY 
      -- 🆕 V2.2: Prioritize candidates we haven't scanned yet
      CASE WHEN sp.id IS NULL THEN 0 ELSE 1 END,
      pm."confidenceScore" DESC NULLS LAST
    LIMIT ${maxCandidates}
  `;

  return candidates.map(c => ({
    profileId: c.profileId,
    userId: c.userId,
    firstName: c.firstName,
    lastName: c.lastName,
    gender: c.gender,
    birthDate: c.birthDate,
    age: c.age,
    city: c.city,
    religiousLevel: c.religiousLevel,
    religiousJourney: c.religiousJourney || null,
    occupation: c.occupation,
    education: c.education,
    educationLevel: c.educationLevel,
    about: c.about,
    matchingNotes: c.matchingNotes,
    parentStatus: c.parentStatus,
    hasChildrenFromPrevious: c.hasChildrenFromPrevious,
    nativeLanguage: c.nativeLanguage,
    additionalLanguages: c.additionalLanguages || [],
    aliyaCountry: c.aliyaCountry,
    aliyaYear: c.aliyaYear,
    origin: c.origin,
    preferredAgeMin: c.preferredAgeMin,
    preferredAgeMax: c.preferredAgeMax,
    smokingStatus: c.smokingStatus || null,
    profileUpdatedAt: c.profileUpdatedAt,
    contentUpdatedAt: c.contentUpdatedAt ?? c.profileUpdatedAt,

    // 🆕 V2.2: Map new fields
    existingScannedPairId: c.existingScannedPairId,
    existingAiScore: c.existingAiScore,
    scannedPairLastScannedAt: c.scannedPairLastScannedAt,
    scannedPairMaleProfileUpdatedAt: c.scannedPairMaleProfileUpdatedAt,
    scannedPairFemaleProfileUpdatedAt: c.scannedPairFemaleProfileUpdatedAt,
    
    metrics: {
      confidenceScore: c.confidenceScore,
      religiousStrictness: c.religiousStrictness,
      socialEnergy: c.socialEnergy,
      careerOrientation: c.careerOrientation,
      urbanScore: c.urbanScore,
      appearancePickiness: c.appearancePickiness,
      spiritualDepth: c.spiritualDepth,
      socioEconomicLevel: c.socioEconomicLevel,
      jobSeniorityLevel: c.jobSeniorityLevel,
      educationLevelScore: c.educationLevelScore,
      inferredAge: c.inferredAge,
      inferredCity: c.inferredCity,
      inferredReligiousLevel: c.inferredReligiousLevel,
      inferredPreferredAgeMin: c.inferredPreferredAgeMin,
      inferredPreferredAgeMax: c.inferredPreferredAgeMax,
      inferredParentStatus: c.inferredParentStatus,
      inferredEducationLevel: c.inferredEducationLevel,
      aiPersonalitySummary: c.aiPersonalitySummary,
      aiSeekingSummary: c.aiSeekingSummary,
      aiBackgroundSummary: c.aiBackgroundSummary,
      aiMatchmakerGuidelines: c.aiMatchmakerGuidelines,
      aiInferredDealBreakers: c.aiInferredDealBreakers,
      aiInferredMustHaves: c.aiInferredMustHaves,
      difficultyFlags: c.difficultyFlags,
      prefSocioEconomicMin: c.prefSocioEconomicMin,
      prefSocioEconomicMax: c.prefSocioEconomicMax,
      prefJobSeniorityMin: c.prefJobSeniorityMin,
      prefJobSeniorityMax: c.prefJobSeniorityMax,
      prefEducationLevelMin: c.prefEducationLevelMin,
      prefEducationLevelMax: c.prefEducationLevelMax,
    },
  }));
}

// ═══════════════════════════════════════════════════════════════
// TIER 2: EXTENDED METRICS + BACKGROUND SCORING (V2.2 Enhanced)
// ═══════════════════════════════════════════════════════════════

async function tier2MetricsScoring(
  candidates: RawCandidate[],
  targetProfile: {
    age: number;
    gender: Gender;
    religiousLevel: string | null;
    preferredReligiousJourneys: string[];
    backgroundProfile: BackgroundProfile;
    metrics: ExtendedMetrics;
    profileUpdatedAt: Date;
    contentUpdatedAt: Date; // significant changes only
  },
  useVectors: boolean,
  useBackgroundAnalysis: boolean,
  maxOutput: number,
  skipAlreadyScannedPairs: boolean = true
): Promise<ScoredCandidate[]> {
  
  const scoredCandidates: ScoredCandidate[] = [];
  let skippedCount = 0;
  
  for (const candidate of candidates) {
    // Check if we can skip this pair (compare significant content changes only)
    const canSkip = skipAlreadyScannedPairs && canSkipPairScan(candidate, targetProfile.contentUpdatedAt);
    
    if (canSkip && candidate.existingAiScore !== null) {
      // Use cached score - much faster!
      console.log(`[Tier2] ⚡ Skipping ${candidate.firstName} - using cached score: ${candidate.existingAiScore}`);
      skippedCount++;
      
      scoredCandidates.push({
        ...candidate,
        metricsScore: candidate.existingAiScore ?? 0,
        vectorScore: null,
        backgroundProfile: null,
        backgroundMatch: null,
        ageScore: null,
        socioEconomicScore: 0,
        educationScore: 0,
        jobSeniorityScore: 0,
        meetsUserMustHaves: true,
        violatesUserDealBreakers: false,
        meetsCandidateMustHaves: true,
        violatesCandidateDealBreakers: false,
        tier2Score: candidate.existingAiScore ?? 0,
        fromScannedPairCache: true, // Mark as cached
      });
      continue;
    }

    // --- Standard Scoring Logic Starts Here ---
    const candidateAge = candidate.age || candidate.metrics.inferredAge || 30;
    const ageScore = calculateAgeScoreForMatch(targetProfile.age, targetProfile.gender, candidateAge);
    
    if (!ageScore.eligible) continue;
    
    const candidateReligious = candidate.religiousLevel || candidate.metrics.inferredReligiousLevel;
    const religiousScore = getReligiousCompatibilityScore(targetProfile.religiousLevel, candidateReligious);

    // Soft journey bonus: +5 if candidate matches preferred journey, -3 if preferences set but no match
    let journeyBonus = 0;
    if (targetProfile.preferredReligiousJourneys?.length && candidate.religiousJourney) {
      if (targetProfile.preferredReligiousJourneys.includes(candidate.religiousJourney)) {
        journeyBonus = 5;
      } else {
        journeyBonus = -3;
      }
    }
    
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
        candidate.matchingNotes,
        candidate.metrics.aiBackgroundSummary
      );
      backgroundMatch = calculateBackgroundMatch(targetProfile.backgroundProfile, backgroundProfile);
    }
    
    const socioEconomicScore = calculateSocioEconomicScore(
      targetProfile.metrics.socioEconomicLevel,
      candidate.metrics.socioEconomicLevel,
      targetProfile.metrics.prefSocioEconomicMin,
      targetProfile.metrics.prefSocioEconomicMax,
      candidate.metrics.prefSocioEconomicMin,
      candidate.metrics.prefSocioEconomicMax
    );
    
    const educationScore = calculateEducationScore(
      targetProfile.metrics.educationLevelScore,
      candidate.metrics.educationLevelScore,
      targetProfile.metrics.prefEducationLevelMin,
      candidate.metrics.prefEducationLevelMin
    );
    
    const jobSeniorityScore = calculateJobSeniorityScore(
      targetProfile.metrics.jobSeniorityLevel,
      candidate.metrics.jobSeniorityLevel,
      targetProfile.metrics.prefJobSeniorityMin,
      candidate.metrics.prefJobSeniorityMin
    );
    
    const dealBreakersCheck = checkDealBreakers(
      candidate,
      targetProfile.metrics.aiInferredDealBreakers
    );
    
    const mustHavesCheck = checkMustHaves(
      candidate,
      targetProfile.metrics.aiInferredMustHaves
    );
    
    if (dealBreakersCheck.violated) {
      console.log(`[Tier2] ${candidate.firstName}: Deal breaker violated - ${dealBreakersCheck.violations.join(', ')}`);
    }
    
    let socialScore = 70;
    if (targetProfile.metrics.socialEnergy !== null && candidate.metrics.socialEnergy !== null) {
      const diff = Math.abs(targetProfile.metrics.socialEnergy - candidate.metrics.socialEnergy);
      socialScore = Math.max(30, 100 - diff * 2);
    }
    
    let careerScore = 70;
    if (targetProfile.metrics.careerOrientation !== null && candidate.metrics.careerOrientation !== null) {
      const diff = Math.abs(targetProfile.metrics.careerOrientation - candidate.metrics.careerOrientation);
      careerScore = Math.max(30, 100 - diff * 2);
    }
    
    const weights = {
      religious: 0.22,
      age: 0.12,
      socioEconomic: 0.12,
      education: 0.10,
      jobSeniority: 0.08,
      social: 0.10,
      career: 0.10,
      background: 0.08,
      urban: 0.08,
    };
    
    let metricsScore = (
      religiousScore * weights.religious +
      ageScore.score * weights.age +
      socioEconomicScore * weights.socioEconomic +
      educationScore * weights.education +
      jobSeniorityScore * weights.jobSeniority +
      socialScore * weights.social +
      careerScore * weights.career +
      (backgroundMatch?.multiplier || 0.7) * 100 * weights.background +
      (100 - Math.abs((targetProfile.metrics.urbanScore || 50) - (candidate.metrics.urbanScore || 50))) * weights.urban
    );
    
    metricsScore = Math.min(100, Math.max(0, metricsScore + journeyBonus));

    if (dealBreakersCheck.violated) {
      metricsScore *= 0.4;
    }
    
    if (!mustHavesCheck.met) {
      metricsScore *= 0.7;
    }
    
    const vectorScore: number | null = null;
    
    let tier2Score = metricsScore;
    
    if (backgroundMatch) {
      tier2Score = tier2Score * backgroundMatch.multiplier;
      tier2Score += backgroundMatch.bonusPoints;
    }
    
    if (vectorScore !== null) {
      tier2Score = tier2Score * 0.7 + vectorScore * 0.3;
    }
    
    tier2Score = Math.min(100, Math.max(0, Math.round(tier2Score)));
    // 🆕 חישוב scoreBreakdown מ-metrics עבור cached candidates
    const tier2Breakdown: ScoreBreakdown = {
      religious: Math.round(religiousScore * 25 / 100),
      ageCompatibility: Math.round(ageScore.score * 10 / 100),
      careerFamily: Math.round(((careerScore + jobSeniorityScore) / 2) * 15 / 100),
      lifestyle: Math.round(((socialScore + (100 - Math.abs((targetProfile.metrics.urbanScore || 50) - (candidate.metrics.urbanScore || 50)))) / 2) * 10 / 100),
      socioEconomic: Math.round(socioEconomicScore * 10 / 100),
      education: Math.round(educationScore * 10 / 100),
      background: Math.round((backgroundMatch?.multiplier || 0.7) * 100 * 10 / 100),
      values: Math.round(((socialScore + careerScore) / 2) * 10 / 100),
    };
    scoredCandidates.push({
      ...candidate,
      metricsScore: Math.round(metricsScore),
      vectorScore,
      backgroundProfile,
      backgroundMatch,
      ageScore,
      socioEconomicScore: Math.round(socioEconomicScore),
      educationScore: Math.round(educationScore),
      jobSeniorityScore: Math.round(jobSeniorityScore),
      meetsUserMustHaves: mustHavesCheck.met,
      violatesUserDealBreakers: dealBreakersCheck.violated,
      meetsCandidateMustHaves: true,
      violatesCandidateDealBreakers: false,
      tier2Score,
            tier2Breakdown,           // 🆕 הוסף שורה זו

      fromScannedPairCache: false, // Not from cache
    });
  }
  
  console.log(`[Tier2] ⚡ Skipped ${skippedCount} pairs using cached scores`);
  scoredCandidates.sort((a, b) => b.tier2Score - a.tier2Score);
  
  return scoredCandidates.slice(0, maxOutput);
}

// ═══════════════════════════════════════════════════════════════
// TIER 3: AI FIRST PASS (Updated with tracking)
// ═══════════════════════════════════════════════════════════════

async function tier3AIFirstPass(
  candidates: ScoredCandidate[],
  targetProfile: {
    name: string;
    age: number;
    gender: Gender;
    city: string | null;
    religiousLevel: string | null;
    occupation: string | null;
    backgroundProfile: BackgroundProfile;
    metrics: ExtendedMetrics;
  },
  maxOutput: number,
  preferenceSummary?: string | null
): Promise<{ candidates: AIFirstPassCandidate[]; stats: AICallStats['tier3FirstPass'] }> {
  
  const model = await getGeminiModel();
  const allResults: AIFirstPassCandidate[] = [];
  
  // 🆕 V2.3: Initialize stats
  const stats: AICallStats['tier3FirstPass'] = {
    batchesSent: 0,
    candidatesAnalyzed: 0,
    cachedSkipped: 0,
    callsMade: 0,
    totalTokensEstimated: 0,
    durationMs: 0,
  };
  
  const startTime = Date.now();
  
  // Separate candidates that need AI from cached ones
  const candidatesForAI = candidates.filter(c => !c.fromScannedPairCache);
  const cachedCandidates = candidates.filter(c => c.fromScannedPairCache);
  
  stats.cachedSkipped = cachedCandidates.length;
  
  // Process cached candidates immediately
  // Process cached candidates - use tier2 breakdown instead of zeros
  for (const c of cachedCandidates) {
    allResults.push({
      ...c,
      aiFirstPassScore: c.tier2Score,
      scoreBreakdown: c.tier2Breakdown || { religious: 0, ageCompatibility: 0, careerFamily: 0, lifestyle: 0, socioEconomic: 0, education: 0, background: 0, values: 0 },
      shortReasoning: 'Previously analyzed (Cached)',
      tier3Score: c.tier2Score,
    });
  }

  // Process new candidates
  const totalBatches = Math.ceil(candidatesForAI.length / AI_BATCH_SIZE);
  
  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batchStart = batchIdx * AI_BATCH_SIZE;
    const batchEnd = Math.min(batchStart + AI_BATCH_SIZE, candidatesForAI.length);
    const batch = candidatesForAI.slice(batchStart, batchEnd);
    
    const prompt = generateEnhancedFirstPassPrompt(targetProfile, batch, batchIdx + 1, totalBatches, preferenceSummary);
    
    // 🆕 V2.3: Estimate tokens (rough: ~4 chars per token)
    stats.totalTokensEstimated += Math.ceil(prompt.length / 4);
    
    try {
      stats.callsMade++;
      stats.batchesSent++;

      const result = await generateContentWithTimeout(model, prompt, 90_000);
      const jsonString = result.response.text();

      // 🆕 V2.3: Add response tokens
      stats.totalTokensEstimated += Math.ceil(jsonString.length / 4);
      
      const parsed = parseJsonResponse<{ candidates: any[] }>(jsonString);
      
      for (const aiResult of parsed.candidates || []) {
        const candidate = batch[aiResult.index - 1];
        if (!candidate) continue;
        
        stats.candidatesAnalyzed++;
        
        const aiScore = Math.min(100, Math.max(0, aiResult.totalScore || 0));
        const breakdown: ScoreBreakdown = aiResult.breakdown || {
          religious: 0, ageCompatibility: 0, careerFamily: 0,
          lifestyle: 0, socioEconomic: 0, education: 0, background: 0, values: 0
        };
        
        const tier3Score = Math.round(candidate.tier2Score * 0.45 + aiScore * 0.55);
        
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
      for (const candidate of batch) {
        allResults.push({
          ...candidate,
          aiFirstPassScore: candidate.tier2Score,
          scoreBreakdown: {
            religious: 0, ageCompatibility: 0, careerFamily: 0,
            lifestyle: 0, socioEconomic: 0, education: 0, background: 0, values: 0
          },
          shortReasoning: 'AI analysis unavailable',
          tier3Score: candidate.tier2Score,
        });
      }
    }
    
    if (batchIdx < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  stats.durationMs = Date.now() - startTime;
  
  // 🆕 V2.3: Log stats
  console.log(`[Tier3] AI Stats: ${stats.callsMade} calls, ${stats.candidatesAnalyzed} analyzed, ${stats.cachedSkipped} cached, ~${stats.totalTokensEstimated} tokens`);
  
  allResults.sort((a, b) => b.tier3Score - a.tier3Score);
  return { 
    candidates: allResults.slice(0, maxOutput),
    stats 
  };
}

// ... (Enhanced Prompts Logic remains same as V2.1)
function generateEnhancedFirstPassPrompt(
  targetProfile: {
    name: string;
    age: number;
    gender: Gender;
    city: string | null;
    religiousLevel: string | null;
    occupation: string | null;
    backgroundProfile: BackgroundProfile;
    metrics: ExtendedMetrics;
  },
  candidates: ScoredCandidate[],
  batchNum: number,
  totalBatches: number,
  preferenceSummary?: string | null
): string {
  
  const dealBreakersSection = targetProfile.metrics.aiInferredDealBreakers?.length
    ? `
╔══════════════════════════════════════════════════════════════╗
║  🚫 קווי אדום (DEAL BREAKERS) - חובה לבדוק!                  ║
╠══════════════════════════════════════════════════════════════╣
${targetProfile.metrics.aiInferredDealBreakers.map(db => `║  • ${db}`).join('\n')}
╚══════════════════════════════════════════════════════════════╝
⚠️ אם מועמד/ת מפר/ה קו אדום - ציון מקסימלי 40!
`
    : '';

  const mustHavesSection = targetProfile.metrics.aiInferredMustHaves?.length
    ? `
┌──────────────────────────────────────────────────────────────┐
│  ✅ חובות (MUST HAVES)                                       │
├──────────────────────────────────────────────────────────────┤
${targetProfile.metrics.aiInferredMustHaves.map(mh => `│  • ${mh}`).join('\n')}
└──────────────────────────────────────────────────────────────┘
`
    : '';

  const backgroundGuidelines = getBackgroundMatchingGuidelines(
    targetProfile.backgroundProfile.category
  );

  const targetSummary = `
שם: ${targetProfile.name}
גיל: ${targetProfile.age}
מגדר: ${targetProfile.gender === 'MALE' ? 'גבר' : 'אישה'}
עיר: ${targetProfile.city || targetProfile.metrics.inferredCity || 'לא צוין'}
רמה דתית: ${targetProfile.religiousLevel || targetProfile.metrics.inferredReligiousLevel || 'לא צוין'}
מקצוע: ${targetProfile.occupation || 'לא צוין'}
רקע: ${BACKGROUND_DESCRIPTIONS[targetProfile.backgroundProfile.category]}

=== סיכום אישיות (AI) ===
${targetProfile.metrics.aiPersonalitySummary || 'לא זמין'}

=== מה מחפש/ת ===
${targetProfile.metrics.aiSeekingSummary || 'לא זמין'}

=== רקע מפורט ===
${targetProfile.metrics.aiBackgroundSummary || 'לא זמין'}

=== הנחיות שדכן ===
${targetProfile.metrics.aiMatchmakerGuidelines || 'אין הנחיות מיוחדות'}

=== מדדים ===
רמה כלכלית: ${targetProfile.metrics.socioEconomicLevel || 'N/A'}/10
ותק תעסוקתי: ${targetProfile.metrics.jobSeniorityLevel || 'N/A'}/10
השכלה: ${targetProfile.metrics.educationLevelScore || 'N/A'}/10
אנרגיה חברתית: ${targetProfile.metrics.socialEnergy || 'N/A'}/100
כיוון קריירה: ${targetProfile.metrics.careerOrientation || 'N/A'}/100
`;

  const candidatesText = candidates.map((c, idx) => {
    const age = c.age || c.metrics.inferredAge || 'לא ידוע';
    const city = c.city || c.metrics.inferredCity || 'לא צוין';
    const religious = c.religiousLevel || c.metrics.inferredReligiousLevel || 'לא צוין';
    const candidateBgDesc = c.backgroundProfile 
      ? BACKGROUND_DESCRIPTIONS[c.backgroundProfile.category]
      : 'לא ידוע';
    
    return `
[${idx + 1}] ${c.firstName} ${c.lastName}
גיל: ${age} | עיר: ${city} | דתיות: ${religious}
מקצוע: ${c.occupation || 'לא צוין'}
רקע: ${candidateBgDesc}
התאמת רקע: ${c.backgroundMatch?.compatibility || 'N/A'}
ציון מקדים: ${c.tier2Score}/100

=== סיכום אישיות ===
${c.metrics.aiPersonalitySummary || c.about?.substring(0, 300) || 'לא זמין'}

=== מחפש/ת ===
${c.metrics.aiSeekingSummary || 'לא זמין'}

=== קווי אדום של המועמד/ת ===
${c.metrics.aiInferredDealBreakers?.join(', ') || 'לא צוין'}

=== מדדים ===
כלכלי: ${c.metrics.socioEconomicLevel || 'N/A'} | השכלה: ${c.metrics.educationLevelScore || 'N/A'} | ותק: ${c.metrics.jobSeniorityLevel || 'N/A'}
חברתי: ${c.metrics.socialEnergy || 'N/A'} | קריירה: ${c.metrics.careerOrientation || 'N/A'}

${c.tagMatchDetails ? `\n=== התאמת תגים (Soul Fingerprint) ===\n${c.tagMatchDetails}\nציון תגים: ${c.tagScore ?? 'N/A'}` : ''}
${c.violatesUserDealBreakers ? '⚠️ מפר/ה Deal Breaker של המחפש/ת!' : ''}
${!c.meetsUserMustHaves ? '⚠️ חסר Must Have' : ''}
---`;
  }).join('\n');

  return `אתה שדכן AI מקצועי ב-NeshamaTech. נתח התאמות בין פרופילים.
(Batch ${batchNum}/${totalBatches})

${dealBreakersSection}
${mustHavesSection}

═══════════════════════════════════════
הנחיות התאמת רקע (${BACKGROUND_DESCRIPTIONS[targetProfile.backgroundProfile.category]}):
═══════════════════════════════════════
${backgroundGuidelines}

═══════════════════════════════════════
פרופיל המחפש/ת:
═══════════════════════════════════════
${targetSummary}

═══════════════════════════════════════
מועמדים (${candidates.length}):
═══════════════════════════════════════
${candidatesText}

═══════════════════════════════════════
מערכת ציון (100 נקודות):
═══════════════════════════════════════
1. התאמה דתית (25 נק') - רמה דתית, השקפה
2. התאמת גיל (10 נק') - פער גילאים
3. קריירה-משפחה (15 נק') - שאיפות, איזון
4. סגנון חיים (10 נק') - חברתיות, תחביבים
5. התאמה סוציו-אקונומית (10 נק') - רמה כלכלית
6. התאמת השכלה (10 נק') - רמת ותחום השכלה
7. התאמת רקע (10 נק') - שפה, מוצא, עלייה
8. ערכים ותקשורת (10 נק') - ערכים משותפים

═══════════════════════════════════════
הוראות קריטיות:
═══════════════════════════════════════
⚠️ בדוק DEAL BREAKERS קודם! אם יש הפרה - ציון מקסימום 40
⚠️ בדוק התאמת רקע - עולה חדש עם צבר זה אתגר משמעותי
⚠️ התייחס להנחיות השדכן אם קיימות
⚠️ נמק בקצרה (משפט אחד)
${preferenceSummary ? `
═══════════════════════════════════════
📊 למידה מהיסטוריית תגובות המשתמש:
═══════════════════════════════════════
${preferenceSummary}
⚠️ שקול מידע זה בניתוח - התאם ציון בהתאם להעדפות שנלמדו
` : ''}
═══════════════════════════════════════
פורמט JSON בלבד:
═══════════════════════════════════════
{
  "candidates": [
    {
      "index": 1,
      "totalScore": 85,
      "breakdown": {
        "religious": 22,
        "ageCompatibility": 9,
        "careerFamily": 13,
        "lifestyle": 8,
        "socioEconomic": 9,
        "education": 8,
        "background": 8,
        "values": 8
      },
      "shortReasoning": "התאמה טובה ברמה דתית וכלכלית, רקע דומה"
    }
  ]
}`;
}

function getBackgroundMatchingGuidelines(category: BackgroundCategory): string {
  const guidelines: Record<BackgroundCategory, string> = {
    sabra: `
- צבר/ית ישראלי/ת מחפש/ת בדרך כלל מישהו עם עברית שפת אם
- התאמה מצוינת: צבר, צבר בינלאומי, עולה ותיק
- התאמה בעייתית: עולה חדש (פערי תרבות ושפה)
- חשוב לבדוק: האם המועמד/ת רוצה בן/בת זוג מרקע מסוים?`,
    sabra_international: `
- צבר/ית עם רקע בינלאומי - פתוח/ה יותר לרקעים שונים
- התאמה מצוינת: כל הרקעים חוץ מעולה חדש מאוד
- יתרון: הבנה של תרבויות שונות, רגישות לאתגרי קליטה
- חשוב לבדוק: שפות משותפות מעבר לעברית`,
    oleh_veteran: `
- עולה ותיק/ה (10+ שנים) - משולב/ת היטב בחברה הישראלית
- התאמה מצוינת: צברים, עולים ותיקים, עולים בתהליך
- יתרון: מבין/ה את חווית העלייה אבל גם את התרבות המקומית
- חשוב לבדוק: ארץ מוצא משותפת = בונוס משמעותי`,
    oleh_mid: `
- עולה בתהליך קליטה (3-10 שנים) - עדיין בהשתלבות
- התאמה מצוינת: עולים אחרים (כל הוותקים), צבר בינלאומי
- התאמה מאתגרת: צבר "טהור" ללא רקע בינלאומי
- חשוב לבדוק: רמת עברית, תמיכה בתהליך הקליטה`,
    oleh_new: `
- עולה חדש/ה (פחות מ-3 שנים) - בתחילת הדרך
- התאמה מצוינת: עולים חדשים וותיקים מאותה ארץ
- התאמה מאתגרת מאוד: צברים ללא רקע בינלאומי
- חשוב מאוד: שפה משותפת, ארץ מוצא, קהילת תמיכה
- זהירות: פערי תרבות יכולים להיות משמעותיים מאוד`,
  };
  return guidelines[category];
}

// ═══════════════════════════════════════════════════════════════
// TIER 4: AI DEEP ANALYSIS (Updated with tracking)
// ═══════════════════════════════════════════════════════════════

async function tier4AIDeepAnalysis(
  candidates: AIFirstPassCandidate[],
  targetProfile: {
    name: string;
    age: number;
    gender: Gender;
    city: string | null;
    religiousLevel: string | null;
    occupation: string | null;
    about: string | null;
    backgroundProfile: BackgroundProfile;
    metrics: ExtendedMetrics;
  },
  preferenceSummary?: string | null
): Promise<{ candidates: FinalCandidate[]; stats: AICallStats['tier4DeepAnalysis'] }> {
  
  const model = await getGeminiModel();
  
  // 🆕 V2.3: Initialize stats
  const stats: AICallStats['tier4DeepAnalysis'] = {
    candidatesAnalyzed: 0,
    cachedSkipped: 0,
    callsMade: 0,
    totalTokensEstimated: 0,
    durationMs: 0,
  };
  
  const startTime = Date.now();
  
  const candidatesForAI = candidates.filter(c => !c.fromScannedPairCache);
  const cachedCandidates = candidates.filter(c => c.fromScannedPairCache);
  const finalCandidates: FinalCandidate[] = [];

  stats.cachedSkipped = cachedCandidates.length;

  // Reconstruct cached ones
  cachedCandidates.forEach((c, idx) => {
    finalCandidates.push({
      ...c,
      finalScore: c.tier3Score,
      rank: 999, // Will sort later
      detailedReasoning: c.shortReasoning || 'Scanned pair (cached)',
      recommendation: c.tier3Score >= 70 ? 'GOOD' : 'FAIR',
      strengths: [],
      concerns: [],
    });
  });

  if (candidatesForAI.length > 0) {
    const prompt = generateEnhancedDeepAnalysisPrompt(targetProfile, candidatesForAI, preferenceSummary);
    
    // 🆕 V2.3: Estimate tokens
    stats.totalTokensEstimated += Math.ceil(prompt.length / 4);
    
    try {
      stats.callsMade++;

      const result = await generateContentWithTimeout(model, prompt, 90_000);
      const jsonString = result.response.text();

      // 🆕 V2.3: Add response tokens
      stats.totalTokensEstimated += Math.ceil(jsonString.length / 4);
      
      const parsed = parseJsonResponse<{ deepAnalysis: any[] }>(jsonString);
      
      for (const aiResult of parsed.deepAnalysis || []) {
        const candidate = candidatesForAI[aiResult.index - 1];
        if (!candidate) continue;

        stats.candidatesAnalyzed++;

        // 🆕 V3: Extract bidirectional scores
        const scoreAtoB = aiResult.scoreAtoB !== undefined
          ? Math.min(100, Math.max(0, aiResult.scoreAtoB))
          : undefined;
        const scoreBtoA = aiResult.scoreBtoA !== undefined
          ? Math.min(100, Math.max(0, aiResult.scoreBtoA))
          : undefined;

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
          scoreBreakdown: aiResult.breakdown || candidate.scoreBreakdown,
          detailedReasoning: aiResult.detailedReasoning || candidate.shortReasoning,
          recommendation,
          suggestedApproach: aiResult.suggestedApproach || undefined,
          strengths: aiResult.strengths || [],
          concerns: aiResult.concerns || [],
          scoreAtoB,
          scoreBtoA,
          reasoningAtoB: aiResult.reasoningAtoB || undefined,
          reasoningBtoA: aiResult.reasoningBtoA || undefined,
        });
      }
    } catch (error) {
      console.error(`[Tier4] Deep analysis failed:`, error);
      candidatesForAI.forEach((c, idx) => {
        finalCandidates.push({
          ...c,
          finalScore: c.tier3Score,
          rank: idx + 1,
          detailedReasoning: c.shortReasoning,
          recommendation: c.tier3Score >= 70 ? 'GOOD' : 'FAIR',
          strengths: [],
          concerns: [],
        });
      });
    }
  }

  stats.durationMs = Date.now() - startTime;
  
  // 🆕 V2.3: Log stats
  console.log(`[Tier4] AI Stats: ${stats.callsMade} calls, ${stats.candidatesAnalyzed} analyzed, ${stats.cachedSkipped} cached, ~${stats.totalTokensEstimated} tokens`);

  finalCandidates.sort((a, b) => b.finalScore - a.finalScore);
  // Re-assign ranks
  return { 
    candidates: finalCandidates.map((c, i) => ({ ...c, rank: i + 1 })),
    stats 
  };
}

function generateEnhancedDeepAnalysisPrompt(
  targetProfile: {
    name: string;
    age: number;
    gender: Gender;
    city: string | null;
    religiousLevel: string | null;
    occupation: string | null;
    about: string | null;
    backgroundProfile: BackgroundProfile;
    metrics: ExtendedMetrics;
  },
  candidates: AIFirstPassCandidate[],
  preferenceSummary?: string | null
): string {
  
  const dealBreakersWarning = targetProfile.metrics.aiInferredDealBreakers?.length
    ? `
╔══════════════════════════════════════════════════════════════════════╗
║  🚫 קווי אדום של ${targetProfile.name} (לשימוש פנימי בחישוב הציון)   ║
╠══════════════════════════════════════════════════════════════════════╣
${targetProfile.metrics.aiInferredDealBreakers.map(db => `║  ❌ ${db}`).join('\n')}
╚══════════════════════════════════════════════════════════════════════╝
`
    : '';

  const candidatesText = candidates.map((c, idx) => {
    return `
[${idx + 1}] ${c.firstName} ${c.lastName}
נתונים יבשים: גיל ${c.age || '?'}, ${c.religiousLevel || '?'}, ${c.occupation || '?'}
ציון טכני: ${c.tier3Score}/100

=== מי המועמד/ת (החלק החשוב לנימוק) ===
${c.metrics.aiPersonalitySummary || c.about || 'אין מידע טקסטואלי רב'}

=== מה מחפש/ת ===
${c.metrics.aiSeekingSummary || 'לא זמין'}

${c.tagMatchDetails ? `=== התאמת תגים (Soul Fingerprint) ===\n${c.tagMatchDetails}\nציון תגים: ${c.tagScore ?? 'N/A'}` : ''}
Deal Breakers של המועמד/ת: ${c.metrics.aiInferredDealBreakers?.join(', ') || 'אין'}
---`;
  }).join('\n');

  return `אתה שדכן AI מומחה ב-NeshamaTech.
המטרה שלך כעת היא לא רק לחשב ציונים, אלא **לכתוב את הנימוק שישכנע את המועמדים להיפגש**.

${dealBreakersWarning}

═══════════════════════════════════════
הלקוח/ה שלך: ${targetProfile.name}
═══════════════════════════════════════
מידע אישי: בן/בת ${targetProfile.age}, ${targetProfile.religiousLevel}, ${targetProfile.occupation}
רקע: ${BACKGROUND_DESCRIPTIONS[targetProfile.backgroundProfile.category]}

=== האישיות וה"וייב" (להתייחס לזה בנימוק) ===
${targetProfile.metrics.aiPersonalitySummary || targetProfile.about || 'לא זמין'}

=== מה הוא/היא באמת מחפש/ת ===
${targetProfile.metrics.aiSeekingSummary || 'לא זמין'}

═══════════════════════════════════════
המועמדים לניתוח:
═══════════════════════════════════════
${candidatesText}

═══════════════════════════════════════
הוראות כתיבה קריטיות (חשוב מאוד!):
═══════════════════════════════════════
1. **ניתוח דו-כיווני — זהו הלב של הניתוח:**
   - **scoreAtoB** = כמה המועמד/ת מתאים/ה למה ש-${targetProfile.name} מחפש/ת. (מבוסס על הנתונים של ${targetProfile.name} כצד מחפש)
   - **scoreBtoA** = כמה ${targetProfile.name} מתאים/ה למה שהמועמד/ת מחפש/ת. (מבוסס על הנתונים של המועמד/ת כצד מחפש)
   - **reasoningAtoB** = פסקה קצרה: למה ${targetProfile.name} יתאהב/תתאהב במועמד/ת?
   - **reasoningBtoA** = פסקה קצרה: למה המועמד/ת יתאהב/תתאהב ב-${targetProfile.name}?

2. **הנימוקים חייבים להיות אנושיים וסיפוריים (Narrative):**
   - אל תכתוב רשימת מכולת ("יש התאמה בדת, יש התאמה בגיל").
   - כתוב פסקה של 2-3 שורות שמסבירה למה החיבור הזה יכול לעבוד ברמה הרגשית והאישיותית.
   - התייחס לדינמיקה פוטנציאלית, לאנרגיה, ולערכים משותפים.
   - השתמש בשפה חמה ומקצועית של שדכן, לא של רובוט.

3. **בדיקות טכניות (מאחורי הקלעים):**
   - וודא שאין הפרת Deal Breakers (אם יש - הציון צונח, ציין זאת ב"concerns").
   - התחשב ברקע, שפה ותגיות Soul Fingerprint אם נתונות.

4. **finalScore** = ממוצע משוקלל של שני הכיוונים (scoreAtoB * 0.5 + scoreBtoA * 0.5).
${preferenceSummary ? `
═══════════════════════════════════════
📊 למידה מהיסטוריית תגובות המשתמש:
═══════════════════════════════════════
${preferenceSummary}
⚠️ שקול מידע זה בניתוח - התאם ציון בהתאם להעדפות שנלמדו מתגובות קודמות
` : ''}
═══════════════════════════════════════
פורמט JSON בלבד:
═══════════════════════════════════════
{
  "deepAnalysis": [
    {
      "index": 1,
      "finalScore": 82,
      "scoreAtoB": 90,
      "scoreBtoA": 74,
      "rank": 1,
      "breakdown": {
        "religious": 22,
        "ageCompatibility": 9,
        "careerFamily": 13,
        "lifestyle": 8,
        "socioEconomic": 9,
        "education": 8,
        "background": 8,
        "values": 8
      },
      "detailedReasoning": "סיכום כללי של ההתאמה...",
      "reasoningAtoB": "למה ${targetProfile.name} ימצא/תמצא עניין במועמד/ת...",
      "reasoningBtoA": "למה המועמד/ת ימצא/תמצא עניין ב-${targetProfile.name}...",
      "strengths": ["רקע משותף", "שאיפות דומות"],
      "concerns": ["פער גילאים קטן"],
      "suggestedApproach": "להדגיש את המכנה המשותף התרבותי"
    }
  ]
}`;
}

// ═══════════════════════════════════════════════════════════════
// AI UTILITIES
// ═══════════════════════════════════════════════════════════════

async function getGeminiModel() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
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

// Wraps generateContent with a timeout — prevents indefinite hangs on Gemini
async function generateContentWithTimeout(
  model: Awaited<ReturnType<typeof getGeminiModel>>,
  prompt: string,
  timeoutMs = 90_000 // 90 seconds
): Promise<ReturnType<typeof model.generateContent> extends Promise<infer T> ? T : never> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini API timeout after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    model.generateContent(prompt).then(
      (result) => { clearTimeout(timer); resolve(result as any); },
      (err)    => { clearTimeout(timer); reject(err); }
    );
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
  minScoreToSave: number,
  scanSessionId?: string
): Promise<number> {
  const matchesToSave = matches.filter(m => m.finalScore >= minScoreToSave);
  
  let saved = 0;
  let updated = 0;
  
  for (const match of matchesToSave) {
    const isMale = userGender === Gender.MALE;
    const maleUserId = isMale ? userId : match.userId;
    const femaleUserId = isMale ? match.userId : userId;
    
    try {
      const existing = await prisma.potentialMatch.findFirst({
        where: { maleUserId, femaleUserId },
      });
      
      // 🆕 V3: Build full tag match breakdown with bidirectional data
      const tagBreakdown = (match.tagScore !== undefined || match.scoreAtoB !== undefined) ? {
        tagScore: match.tagScore,
        tagMatchDetails: match.tagMatchDetails,
        aToB: match.scoreAtoB !== undefined ? {
          score: match.scoreAtoB,
          reasoning: match.reasoningAtoB,
        } : undefined,
        bToA: match.scoreBtoA !== undefined ? {
          score: match.scoreBtoA,
          reasoning: match.reasoningBtoA,
        } : undefined,
      } : undefined;

      // 🆕 V3: Use bidirectional scores when available, fallback to old logic
      const scoreForMaleVal = isMale
        ? (match.scoreAtoB ?? match.finalScore)
        : (match.scoreBtoA ?? match.tier3Score);
      const scoreForFemaleVal = isMale
        ? (match.scoreBtoA ?? match.tier3Score)
        : (match.scoreAtoB ?? match.finalScore);
      const asymmetry = Math.abs(scoreForMaleVal - scoreForFemaleVal);

      if (existing) {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            aiScore: match.finalScore,
            firstPassScore: match.tier2Score,
            shortReasoning: match.detailedReasoning,
            scannedAt: new Date(),
            scoreBreakdown: match.scoreBreakdown as any,
            scoreForMale: scoreForMaleVal,
            scoreForFemale: scoreForFemaleVal,
            asymmetryGap: asymmetry,
            hybridScore: match.finalScore,
            hybridReasoning: match.detailedReasoning,
            hybridScannedAt: new Date(),
            hybridScoreBreakdown: match.scoreBreakdown as any,
            ...(tagBreakdown ? { tagMatchBreakdown: tagBreakdown as any } : {}),
            ...(scanSessionId ? { scanSessionId } : {}),
          },
        });
        updated++;
      } else {
        await prisma.potentialMatch.create({
          data: {
            maleUserId,
            femaleUserId,
            aiScore: match.finalScore,
            firstPassScore: match.tier2Score,
            scoreBreakdown: match.scoreBreakdown as any,
            status: 'PENDING',
            shortReasoning: match.detailedReasoning,
            scoreForMale: scoreForMaleVal,
            scoreForFemale: scoreForFemaleVal,
            asymmetryGap: asymmetry,
            hybridScore: match.finalScore,
            hybridReasoning: match.detailedReasoning,
            hybridScannedAt: new Date(),
            hybridScoreBreakdown: match.scoreBreakdown as any,
            ...(tagBreakdown ? { tagMatchBreakdown: tagBreakdown as any } : {}),
            ...(scanSessionId ? { scanSessionId } : {}),
          },
        });
        saved++;
      }
    } catch (error) {
      console.error(`[Save] Failed to save ${match.firstName}:`, error);
    }
  }
  
  await prisma.profile.update({
    where: { id: profileId },
    data: { lastScannedAt: new Date() },
  });
  
  console.log(`[Save] New: ${saved}, Updated: ${updated}`);
  return saved + updated;
}

// ═══════════════════════════════════════════════════════════════
// VIRTUAL PROFILE SCANNING
// ═══════════════════════════════════════════════════════════════

export async function hybridScanForVirtualUser(
  virtualProfile: GeneratedVirtualProfile,
  gender: Gender,
  religiousLevel: string,
  options: VirtualScanOptions = {}
): Promise<VirtualScanResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  const {
    maxCandidates = 50,
    useAIFirstPass = true,
    useAIDeepAnalysis = true,
    minScoreToReturn = 50,
  } = options;
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[VirtualScan] Starting scan for virtual profile`);
  console.log(`${'═'.repeat(70)}`);
  
  const virtualMetrics: ExtendedMetrics = {
    confidenceScore: 80,
    religiousStrictness: null,
    socialEnergy: null,
    careerOrientation: null,
    urbanScore: null,
    appearancePickiness: null,
    spiritualDepth: null,
    socioEconomicLevel: null,
    jobSeniorityLevel: null,
    educationLevelScore: null,
    inferredAge: virtualProfile.inferredAge,
    inferredCity: virtualProfile.inferredCity,
    inferredReligiousLevel: religiousLevel,
    inferredPreferredAgeMin: virtualProfile.preferredAgeMin,
    inferredPreferredAgeMax: virtualProfile.preferredAgeMax,
    inferredParentStatus: virtualProfile.inferredMaritalStatus,
    inferredEducationLevel: virtualProfile.inferredEducation,
    aiPersonalitySummary: virtualProfile.personalitySummary,
    aiSeekingSummary: virtualProfile.lookingForSummary,
    aiBackgroundSummary: null,
    aiMatchmakerGuidelines: null,
    aiInferredDealBreakers: virtualProfile.dealBreakers,
    aiInferredMustHaves: virtualProfile.idealPartnerTraits,
    difficultyFlags: null,
    prefSocioEconomicMin: null,
    prefSocioEconomicMax: null,
    prefJobSeniorityMin: null,
    prefJobSeniorityMax: null,
    prefEducationLevelMin: null,
    prefEducationLevelMax: null,
  };
  
  const virtualBackgroundProfile = createBackgroundProfile(
    null, [], null, null, null, virtualProfile.personalitySummary, null, null
  );
  
  // Reuse SQL filter, but since it's virtual, no user ID filtering or ScannedPair optimization needed
  const oppositeGender = gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
  
  // Using simplified query for virtual
  const candidates = await prisma.$queryRaw<any[]>`
    SELECT 
      p.id as "profileId",
      p."userId",
      u."firstName",
      u."lastName",
      p.gender,
      p."birthDate",
      p.city,
      p."religiousLevel",
      p."religiousJourney",
      p.occupation,
      p.education,
      p."educationLevel",
      p.about,
      p."matchingNotes",
      p."parentStatus",
      p."hasChildrenFromPrevious",
      p."smokingStatus",
      p."nativeLanguage",
      p."additionalLanguages",
      p."aliyaCountry",
      p."aliyaYear",
      p.origin,
      p."preferredAgeMin",
      p."preferredAgeMax",
      p."updatedAt" as "profileUpdatedAt",
      pm."confidenceScore",
      pm."religiousStrictness",
      pm."socialEnergy",
      pm."careerOrientation",
      pm."urbanScore",
      pm."appearancePickiness",
      pm."spiritualDepth",
      pm."socioEconomicLevel",
      pm."jobSeniorityLevel",
      pm."educationLevelScore",
      pm."inferredAge",
      pm."inferredCity",
      pm."inferredReligiousLevel",
      pm."inferredPreferredAgeMin",
      pm."inferredPreferredAgeMax",
      pm."inferredParentStatus",
      pm."inferredEducationLevel",
      pm."aiPersonalitySummary",
      pm."aiSeekingSummary",
      pm."aiBackgroundSummary",
      pm."aiMatchmakerGuidelines",
      pm."aiInferredDealBreakers",
      pm."aiInferredMustHaves",
      pm."difficultyFlags",
      pm."prefSocioEconomicMin",
      pm."prefSocioEconomicMax",
      pm."prefJobSeniorityMin",
      pm."prefJobSeniorityMax",
      pm."prefEducationLevelMin",
      pm."prefEducationLevelMax",
      COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") as "age"
    FROM "Profile" p 
    JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "profile_metrics" pm ON pm."profileId" = p.id
    WHERE 
      p.gender = ${oppositeGender}::"Gender"
      AND (u.status = 'ACTIVE' OR (u.status = 'PENDING_EMAIL_VERIFICATION' AND u.source = 'MANUAL_ENTRY'))
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND (p."isProfileVisible" = true OR p."isProfileVisible" IS NULL)
      AND COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") >= ${virtualProfile.preferredAgeMin}
      AND COALESCE(EXTRACT(YEAR FROM AGE(p."birthDate"))::int, pm."inferredAge") <= ${virtualProfile.preferredAgeMax}
    ORDER BY pm."confidenceScore" DESC NULLS LAST
    LIMIT ${maxCandidates}
  `;

  // Transform to RawCandidate
  const rawCandidates: RawCandidate[] = candidates.map(c => ({
    profileId: c.profileId,
    userId: c.userId,
    firstName: c.firstName,
    lastName: c.lastName,
    gender: c.gender,
    birthDate: c.birthDate,
    age: c.age,
    city: c.city,
    religiousLevel: c.religiousLevel,
    religiousJourney: c.religiousJourney || null,
    occupation: c.occupation,
    education: c.education,
    educationLevel: c.educationLevel,
    about: c.about,
    matchingNotes: c.matchingNotes,
    parentStatus: c.parentStatus,
    hasChildrenFromPrevious: c.hasChildrenFromPrevious,
    nativeLanguage: c.nativeLanguage,
    additionalLanguages: c.additionalLanguages || [],
    aliyaCountry: c.aliyaCountry,
    aliyaYear: c.aliyaYear,
    origin: c.origin,
    preferredAgeMin: c.preferredAgeMin,
    preferredAgeMax: c.preferredAgeMax,
    smokingStatus: c.smokingStatus || null,
    profileUpdatedAt: c.profileUpdatedAt,
    contentUpdatedAt: c.contentUpdatedAt ?? c.profileUpdatedAt,
    metrics: {
      // Map all metrics similarly to standard scan
      confidenceScore: c.confidenceScore,
      religiousStrictness: c.religiousStrictness,
      socialEnergy: c.socialEnergy,
      careerOrientation: c.careerOrientation,
      urbanScore: c.urbanScore,
      appearancePickiness: c.appearancePickiness,
      spiritualDepth: c.spiritualDepth,
      socioEconomicLevel: c.socioEconomicLevel,
      jobSeniorityLevel: c.jobSeniorityLevel,
      educationLevelScore: c.educationLevelScore,
      inferredAge: c.inferredAge,
      inferredCity: c.inferredCity,
      inferredReligiousLevel: c.inferredReligiousLevel,
      inferredPreferredAgeMin: c.inferredPreferredAgeMin,
      inferredPreferredAgeMax: c.inferredPreferredAgeMax,
      inferredParentStatus: c.inferredParentStatus,
      inferredEducationLevel: c.inferredEducationLevel,
      aiPersonalitySummary: c.aiPersonalitySummary,
      aiSeekingSummary: c.aiSeekingSummary,
      aiBackgroundSummary: c.aiBackgroundSummary,
      aiMatchmakerGuidelines: c.aiMatchmakerGuidelines,
      aiInferredDealBreakers: c.aiInferredDealBreakers,
      aiInferredMustHaves: c.aiInferredMustHaves,
      difficultyFlags: c.difficultyFlags,
      prefSocioEconomicMin: c.prefSocioEconomicMin,
      prefSocioEconomicMax: c.prefSocioEconomicMax,
      prefJobSeniorityMin: c.prefJobSeniorityMin,
      prefJobSeniorityMax: c.prefJobSeniorityMax,
      prefEducationLevelMin: c.prefEducationLevelMin,
      prefEducationLevelMax: c.prefEducationLevelMax,
    },
  }));

  const tier2Candidates = await tier2MetricsScoring(
    rawCandidates,
    {
      age: virtualProfile.inferredAge,
      gender: gender,
      religiousLevel: religiousLevel,
      preferredReligiousJourneys: [],
      backgroundProfile: virtualBackgroundProfile,
      metrics: virtualMetrics,
      profileUpdatedAt: new Date(),
      contentUpdatedAt: new Date(), // Virtual profiles are always fresh
    },
    false,
    true,
    maxCandidates,
    false // Don't skip pairs for virtual
  );

  let tier3Candidates: AIFirstPassCandidate[];
  if (useAIFirstPass && tier2Candidates.length > 0) {
    const tier3Result = await tier3AIFirstPass(
      tier2Candidates.filter(c => c.tier2Score >= minScoreToReturn),
      {
        name: 'פרופיל וירטואלי',
        age: virtualProfile.inferredAge,
        gender: gender,
        city: virtualProfile.inferredCity,
        religiousLevel: religiousLevel,
        occupation: virtualProfile.inferredOccupation,
        backgroundProfile: virtualBackgroundProfile,
        metrics: virtualMetrics,
      },
      Math.min(25, tier2Candidates.length)
    );
    tier3Candidates = tier3Result.candidates;
  } else {
    tier3Candidates = tier2Candidates.slice(0, 25).map(c => ({
      ...c,
      aiFirstPassScore: c.tier2Score,
      scoreBreakdown: { religious: 0, ageCompatibility: 0, careerFamily: 0, lifestyle: 0, socioEconomic: 0, education: 0, background: 0, values: 0 },
      shortReasoning: 'AI skipped',
      tier3Score: c.tier2Score,
    }));
  }

  let finalCandidates: FinalCandidate[];
  if (useAIDeepAnalysis && tier3Candidates.length > 0) {
    const tier4Result = await tier4AIDeepAnalysis(
      tier3Candidates.slice(0, 15),
      {
        name: 'פרופיל וירטואלי',
        age: virtualProfile.inferredAge,
        gender: gender,
        city: virtualProfile.inferredCity,
        religiousLevel: religiousLevel,
        occupation: virtualProfile.inferredOccupation,
        about: virtualProfile.displaySummary,
        backgroundProfile: virtualBackgroundProfile,
        metrics: virtualMetrics,
      }
    );
    finalCandidates = tier4Result.candidates;
  } else {
    finalCandidates = tier3Candidates.map((c, idx) => ({
      ...c,
      finalScore: c.tier3Score,
      rank: idx + 1,
      detailedReasoning: c.shortReasoning,
      recommendation: c.tier3Score >= 70 ? 'GOOD' : 'FAIR',
      strengths: [],
      concerns: [],
    }));
  }

  const matches: VirtualMatchCandidate[] = finalCandidates
    .filter(c => c.finalScore >= minScoreToReturn)
    .map(c => ({
      userId: c.userId,
      profileId: c.profileId,
      firstName: c.firstName,
      lastName: c.lastName,
      age: c.age,
      city: c.city || c.metrics.inferredCity,
      religiousLevel: c.religiousLevel || c.metrics.inferredReligiousLevel,
      occupation: c.occupation,
      score: c.finalScore,
      reasoning: c.detailedReasoning,
      recommendation: c.recommendation,
      strengths: c.strengths,
      concerns: c.concerns,
    }));

  return {
    scanStartedAt: new Date(startTime),
    scanCompletedAt: new Date(),
    durationMs: Date.now() - startTime,
    stats: {
      totalCandidatesScanned: rawCandidates.length,
      passedFilters: tier2Candidates.length,
      aiAnalyzed: tier3Candidates.length,
      deepAnalyzed: finalCandidates.length,
    },
    matches,
    warnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION (Updated)
// ═══════════════════════════════════════════════════════════════

export async function hybridScan(
  userId: string,
  options: HybridScanOptions = {}
): Promise<HybridScanResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  // 🆕 V2.3: Initialize AI call stats
  const aiCallStats: AICallStats = {
    tier3FirstPass: {
      batchesSent: 0,
      candidatesAnalyzed: 0,
      cachedSkipped: 0,
      callsMade: 0,
      totalTokensEstimated: 0,
      durationMs: 0,
    },
    tier4DeepAnalysis: {
      candidatesAnalyzed: 0,
      cachedSkipped: 0,
      callsMade: 0,
      totalTokensEstimated: 0,
      durationMs: 0,
    },
    embeddings: {
      callsMade: 0,
      durationMs: 0,
    },
    total: {
      aiCalls: 0,
      embeddingCalls: 0,
      estimatedCost: 0,
    },
  };

  const {
    maxTier1Candidates = 300,
    maxTier2Candidates = 60,
    maxTier3Candidates = 25,
    topForDeepAnalysis = 15,
    useVectors = true,
    useBackgroundAnalysis = true,
    useAIFirstPass = true,
    useAIDeepAnalysis = true,
    useExtendedMetrics = true,
    minScoreToSave = MIN_SCORE_TO_SAVE,
    minScoreForAI = 50,
    forceRefresh = false,
    forceUpdateMetrics = false,
    skipCandidateMetricsUpdate = false,
    maxCandidatesToUpdate = MAX_CANDIDATES_TO_UPDATE,
    autoSave = true,
    skipAlreadyScannedPairs = true,
    saveScannedPairs: shouldSaveScannedPairs = true,
    checkCancelled,
    sessionId: scanSessionId,
  } = options;

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[HybridScan V2.3] Starting for user: ${userId}`);
  console.log(`${'═'.repeat(70)}`);

  const tiersStats = {
    tier0: { candidatesUpdated: 0, durationMs: 0 },
    tier1: { input: 0, output: 0, durationMs: 0 },
    tier2: { input: 0, output: 0, durationMs: 0 },
    tier3: { input: 0, output: 0, durationMs: 0 },
    tier4: { input: 0, output: 0, durationMs: 0 },
  };

  // ═══════════════════════════════════════════════════════════
  // TIER 0: Load User Profile + Update Candidates
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[HybridScan] ═══ TIER 0: Setup & Readiness ═══`);
  const tier0Start = Date.now();
  
  const profile = await prisma.profile.findFirst({
    where: { userId },
    include: { user: true },
  });

  if (!profile) throw new Error(`Profile not found for user: ${userId}`);
  
  const userMetrics = await prisma.$queryRaw<any[]>`
    SELECT * FROM "profile_metrics" WHERE "profileId" = ${profile.id} LIMIT 1
  `;
  const metrics: ExtendedMetrics = userMetrics[0] || {} as ExtendedMetrics;
  
  let userAge: number;
  if (profile.birthDate) {
    userAge = calculateAge(profile.birthDate);
  } else if (metrics?.inferredAge) {
    userAge = metrics.inferredAge;
    console.log(`[HybridScan] Using inferred age: ${userAge}`);
  } else {
    userAge = 30;
    warnings.push('No age found, using default 30');
  }
  
  let preferredAgeMin: number, preferredAgeMax: number;
  if (profile.preferredAgeMin !== null && profile.preferredAgeMax !== null) {
    preferredAgeMin = profile.preferredAgeMin;
    preferredAgeMax = profile.preferredAgeMax;
  } else if (metrics?.inferredPreferredAgeMin && metrics?.inferredPreferredAgeMax) {
    preferredAgeMin = metrics.inferredPreferredAgeMin;
    preferredAgeMax = metrics.inferredPreferredAgeMax;
    console.log(`[HybridScan] Using AI inferred age preferences: ${preferredAgeMin}-${preferredAgeMax}`);
  } else {
    if (profile.gender === Gender.MALE) {
      preferredAgeMin = Math.max(18, userAge - 7);
      preferredAgeMax = userAge + 2;
    } else {
      preferredAgeMin = Math.max(18, userAge - 2);
      preferredAgeMax = userAge + 10;
    }
  }
  
  const userBackgroundProfile = createBackgroundProfile(
    profile.nativeLanguage,
    profile.additionalLanguages || [],
    profile.aliyaCountry,
    profile.aliyaYear,
    profile.origin,
    profile.about,
    profile.matchingNotes,
    metrics.aiBackgroundSummary
  );
  
  await ensureUserReady(profile.id, forceUpdateMetrics);
  const oppositeGender = profile.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;

  if (!skipCandidateMetricsUpdate) {
    const updateResult = await ensureCandidatesReady(oppositeGender, maxCandidatesToUpdate);
    tiersStats.tier0.candidatesUpdated = updateResult.updated;
    if (updateResult.failed > 0) warnings.push(`Failed to update ${updateResult.failed} candidate profiles`);
  }

  // 🆕 V3: Load user tags + generate if missing
  let userTagsGenerated = false;
  let userTags: Awaited<ReturnType<typeof import('./tagMatchingService').loadProfileTags>> = null;
  let userPartnerTags: import('@/components/soul-fingerprint/types').PartnerTagPreferences | null = null;
  let userSectorGroup: string | undefined;
  let userSectionAnswers: Record<string, unknown> | null = null;

  try {
    const { loadProfileTags, getSectorGroupFromTags } = await import('./tagMatchingService');
    userTags = await loadProfileTags(profile.id);

    if (!userTags) {
      // Generate tags from profile data using AI
      try {
        const { generateTagsFromProfileData } = await import('./aiTagGenerationService');
        await generateTagsFromProfileData(profile.userId, profile.id);
        userTags = await loadProfileTags(profile.id);
        userTagsGenerated = true;
        console.log(`[HybridScan] 🏷️ Generated AI tags for user ${profile.user.firstName}`);
      } catch (tagErr) {
        console.warn(`[HybridScan] Failed to generate tags for user:`, tagErr);
      }
    }

    if (userTags) {
      userPartnerTags = userTags.partnerTags as import('@/components/soul-fingerprint/types').PartnerTagPreferences | null;
      userSectorGroup = getSectorGroupFromTags(userTags.sectorTags);
      userSectionAnswers = userTags.sectionAnswers as Record<string, unknown> | null;
    }
  } catch (err) {
    console.warn(`[HybridScan] Tag loading failed:`, err);
  }

  tiersStats.tier0.durationMs = Date.now() - tier0Start;
  console.log(`[HybridScan] Tier 0: Updated ${tiersStats.tier0.candidatesUpdated} candidates in ${tiersStats.tier0.durationMs}ms`);

  if (checkCancelled && await checkCancelled()) {
    throw new Error('Scan cancelled by user request');
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 1: SQL Filtering
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[HybridScan] ═══ TIER 1: SQL Filter (Enhanced) ═══`);
  const tier1Start = Date.now();
  
  const preferredPartnerHasChildren = profile.preferredPartnerHasChildren ?? 'does_not_matter';
  
  const tier1Candidates = await tier1SqlFilter(
    userId,
    profile.id,
    profile.gender,
    userAge,
    profile.religiousLevel,
    preferredAgeMin,
    preferredAgeMax,
    preferredPartnerHasChildren,
    maxTier1Candidates,
    true // includeScannedPairInfo
  );
  
  tiersStats.tier1 = {
    input: maxTier1Candidates,
    output: tier1Candidates.length,
    durationMs: Date.now() - tier1Start,
  };

  console.log(`[HybridScan] Tier 1: ${tier1Candidates.length} candidates in ${tiersStats.tier1.durationMs}ms`);

  if (tier1Candidates.length === 0) {
    return createEmptyResultWithAIStats(userId, profile.id, startTime, tiersStats, aiCallStats, warnings, errors);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 1.5: Tag Hard Filter + Batch Load Tags (V3)
  // ═══════════════════════════════════════════════════════════
  let candidateTagsMap: Map<string, any> = new Map();
  let tagFilteredOut = 0;
  let tier1_5Candidates = tier1Candidates;

  if (userPartnerTags) {
    try {
      const { batchLoadProfileTags, passesExpandedHardFilters } = await import('./tagMatchingService');
      const candidateProfileIds = tier1Candidates.map(c => c.profileId);
      candidateTagsMap = await batchLoadProfileTags(candidateProfileIds);

      console.log(`[HybridScan] 🏷️ Loaded tags for ${candidateTagsMap.size}/${candidateProfileIds.length} candidates`);

      // Apply expanded hard filters
      tier1_5Candidates = tier1Candidates.filter(candidate => {
        const candidateTags = candidateTagsMap.get(candidate.profileId);
        if (!candidateTags) return true; // No tags = no filter

        const candidateAnswers = candidateTags.sectionAnswers as Record<string, unknown> | null;
        const filterResult = passesExpandedHardFilters(
          userPartnerTags,
          { preferredReligiousLevels: profile.preferredReligiousLevels as string[] || undefined },
          candidateTags,
          {
            religiousLevel: candidate.religiousLevel || undefined,
            hasChildren: candidate.hasChildrenFromPrevious || false,
            smoking: candidate.smokingStatus || undefined,
          },
          userSectionAnswers,
          candidateAnswers,
        );

        if (!filterResult.passes) {
          tagFilteredOut++;
          console.log(`[Tier1.5] ❌ ${candidate.firstName}: Failed tag hard filter: ${filterResult.failedFilters.join(', ')}`);
        }
        return filterResult.passes;
      });

      console.log(`[HybridScan] Tier 1.5: ${tier1_5Candidates.length} passed (${tagFilteredOut} filtered out)`);
    } catch (err) {
      console.warn(`[HybridScan] Tier 1.5 tag filter failed, proceeding without:`, err);
      tier1_5Candidates = tier1Candidates;
    }
  }

  if (checkCancelled && await checkCancelled()) {
    throw new Error('Scan cancelled by user request (before Tier 2)');
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 2: Extended Metrics + Background Scoring + Tags (V3)
  // ═══════════════════════════════════════════════════════════
  console.log(`\n[HybridScan] ═══ TIER 2: Extended Metrics + Background + Tags ═══`);
  const tier2Start = Date.now();

  const tier2Candidates = await tier2MetricsScoring(
    tier1_5Candidates,
    {
      age: userAge,
      gender: profile.gender,
      religiousLevel: profile.religiousLevel,
      preferredReligiousJourneys: profile.preferredReligiousJourneys as string[],
      backgroundProfile: userBackgroundProfile,
      metrics: metrics,
      profileUpdatedAt: profile.updatedAt,
      contentUpdatedAt: (profile as any).contentUpdatedAt ?? profile.updatedAt, // significant changes only
    },
    useVectors,
    useBackgroundAnalysis,
    maxTier2Candidates,
    skipAlreadyScannedPairs // 🆕 V2.2
  );

  // 🆕 V3: Inject tag scores into Tier 2 candidates
  if (userPartnerTags && candidateTagsMap.size > 0) {
    try {
      const { calculateTagCompatibility } = await import('./tagMatchingService');
      for (const candidate of tier2Candidates) {
        if (candidate.fromScannedPairCache) continue;
        const candidateTags = candidateTagsMap.get(candidate.profileId);
        if (!candidateTags) continue;
        const candidateAnswers = candidateTags.sectionAnswers as Record<string, unknown> | null;
        const tagResult = calculateTagCompatibility(
          userPartnerTags,
          candidateTags,
          userSectorGroup,
          userSectionAnswers,
          candidateAnswers,
        );
        candidate.tagScore = tagResult.score;

        // Build tag match summary for AI prompt context
        const tagDetails = Object.entries(tagResult.details)
          .filter(([, d]) => d.maxScore > 0)
          .map(([cat, d]) => `${cat}: ${d.score}/${d.maxScore}${d.note ? ` (${d.note})` : ''} [${d.matchedTags.join(', ')}]`)
          .join('\n');
        candidate.tagMatchDetails = tagDetails;

        // Blend tag score into tier2Score: 35% tags + 65% original
        const normalizedTagScore = (tagResult.score / tagResult.maxPossibleScore) * 100;
        candidate.tier2Score = Math.round(candidate.tier2Score * 0.65 + normalizedTagScore * 0.35);
      }
    } catch (err) {
      console.warn(`[HybridScan] Tag scoring in Tier 2 failed:`, err);
    }

    // Re-sort by new tier2Score
    tier2Candidates.sort((a, b) => b.tier2Score - a.tier2Score);
  }

  tiersStats.tier2 = {
    input: tier1_5Candidates.length,
    output: tier2Candidates.length,
    durationMs: Date.now() - tier2Start,
  };
  
  const skippedFromScannedPair = tier2Candidates.filter(c => c.fromScannedPairCache).length;
  console.log(`[HybridScan] Tier 2: ${tier2Candidates.length} candidates (Skipped AI for: ${skippedFromScannedPair})`);

  if (checkCancelled && await checkCancelled()) {
    throw new Error('Scan cancelled by user request (before AI Batch)');
  }

  // ═══════════════════════════════════════════════════════════
  // Load user feedback preferences for AI prompt injection
  // ═══════════════════════════════════════════════════════════
  let userPreferenceSummary: string | null = null;
  try {
    const { AutoSuggestionFeedbackService } = await import('@/lib/services/autoSuggestionFeedbackService');
    userPreferenceSummary = await AutoSuggestionFeedbackService.getPreferenceSummaryForPrompt(userId);
    if (userPreferenceSummary) {
      console.log(`[HybridScan] 📊 User feedback preferences loaded for AI injection`);
    }

    // Append chat-derived insights if available
    const chatPrefs = await prisma.userMatchingPreferences.findUnique({
      where: { userId },
      select: { chatDerivedInsights: true },
    });
    if (chatPrefs?.chatDerivedInsights) {
      const chatInsight = `\nתובנות משיחת AI עם המשתמש/ת: ${chatPrefs.chatDerivedInsights}`;
      userPreferenceSummary = userPreferenceSummary
        ? userPreferenceSummary + chatInsight
        : chatInsight;
      console.log(`[HybridScan] 💬 Chat-derived insights appended to AI prompt`);
    }
  } catch (err) {
    console.warn(`[HybridScan] ⚠️ Failed to load user preferences:`, err);
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 3: AI First Pass (Updated to capture stats)
  // ═══════════════════════════════════════════════════════════
  let tier3Candidates: AIFirstPassCandidate[];

  if (useAIFirstPass) {
    console.log(`\n[HybridScan] ═══ TIER 3: AI First Pass ═══`);
    const tier3Start = Date.now();
    
    // We send candidates to AI even if cached? No, function handles it internally.
    // We filter for minScore unless it's cached (cached ones might have old high score)
    const candidatesForAI = tier2Candidates.filter(c => c.tier2Score >= minScoreForAI || c.fromScannedPairCache);
    
    // 🆕 V2.3: Capture AI stats
    const tier3Result = await tier3AIFirstPass(
      candidatesForAI,
      {
        name: profile.user.firstName,
        age: userAge,
        gender: profile.gender,
        city: profile.city || metrics.inferredCity,
        religiousLevel: profile.religiousLevel || metrics.inferredReligiousLevel,
        occupation: profile.occupation,
        backgroundProfile: userBackgroundProfile,
        metrics: metrics,
      },
      maxTier3Candidates,
      userPreferenceSummary
    );
    
    tier3Candidates = tier3Result.candidates;
    aiCallStats.tier3FirstPass = tier3Result.stats;
    
    tiersStats.tier3 = {
      input: candidatesForAI.length,
      output: tier3Candidates.length,
      durationMs: Date.now() - tier3Start,
    };
    
    console.log(`[HybridScan] Tier 3: ${tier3Candidates.length} candidates, ${aiCallStats.tier3FirstPass.callsMade} AI calls`);
  } else {
    tier3Candidates = tier2Candidates.slice(0, maxTier3Candidates).map(c => ({
      ...c,
      aiFirstPassScore: c.tier2Score,
      scoreBreakdown: { religious: 0, ageCompatibility: 0, careerFamily: 0, lifestyle: 0, socioEconomic: 0, education: 0, background: 0, values: 0 },
      shortReasoning: 'AI skipped',
      tier3Score: c.tier2Score,
    }));
  }

  if (checkCancelled && await checkCancelled()) {
    throw new Error('Scan cancelled by user request (before Deep Analysis)');
  }

  // ═══════════════════════════════════════════════════════════
  // TIER 4: AI Deep Analysis (Updated to capture stats)
  // ═══════════════════════════════════════════════════════════
  let finalCandidates: FinalCandidate[];
  
  if (useAIDeepAnalysis && tier3Candidates.length > 0) {
    console.log(`\n[HybridScan] ═══ TIER 4: AI Deep Analysis ═══`);
    const tier4Start = Date.now();
    
    const topForDeep = tier3Candidates.slice(0, topForDeepAnalysis);
    
    // 🆕 V2.3: Capture AI stats
    const tier4Result = await tier4AIDeepAnalysis(
      topForDeep,
      {
        name: profile.user.firstName,
        age: userAge,
        gender: profile.gender,
        city: profile.city || metrics.inferredCity,
        religiousLevel: profile.religiousLevel || metrics.inferredReligiousLevel,
        occupation: profile.occupation,
        about: profile.about,
        backgroundProfile: userBackgroundProfile,
        metrics: metrics,
      },
      userPreferenceSummary
    );
    
    finalCandidates = tier4Result.candidates;
    aiCallStats.tier4DeepAnalysis = tier4Result.stats;
    
    tiersStats.tier4 = {
      input: topForDeep.length,
      output: finalCandidates.length,
      durationMs: Date.now() - tier4Start,
    };
    
    console.log(`[HybridScan] Tier 4: ${finalCandidates.length} candidates, ${aiCallStats.tier4DeepAnalysis.callsMade} AI calls`);
  } else {
    finalCandidates = tier3Candidates.map((c, idx) => ({
      ...c,
      finalScore: c.tier3Score,
      rank: idx + 1,
      detailedReasoning: c.shortReasoning,
      recommendation: c.tier3Score >= 70 ? 'GOOD' : 'FAIR',
      strengths: [],
      concerns: [],
    }));
  }

  // ═══════════════════════════════════════════════════════════
  // 🆕 V2.3: Calculate totals
  // ═══════════════════════════════════════════════════════════
  aiCallStats.total = {
    aiCalls: aiCallStats.tier3FirstPass.callsMade + aiCallStats.tier4DeepAnalysis.callsMade,
    embeddingCalls: aiCallStats.embeddings.callsMade,
    // Gemini 2.0 Flash pricing: ~$0.10 per 1M input tokens, ~$0.40 per 1M output tokens
    // Rough estimate: average ~$0.20 per 1M tokens
    estimatedCost: ((aiCallStats.tier3FirstPass.totalTokensEstimated + aiCallStats.tier4DeepAnalysis.totalTokensEstimated) / 1000000) * 0.20,
  };

  // ═══════════════════════════════════════════════════════════
  // SAVE RESULTS
  // ═══════════════════════════════════════════════════════════
  let savedCount = 0;
  let scannedPairsSaved = 0;
  
  if (autoSave && finalCandidates.length > 0) {
    console.log(`\n[HybridScan] ═══ Saving Results ═══`);
    savedCount = await saveResults(userId, profile.id, profile.gender, finalCandidates, minScoreToSave, scanSessionId);
  }
  
  // 🆕 V2.2: Save ScannedPairs
  if (shouldSaveScannedPairs && finalCandidates.length > 0) {
    console.log(`\n[HybridScan] ═══ Saving ScannedPairs ═══`);
    scannedPairsSaved = await saveScannedPairs(
      userId,
      profile.gender,
      (profile as any).contentUpdatedAt ?? profile.updatedAt,
      finalCandidates
    );
  }

  const totalDuration = Date.now() - startTime;
  
  // 🆕 V2.3: Enhanced summary log
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`[HybridScan] ✅ Completed in ${totalDuration}ms`);
  console.log(`[HybridScan] 📊 AI Stats Summary:`);
  console.log(`   Tier 3: ${aiCallStats.tier3FirstPass.callsMade} calls, ${aiCallStats.tier3FirstPass.candidatesAnalyzed} analyzed, ${aiCallStats.tier3FirstPass.cachedSkipped} cached`);
  console.log(`   Tier 4: ${aiCallStats.tier4DeepAnalysis.callsMade} calls, ${aiCallStats.tier4DeepAnalysis.candidatesAnalyzed} analyzed, ${aiCallStats.tier4DeepAnalysis.cachedSkipped} cached`);
  console.log(`   Total: ${aiCallStats.total.aiCalls} AI calls, ~$${aiCallStats.total.estimatedCost.toFixed(4)} estimated cost`);
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
      candidatesWithDifficultyFlags: tier2Candidates.filter(c => c.metrics.difficultyFlags?.length).length,
      scannedPairsSaved,
      // 🆕 V2.2: ScannedPair stats
      skippedFromScannedPair: skippedFromScannedPair,
      newPairsScanned: finalCandidates.filter(c => !c.fromScannedPairCache).length,
      // 🆕 V3: Tag stats
      tagFilteredOut,
      tagsGenerated: userTagsGenerated,
    },
    aiCallStats, // 🆕 V2.3
    matches: finalCandidates,
    warnings,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// 🆕 V2.3: Helper for empty result with AI stats
function createEmptyResultWithAIStats(
  userId: string,
  profileId: string,
  startTime: number,
  tiers: HybridScanResult['tiers'],
  aiCallStats: AICallStats,
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
      candidatesWithDifficultyFlags: 0,
      scannedPairsSaved: 0,
      skippedFromScannedPair: 0,
      newPairsScanned: 0,
    },
    aiCallStats,
    matches: [],
    warnings,
    errors,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export const hybridMatchingService = {
  hybridScan,
  hybridScanForVirtualUser,
  calculateAge,
  calculateAgeScore,
  calculateAgeScoreForMatch,
  createBackgroundProfile,
  calculateBackgroundMatch,
  getReligiousCompatibilityScore,
  calculateSocioEconomicScore,
  calculateEducationScore,
  calculateJobSeniorityScore,
  checkDealBreakers,
  checkMustHaves,
  saveScannedPairs,
};

export default hybridMatchingService;