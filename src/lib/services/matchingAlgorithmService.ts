// src/lib/services/matchingAlgorithmService.ts
// 🎯 אלגוריתם מציאת התאמות V3.4 - NeshamaTech
// משלב סינון חכם + אבחון רקע ושפה + ציון גיל מתקדם + סריקה ב-batches + ניתוח מעמיק
// 🆕 V3.3: סינון סלחני - מכליל מועמדים עם שדות חסרים
// 🆕 V3.4: סריקה דיפרנציאלית + פילטר היסטוריה + שמירה ב-ScannedPair

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Gender, AvailabilityStatus, Prisma, MatchSuggestionStatus, PotentialMatchStatus } from "@prisma/client";
import profileAiService from "./profileAiService";
import type { GeneratedVirtualProfile } from './aiService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AiProfileSummary {
  personalitySummary: string;
  lookingForSummary: string;
}

// קטגוריות רקע
type BackgroundCategory = 
  | 'sabra'              // צבר מובהק
  | 'sabra_international' // צבר עם רקע בינלאומי
  | 'oleh_veteran'       // עולה ותיק (10+ שנים)
  | 'oleh_mid'           // עולה 3-10 שנים
  | 'oleh_new';          // עולה חדש (פחות מ-3 שנים)

// פרופיל רקע
interface BackgroundProfile {
  category: BackgroundCategory;
  confidence: number;              // 0-1, כמה בטוחים בסיווג
  nativeLanguage: string | null;
  additionalLanguages: string[];
  aliyaCountry: string | null;
  aliyaYear: number | null;
  yearsInIsrael: number | null;
  textLanguage: 'hebrew' | 'english' | 'mixed' | 'other';
  hebrewQuality: 'native' | 'strong' | 'moderate' | 'weak' | 'none';
  indicators: string[];            // רשימת סיבות לסיווג
}

// תוצאת התאמת רקע
interface BackgroundMatchResult {
  multiplier: number;              // 0.15 - 1.25
  compatibility: 'excellent' | 'good' | 'possible' | 'problematic' | 'not_recommended';
  bonusPoints: number;             // בונוס שפה משותפת
  reasoning: string;               // הסבר קצר
}

// תוצאת ציון גיל
interface AgeScoreResult {
  score: number;
  eligible: boolean;
  description: string;
}

interface TargetUserData {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: Date;
  age: number;
  religiousLevel: string | null;
  religiousJourney: string | null;
  aiProfileSummary: AiProfileSummary | null;
  narrativeProfile?: string | null;
  backgroundProfile?: BackgroundProfile;
}

interface CandidateData {
  userId: string;
  firstName: string;
  lastName: string;
  age: number | null;  // 🆕 יכול להיות null אם אין birthDate
  religiousLevel: string | null;
  religiousJourney: string | null;
  city: string | null;
  occupation: string | null;
  summaryText: string;
  backgroundProfile?: BackgroundProfile;
  backgroundMatch?: BackgroundMatchResult;
  ageScore?: AgeScoreResult | null;  // 🆕 יכול להיות null
}

interface ScoreBreakdown {
  religious: number;
  ageCompatibility: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

export interface MatchResult {
  userId: string;
  firstName?: string;
  lastName?: string;
  firstPassScore: number;
  finalScore: number;
  scoreBreakdown: ScoreBreakdown;
  shortReasoning: string;
  detailedReasoning: string;
  rank?: number;
  backgroundMultiplier?: number;
  backgroundCompatibility?: string;
  ageScore?: number | null;  // 🆕
}

interface FirstPassResult {
  userId: string;
  firstName: string;
  lastName: string;
  totalScore: number;
  rawScore: number;
  backgroundMultiplier: number;
  breakdown: ScoreBreakdown;
  shortReasoning: string;
}

interface DeepAnalysisResult {
  userId: string;
  finalScore: number;
  rank: number;
  detailedReasoning: string;
}

interface AiFirstPassResponse {
  candidates: Array<{
    index: number;
    totalScore: number;
    breakdown: ScoreBreakdown;
    shortReasoning: string;
  }>;
}

interface AiDeepAnalysisResponse {
  deepAnalysis: Array<{
    index: number;
    userId: string;
    finalScore: number;
    rank: number;
    detailedReasoning: string;
  }>;
}

export interface SavedSearchResult {
  matches: MatchResult[];
  meta: {
    savedAt: Date;
    matchmakerId: string;
    algorithmVersion: string;
    totalCandidatesScanned: number;
    validCandidatesCount: number;
    isStale: boolean;
  };
}

// =============================================================================
// 🆕 V3.4 - TYPES לסריקה דיפרנציאלית
// =============================================================================

/**
 * סיבות לפסילת זוג
 */
export type RejectionReason = 
  | 'age_gap'              // פער גיל גדול מדי
  | 'religious_mismatch'   // אי התאמה דתית
  | 'background_incompatible' // רקע לא תואם
  | 'low_ai_score'         // ציון AI נמוך מ-70
  | 'history_blocked'      // היסטוריה חוסמת (דייט כושל / דחייה)
  | 'dismissed'            // נדחה ע"י השדכן
  | 'no_content'           // אין תוכן בפרופיל
  | null;                  // עבר את כל הסינונים

/**
 * תוצאת בדיקת היסטוריה
 */
interface HistoryCheckResult {
  isBlocked: boolean;
  reason: RejectionReason;
  details?: string;
}

/**
 * תוצאת סריקת זוג
 */
export interface ScannedPairResult {
  maleUserId: string;
  femaleUserId: string;
  aiScore: number | null;
  passedThreshold: boolean;
  rejectionReason: RejectionReason;
  maleProfileUpdatedAt: Date;
  femaleProfileUpdatedAt: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_SIZE = 20;
const TOP_CANDIDATES_COUNT = 15;
const STALE_DAYS = 7;
const CURRENT_YEAR = new Date().getFullYear();

// =============================================================================
// 🆕 V3.4 - CONSTANTS לסריקה דיפרנציאלית
// =============================================================================

/**
 * סטטוסים של MatchSuggestion שחוסמים הצעות חדשות
 */
export const BLOCKING_SUGGESTION_STATUSES: MatchSuggestionStatus[] = [
  'ENDED_AFTER_FIRST_DATE',
  'MATCH_DECLINED',
  'FIRST_PARTY_DECLINED',
  'SECOND_PARTY_DECLINED',
  'CLOSED',
  'CANCELLED',
  'EXPIRED',
];

/**
 * סטטוסים של PotentialMatch שחוסמים סריקה מחדש
 */
export const BLOCKING_POTENTIAL_MATCH_STATUSES: PotentialMatchStatus[] = [
  'DISMISSED',
];

// מטריצת התאמת רקע
const BACKGROUND_COMPATIBILITY_MATRIX: Record<BackgroundCategory, Record<BackgroundCategory, number>> = {
  sabra: {
    sabra: 1.0,
    sabra_international: 1.0,
    oleh_veteran: 0.85,
    oleh_mid: 0.4,
    oleh_new: 0.15,
  },
  sabra_international: {
    sabra: 1.0,
    sabra_international: 1.0,
    oleh_veteran: 1.0,
    oleh_mid: 0.85,
    oleh_new: 0.6,
  },
  oleh_veteran: {
    sabra: 0.85,
    sabra_international: 1.0,
    oleh_veteran: 1.0,
    oleh_mid: 0.85,
    oleh_new: 0.6,
  },
  oleh_mid: {
    sabra: 0.4,
    sabra_international: 0.85,
    oleh_veteran: 0.85,
    oleh_mid: 1.0,
    oleh_new: 0.85,
  },
  oleh_new: {
    sabra: 0.15,
    sabra_international: 0.6,
    oleh_veteran: 0.6,
    oleh_mid: 0.85,
    oleh_new: 1.0,
  },
};

// מיפוי מכפיל לרמת התאמה
function getCompatibilityLevel(multiplier: number): 'excellent' | 'good' | 'possible' | 'problematic' | 'not_recommended' {
  if (multiplier >= 0.95) return 'excellent';
  if (multiplier >= 0.8) return 'good';
  if (multiplier >= 0.55) return 'possible';
  if (multiplier >= 0.3) return 'problematic';
  return 'not_recommended';
}

// ============================================================================
// RELIGIOUS LEVEL MAPPING
// ============================================================================

const RELIGIOUS_LEVEL_ORDER: string[] = [
  'charedi_hasidic',
  'charedi_litvak',
  'charedi_sephardic',
  'chabad',
  'breslov',
  'charedi_modern',
  'dati_leumi_torani',
  'dati_leumi_standard',
  'dati_leumi_liberal',
  'masorti_strong',
  'masorti_light',
  'secular_traditional_connection',
  'secular',
  'spiritual_not_religious',
  'other'
];

export function getCompatibleReligiousLevels(level: string | null): string[] {
  if (!level) return RELIGIOUS_LEVEL_ORDER;
  const index = RELIGIOUS_LEVEL_ORDER.indexOf(level);
  if (index === -1) return RELIGIOUS_LEVEL_ORDER;
  const minIndex = Math.max(0, index - 3);
  const maxIndex = Math.min(RELIGIOUS_LEVEL_ORDER.length - 1, index + 3);
  return RELIGIOUS_LEVEL_ORDER.slice(minIndex, maxIndex + 1);
}

export function areReligiousLevelsCompatible(level1: string | null, level2: string | null): boolean {
  if (!level1 || !level2) return true;
  const compatible = getCompatibleReligiousLevels(level1);
  return compatible.includes(level2);
}

// ============================================================================
// AGE CALCULATION HELPERS
// ============================================================================

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getAgeRange(age: number, gender: Gender): { minAge: number; maxAge: number } {
  if (gender === 'MALE') {
    // לגבר: בת יכולה להיות עד 4 שנים יותר גדולה, או עד 7 שנים יותר צעירה
    return { minAge: age - 7, maxAge: age + 4 };
  } else {
    // לאישה: בן יכול להיות עד 7 שנים יותר גדול, או עד 4 שנים יותר צעיר
    return { minAge: age - 4, maxAge: age + 7 };
  }
}

// ============================================================================
// AGE COMPATIBILITY SCORING
// ============================================================================

/**
 * מחשב ציון התאמת גיל בין גבר לאישה
 */
export function calculateAgeScore(maleAge: number, femaleAge: number): AgeScoreResult {
  const ageDiff = maleAge - femaleAge; // חיובי = הבן גדול יותר
  
  // === מצב אידיאלי: אותו גיל או בן גדול ב-1-3 שנים ===
  if (ageDiff >= 0 && ageDiff <= 3) {
    return { 
      score: 100, 
      eligible: true,
      description: ageDiff === 0 ? 'אותו גיל - אידיאלי' : `הבן גדול ב-${ageDiff} שנים - אידיאלי`
    };
  }
  
  // === בן גדול ב-4-7 שנים - ציון יורד בהדרגה ===
  if (ageDiff > 3 && ageDiff <= 7) {
    const score = 100 - ((ageDiff - 3) * 8);
    return { 
      score: Math.round(score), 
      eligible: true,
      description: `הבן גדול ב-${ageDiff} שנים - פער סביר`
    };
  }
  
  // === בן גדול ב-8+ שנים - פער גדול מדי ===
  if (ageDiff > 7) {
    return { 
      score: 0, 
      eligible: false,
      description: `הבן גדול ב-${ageDiff} שנים - פער גדול מדי`
    };
  }
  
  // === בת גדולה (ageDiff שלילי) ===
  const femaleOlder = Math.abs(ageDiff);
  
  if (femaleOlder === 1) {
    return { 
      score: 80, 
      eligible: true,
      description: 'הבת גדולה בשנה - סביר'
    };
  }
  
  if (femaleOlder === 2) {
    return { 
      score: 65, 
      eligible: true,
      description: 'הבת גדולה ב-2 שנים - פחות מקובל'
    };
  }
  
  if (femaleOlder === 3) {
    return { 
      score: 45, 
      eligible: true,
      description: 'הבת גדולה ב-3 שנים - בעייתי'
    };
  }
  
  if (femaleOlder === 4) {
    return { 
      score: 25, 
      eligible: true,
      description: 'הבת גדולה ב-4 שנים - בעייתי מאוד'
    };
  }
  
  return { 
    score: 0, 
    eligible: false,
    description: `הבת גדולה ב-${femaleOlder} שנים - לא רלוונטי`
  };
}

/**
 * Wrapper function שמקבלת גילאים ומגדר של המועמד המסומן
 */
export function calculateAgeScoreForMatch(
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

// ============================================================================
// BACKGROUND ANALYSIS FUNCTIONS
// ============================================================================

/**
 * מנתח טקסט ומזהה את השפה העיקרית
 */
export function analyzeTextLanguage(text: string | null | undefined): {
  language: 'hebrew' | 'english' | 'mixed' | 'other';
  hebrewQuality: 'native' | 'strong' | 'moderate' | 'weak' | 'none';
  indicators: string[];
} {
  if (!text || text.trim().length === 0) {
    return { language: 'other', hebrewQuality: 'none', indicators: ['no text provided'] };
  }

  const indicators: string[] = [];
  
  // ספירת תווים
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = hebrewChars + latinChars;
  
  if (totalChars === 0) {
    return { language: 'other', hebrewQuality: 'none', indicators: ['no recognizable characters'] };
  }

  const hebrewRatio = hebrewChars / totalChars;
  
  // זיהוי שפה עיקרית
  let language: 'hebrew' | 'english' | 'mixed' | 'other';
  if (hebrewRatio > 0.8) {
    language = 'hebrew';
    indicators.push('primarily Hebrew text');
  } else if (hebrewRatio < 0.2) {
    language = 'english';
    indicators.push('primarily English/Latin text');
  } else {
    language = 'mixed';
    indicators.push('mixed Hebrew and English text');
  }

  // זיהוי מילות מפתח באנגלית
  const englishKeywords = [
    /\b(I am|I'm|looking for|moved to Israel|made aliyah|grew up|born in)\b/i,
    /\b(my family|my parents|I love|I enjoy|I work)\b/i,
  ];
  
  for (const pattern of englishKeywords) {
    if (pattern.test(text)) {
      indicators.push('contains English phrases');
      if (language === 'hebrew') language = 'mixed';
      break;
    }
  }

  // זיהוי איכות עברית
  let hebrewQuality: 'native' | 'strong' | 'moderate' | 'weak' | 'none';
  
  if (language === 'english') {
    hebrewQuality = 'none';
  } else if (language === 'hebrew') {
    const unnaturalPatterns = [
      /אני הוא|אני היא/,
      /יש לי ל/,
      /אני רוצה ל(?!היות|לעשות|ללמוד|לעבוד)/,
    ];
    
    let unnaturalCount = 0;
    for (const pattern of unnaturalPatterns) {
      if (pattern.test(text)) unnaturalCount++;
    }
    
    if (unnaturalCount === 0 && text.length > 100) {
      hebrewQuality = 'native';
      indicators.push('natural Hebrew writing');
    } else if (unnaturalCount <= 1) {
      hebrewQuality = 'strong';
    } else {
      hebrewQuality = 'moderate';
      indicators.push('some unnatural Hebrew patterns');
    }
  } else {
    hebrewQuality = hebrewRatio > 0.5 ? 'moderate' : 'weak';
    indicators.push('Hebrew proficiency unclear from mixed text');
  }

  return { language, hebrewQuality, indicators };
}

/**
 * יוצר פרופיל רקע למועמד
 */
export function createBackgroundProfile(
  nativeLanguage: string | null,
  additionalLanguages: string[],
  aliyaCountry: string | null,
  aliyaYear: number | null,
  origin: string | null,
  aboutText: string | null,
  matchingNotes: string | null
): BackgroundProfile {
  const indicators: string[] = [];
  
  // ניתוח טקסט
  const combinedText = [aboutText, matchingNotes].filter(Boolean).join(' ');
  const textAnalysis = analyzeTextLanguage(combinedText);
  indicators.push(...textAnalysis.indicators);
  
  // חישוב שנים בארץ
  let yearsInIsrael: number | null = null;
  if (aliyaYear) {
    yearsInIsrael = CURRENT_YEAR - aliyaYear;
    indicators.push(`aliyah year: ${aliyaYear} (${yearsInIsrael} years ago)`);
  }
  
  // זיהוי אם כתוב בטקסט על עלייה
  if (combinedText) {
    const aliyaPatterns = [
      /עליתי (מ|ב)/i,
      /עלית[יא]/i,
      /made aliyah/i,
      /moved to israel/i,
      /grew up in (?!israel)/i,
      /born in (?!israel)/i,
      /originally from/i,
    ];
    
    for (const pattern of aliyaPatterns) {
      if (pattern.test(combinedText)) {
        indicators.push('text mentions aliyah/immigration');
        break;
      }
    }
  }
  
  // קביעת קטגוריה
  let category: BackgroundCategory;
  let confidence: number;
  
  const hebrewAsNative = nativeLanguage?.toLowerCase() === 'hebrew' || 
                         nativeLanguage?.toLowerCase() === 'עברית' ||
                         nativeLanguage === 'he';
  
  const noAliyaInfo = !aliyaCountry && !aliyaYear;
  const originIsrael = !origin || origin.toLowerCase() === 'israel' || origin === 'ישראל';
  
  if (hebrewAsNative && noAliyaInfo && originIsrael && textAnalysis.hebrewQuality === 'native') {
    category = 'sabra';
    confidence = 0.95;
    indicators.push('classified as SABRA: Hebrew native, no aliyah info, Israeli origin');
  } else if (hebrewAsNative && (additionalLanguages.length > 0 || !originIsrael)) {
    category = 'sabra_international';
    confidence = 0.85;
    indicators.push('classified as SABRA_INTERNATIONAL: Hebrew native with international background');
  } else if (yearsInIsrael !== null) {
    if (yearsInIsrael >= 10) {
      category = 'oleh_veteran';
      confidence = 0.9;
      indicators.push(`classified as OLEH_VETERAN: ${yearsInIsrael} years in Israel`);
    } else if (yearsInIsrael >= 3) {
      category = 'oleh_mid';
      confidence = 0.9;
      indicators.push(`classified as OLEH_MID: ${yearsInIsrael} years in Israel`);
    } else {
      category = 'oleh_new';
      confidence = 0.9;
      indicators.push(`classified as OLEH_NEW: ${yearsInIsrael} years in Israel`);
    }
  } else if (textAnalysis.language === 'english' && textAnalysis.hebrewQuality === 'none') {
    category = 'oleh_new';
    confidence = 0.7;
    indicators.push('classified as OLEH_NEW (inferred): English text, no Hebrew');
  } else if (textAnalysis.language === 'english' || textAnalysis.hebrewQuality === 'weak') {
    category = 'oleh_mid';
    confidence = 0.6;
    indicators.push('classified as OLEH_MID (inferred): weak Hebrew or English text');
  } else if (textAnalysis.hebrewQuality === 'moderate') {
    category = 'oleh_veteran';
    confidence = 0.5;
    indicators.push('classified as OLEH_VETERAN (inferred): moderate Hebrew quality');
  } else {
    category = 'sabra_international';
    confidence = 0.4;
    indicators.push('classified as SABRA_INTERNATIONAL (default): insufficient data');
  }
  
  return {
    category,
    confidence,
    nativeLanguage,
    additionalLanguages,
    aliyaCountry,
    aliyaYear,
    yearsInIsrael,
    textLanguage: textAnalysis.language,
    hebrewQuality: textAnalysis.hebrewQuality,
    indicators,
  };
}

/**
 * מחשב התאמת רקע בין שני מועמדים
 */
export function calculateBackgroundMatch(
  targetProfile: BackgroundProfile,
  candidateProfile: BackgroundProfile
): BackgroundMatchResult {
  let multiplier = BACKGROUND_COMPATIBILITY_MATRIX[targetProfile.category][candidateProfile.category];
  let bonusPoints = 0;
  const reasons: string[] = [];
  
  // בונוס שפת אם זהה (לא עברית)
  if (targetProfile.nativeLanguage && 
      candidateProfile.nativeLanguage &&
      targetProfile.nativeLanguage.toLowerCase() === candidateProfile.nativeLanguage.toLowerCase() &&
      targetProfile.nativeLanguage.toLowerCase() !== 'hebrew' &&
      targetProfile.nativeLanguage.toLowerCase() !== 'עברית') {
    bonusPoints += 15;
    multiplier = Math.min(1.25, multiplier + 0.15);
    reasons.push(`same native language: ${targetProfile.nativeLanguage}`);
  }
  
  // בונוס שפה נוספת משותפת
  const commonLanguages = targetProfile.additionalLanguages.filter(
    lang => candidateProfile.additionalLanguages.includes(lang) ||
            candidateProfile.nativeLanguage?.toLowerCase() === lang.toLowerCase()
  );
  if (commonLanguages.length > 0) {
    bonusPoints += 8;
    multiplier = Math.min(1.25, multiplier + 0.08);
    reasons.push(`common language(s): ${commonLanguages.join(', ')}`);
  }
  
  // בונוס אותה ארץ מוצא
  if (targetProfile.aliyaCountry && 
      candidateProfile.aliyaCountry &&
      targetProfile.aliyaCountry.toLowerCase() === candidateProfile.aliyaCountry.toLowerCase()) {
    bonusPoints += 10;
    multiplier = Math.min(1.25, multiplier + 0.1);
    reasons.push(`same country of origin: ${targetProfile.aliyaCountry}`);
  }
  
  // בונוס עלייה באותה תקופה (±3 שנים)
  if (targetProfile.aliyaYear && candidateProfile.aliyaYear) {
    const yearDiff = Math.abs(targetProfile.aliyaYear - candidateProfile.aliyaYear);
    if (yearDiff <= 3) {
      bonusPoints += 5;
      multiplier = Math.min(1.25, multiplier + 0.05);
      reasons.push(`similar aliyah period (${yearDiff} year difference)`);
    }
  }
  
  const compatibility = getCompatibilityLevel(multiplier);
  let reasoning = '';
  
  switch (compatibility) {
    case 'excellent':
      reasoning = 'התאמת רקע מצוינת';
      break;
    case 'good':
      reasoning = 'התאמת רקע טובה';
      break;
    case 'possible':
      reasoning = 'התאמת רקע אפשרית';
      break;
    case 'problematic':
      reasoning = 'פער רקע משמעותי';
      break;
    case 'not_recommended':
      reasoning = 'פער רקע בעייתי';
      break;
  }
  
  if (reasons.length > 0) {
    reasoning += ` (${reasons.join('; ')})`;
  }
  
  return {
    multiplier,
    compatibility,
    bonusPoints,
    reasoning,
  };
}

/**
 * מחזיר תיאור טקסטואלי של קטגוריית רקע
 */
function getCategoryDescription(category: BackgroundCategory): string {
  switch (category) {
    case 'sabra': return 'צבר/ית';
    case 'sabra_international': return 'צבר/ית עם רקע בינלאומי';
    case 'oleh_veteran': return 'עולה ותיק/ה (10+ שנים)';
    case 'oleh_mid': return 'עולה (3-10 שנים)';
    case 'oleh_new': return 'עולה חדש/ה';
  }
}

// =============================================================================
// 🆕 V3.4 - פילטר היסטוריה
// =============================================================================

/**
 * בודק אם יש היסטוריה חוסמת בין שני משתמשים
 */
export async function checkBlockingHistory(
  maleUserId: string,
  femaleUserId: string
): Promise<HistoryCheckResult> {
  
  // 1. בדיקת MatchSuggestion - דייטים קודמים
  const blockingSuggestion = await prisma.matchSuggestion.findFirst({
    where: {
      status: { in: BLOCKING_SUGGESTION_STATUSES },
      OR: [
        { firstPartyId: maleUserId, secondPartyId: femaleUserId },
        { firstPartyId: femaleUserId, secondPartyId: maleUserId },
      ]
    },
    select: {
      id: true,
      status: true,
      closedAt: true,
    }
  });

  if (blockingSuggestion) {
    return {
      isBlocked: true,
      reason: 'history_blocked',
      details: `MatchSuggestion ${blockingSuggestion.id} with status ${blockingSuggestion.status}`
    };
  }

  // 2. בדיקת PotentialMatch - האם נדחה ע"י השדכן
  const dismissedMatch = await prisma.potentialMatch.findFirst({
    where: {
      maleUserId,
      femaleUserId,
      status: { in: BLOCKING_POTENTIAL_MATCH_STATUSES }
    },
    select: {
      id: true,
      status: true,
      dismissReason: true,
    }
  });

  if (dismissedMatch) {
    return {
      isBlocked: true,
      reason: 'dismissed',
      details: `PotentialMatch ${dismissedMatch.id} dismissed: ${dismissedMatch.dismissReason || 'no reason'}`
    };
  }

  return {
    isBlocked: false,
    reason: null,
  };
}

/**
 * מסנן רשימת מועמדות לפי היסטוריה חוסמת
 */
export async function filterBlockedFemales(
  maleUserId: string,
  femaleUserIds: string[]
): Promise<{
  allowedIds: string[];
  blockedPairs: Map<string, HistoryCheckResult>;
}> {
  if (femaleUserIds.length === 0) {
    return { allowedIds: [], blockedPairs: new Map() };
  }

  // שליפת כל ה-MatchSuggestions החוסמות בקריאה אחת
  const blockingSuggestions = await prisma.matchSuggestion.findMany({
    where: {
      status: { in: BLOCKING_SUGGESTION_STATUSES },
      OR: [
        { firstPartyId: maleUserId, secondPartyId: { in: femaleUserIds } },
        { firstPartyId: { in: femaleUserIds }, secondPartyId: maleUserId },
      ]
    },
    select: {
      firstPartyId: true,
      secondPartyId: true,
      status: true,
    }
  });

  // שליפת כל ה-PotentialMatches החסומים בקריאה אחת
  const dismissedMatches = await prisma.potentialMatch.findMany({
    where: {
      maleUserId,
      femaleUserId: { in: femaleUserIds },
      status: { in: BLOCKING_POTENTIAL_MATCH_STATUSES }
    },
    select: {
      femaleUserId: true,
      status: true,
      dismissReason: true,
    }
  });

  // בניית מפה של זוגות חסומים
  const blockedPairs = new Map<string, HistoryCheckResult>();

  for (const suggestion of blockingSuggestions) {
    const femaleId = suggestion.firstPartyId === maleUserId 
      ? suggestion.secondPartyId 
      : suggestion.firstPartyId;
    
    blockedPairs.set(femaleId, {
      isBlocked: true,
      reason: 'history_blocked',
      details: `Previous suggestion with status ${suggestion.status}`
    });
  }

  for (const match of dismissedMatches) {
    if (!blockedPairs.has(match.femaleUserId)) {
      blockedPairs.set(match.femaleUserId, {
        isBlocked: true,
        reason: 'dismissed',
        details: `Dismissed by matchmaker: ${match.dismissReason || 'no reason'}`
      });
    }
  }

  const allowedIds = femaleUserIds.filter(id => !blockedPairs.has(id));

  console.log(`[HistoryFilter] Filtered ${femaleUserIds.length} females:`);
  console.log(`  - Allowed: ${allowedIds.length}`);
  console.log(`  - Blocked by suggestion: ${blockingSuggestions.length}`);
  console.log(`  - Blocked by dismissal: ${dismissedMatches.length}`);

  return { allowedIds, blockedPairs };
}

// =============================================================================
// 🆕 V3.4 - שמירה ב-ScannedPair
// =============================================================================

/**
 * שומר תוצאת סריקה ב-ScannedPair
 */
export async function saveScannedPair(result: ScannedPairResult): Promise<void> {
  try {
    await prisma.scannedPair.upsert({
      where: {
        maleUserId_femaleUserId: {
          maleUserId: result.maleUserId,
          femaleUserId: result.femaleUserId,
        }
      },
      create: {
        maleUserId: result.maleUserId,
        femaleUserId: result.femaleUserId,
        aiScore: result.aiScore,
        passedThreshold: result.passedThreshold,
        rejectionReason: result.rejectionReason,
        maleProfileUpdatedAt: result.maleProfileUpdatedAt,
        femaleProfileUpdatedAt: result.femaleProfileUpdatedAt,
        firstScannedAt: new Date(),
        lastScannedAt: new Date(),
      },
      update: {
        aiScore: result.aiScore,
        passedThreshold: result.passedThreshold,
        rejectionReason: result.rejectionReason,
        maleProfileUpdatedAt: result.maleProfileUpdatedAt,
        femaleProfileUpdatedAt: result.femaleProfileUpdatedAt,
        lastScannedAt: new Date(),
      }
    });
  } catch (error) {
    console.error(`[ScannedPair] Error saving pair ${result.maleUserId} - ${result.femaleUserId}:`, error);
  }
}

/**
 * שומר מספר תוצאות סריקה ב-batch
 */
export async function saveScannedPairsBatch(results: ScannedPairResult[]): Promise<void> {
  console.log(`[ScannedPair] Saving ${results.length} scanned pairs...`);
  
  let saved = 0;
  let errors = 0;

  const SAVE_BATCH_SIZE = 50;
  
  for (let i = 0; i < results.length; i += SAVE_BATCH_SIZE) {
    const batch = results.slice(i, i + SAVE_BATCH_SIZE);
    
    const promises = batch.map(result => 
      saveScannedPair(result)
        .then(() => { saved++; })
        .catch(() => { errors++; })
    );
    
    await Promise.all(promises);
  }

  console.log(`[ScannedPair] Completed: ${saved} saved, ${errors} errors`);
}

// =============================================================================
// 🆕 V3.4 - סריקה דיפרנציאלית
// =============================================================================

/**
 * בודק אם זוג צריך סריקה מחדש
 */
export async function needsRescan(
  maleUserId: string,
  femaleUserId: string,
  currentMaleProfileUpdatedAt: Date,
  currentFemaleProfileUpdatedAt: Date
): Promise<{
  needsScan: boolean;
  reason: 'new_pair' | 'male_updated' | 'female_updated' | 'both_updated' | 'no_change';
  existingScannedPair?: {
    passedThreshold: boolean;
    lastScannedAt: Date;
  };
}> {
  const existingPair = await prisma.scannedPair.findUnique({
    where: {
      maleUserId_femaleUserId: { maleUserId, femaleUserId }
    },
    select: {
      passedThreshold: true,
      lastScannedAt: true,
      maleProfileUpdatedAt: true,
      femaleProfileUpdatedAt: true,
    }
  });

  if (!existingPair) {
    return { needsScan: true, reason: 'new_pair' };
  }

  const maleUpdated = existingPair.maleProfileUpdatedAt 
    ? currentMaleProfileUpdatedAt > existingPair.maleProfileUpdatedAt
    : true;
  
  const femaleUpdated = existingPair.femaleProfileUpdatedAt
    ? currentFemaleProfileUpdatedAt > existingPair.femaleProfileUpdatedAt
    : true;

  if (maleUpdated && femaleUpdated) {
    return { 
      needsScan: true, 
      reason: 'both_updated',
      existingScannedPair: {
        passedThreshold: existingPair.passedThreshold,
        lastScannedAt: existingPair.lastScannedAt,
      }
    };
  }

  if (maleUpdated) {
    return { 
      needsScan: true, 
      reason: 'male_updated',
      existingScannedPair: {
        passedThreshold: existingPair.passedThreshold,
        lastScannedAt: existingPair.lastScannedAt,
      }
    };
  }

  if (femaleUpdated) {
    return { 
      needsScan: true, 
      reason: 'female_updated',
      existingScannedPair: {
        passedThreshold: existingPair.passedThreshold,
        lastScannedAt: existingPair.lastScannedAt,
      }
    };
  }

  return { 
    needsScan: false, 
    reason: 'no_change',
    existingScannedPair: {
      passedThreshold: existingPair.passedThreshold,
      lastScannedAt: existingPair.lastScannedAt,
    }
  };
}

/**
 * מחזיר רשימת בחורות שצריך לסרוק עבור גבר מסוים
 */
export async function getFemalesToScan(
  maleUserId: string,
  maleProfileUpdatedAt: Date,
  allFemales: Array<{
    id: string;
    profileUpdatedAt: Date;
  }>
): Promise<{
  femalesToScan: string[];
  skippedByHistory: number;
  skippedByNoChange: number;
  stats: {
    total: number;
    newPairs: number;
    maleUpdated: number;
    femaleUpdated: number;
    bothUpdated: number;
  };
}> {
  const femaleIds = allFemales.map(f => f.id);
  
  console.log(`\n[DifferentialScan] Getting females to scan for male ${maleUserId}`);
  console.log(`[DifferentialScan] Total potential females: ${femaleIds.length}`);

  // שלב 1: פילטר היסטוריה
  const { allowedIds, blockedPairs } = await filterBlockedFemales(maleUserId, femaleIds);
  const skippedByHistory = blockedPairs.size;

  console.log(`[DifferentialScan] After history filter: ${allowedIds.length} (blocked: ${skippedByHistory})`);

  // שלב 2: בדיקת סריקה דיפרנציאלית
  const femalesToScan: string[] = [];
  let skippedByNoChange = 0;
  const stats = {
    total: allowedIds.length,
    newPairs: 0,
    maleUpdated: 0,
    femaleUpdated: 0,
    bothUpdated: 0,
  };

  // שליפת כל ה-ScannedPairs הקיימים בקריאה אחת
  const existingPairs = await prisma.scannedPair.findMany({
    where: {
      maleUserId,
      femaleUserId: { in: allowedIds }
    },
    select: {
      femaleUserId: true,
      passedThreshold: true,
      lastScannedAt: true,
      maleProfileUpdatedAt: true,
      femaleProfileUpdatedAt: true,
    }
  });

  const existingPairsMap = new Map(existingPairs.map(p => [p.femaleUserId, p]));

  for (const femaleId of allowedIds) {
    const female = allFemales.find(f => f.id === femaleId)!;
    const existingPair = existingPairsMap.get(femaleId);

    if (!existingPair) {
      femalesToScan.push(femaleId);
      stats.newPairs++;
      continue;
    }

    const maleUpdated = existingPair.maleProfileUpdatedAt 
      ? maleProfileUpdatedAt > existingPair.maleProfileUpdatedAt
      : true;
    
    const femaleUpdated = existingPair.femaleProfileUpdatedAt
      ? female.profileUpdatedAt > existingPair.femaleProfileUpdatedAt
      : true;

    if (maleUpdated && femaleUpdated) {
      femalesToScan.push(femaleId);
      stats.bothUpdated++;
    } else if (maleUpdated) {
      femalesToScan.push(femaleId);
      stats.maleUpdated++;
    } else if (femaleUpdated) {
      femalesToScan.push(femaleId);
      stats.femaleUpdated++;
    } else {
      skippedByNoChange++;
    }
  }

  console.log(`[DifferentialScan] Final result:`);
  console.log(`  - To scan: ${femalesToScan.length}`);
  console.log(`  - Skipped (history): ${skippedByHistory}`);
  console.log(`  - Skipped (no change): ${skippedByNoChange}`);
  console.log(`  - Breakdown: new=${stats.newPairs}, maleUpdated=${stats.maleUpdated}, femaleUpdated=${stats.femaleUpdated}, both=${stats.bothUpdated}`);

  return {
    femalesToScan,
    skippedByHistory,
    skippedByNoChange,
    stats,
  };
}

// =============================================================================
// 🆕 V3.4 - תמיכה ב-MANUAL_ENTRY
// =============================================================================

/**
 * שאילתת WHERE לשליפת משתמשים פעילים (כולל MANUAL_ENTRY)
 */
export function getActiveUsersWhereClause() {
  return {
    OR: [
      { status: 'ACTIVE' as const },
      { 
        status: 'PENDING_EMAIL_VERIFICATION' as const, 
        source: 'MANUAL_ENTRY' as const 
      }
    ]
  };
}

// ============================================================================
// SAVED RESULTS FUNCTIONS
// ============================================================================

export async function loadSavedMatches(targetUserId: string): Promise<SavedSearchResult | null> {
  console.log(`[Matching V3.4] Loading saved matches for user: ${targetUserId}`);

  const savedSearch = await prisma.savedMatchSearch.findUnique({
    where: { targetUserId },
    select: {
      results: true,
      matchmakerId: true,
      algorithmVersion: true,
      candidatesCount: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!savedSearch) {
    console.log(`[Matching V3.4] No saved search found for user: ${targetUserId}`);
    return null;
  }

  const savedMatches = savedSearch.results as unknown as MatchResult[];
  const savedAt = savedSearch.updatedAt;
  
  const daysSinceSaved = Math.floor((Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceSaved > STALE_DAYS;

  if (savedMatches.length === 0) {
    return {
      matches: [],
      meta: {
        savedAt,
        matchmakerId: savedSearch.matchmakerId,
        algorithmVersion: savedSearch.algorithmVersion,
        totalCandidatesScanned: savedSearch.candidatesCount,
        validCandidatesCount: 0,
        isStale,
      }
    };
  }

  const savedUserIds = savedMatches.map(m => m.userId);

  // 🆕 סינון סלחני גם בטעינה מ-cache (כולל MANUAL_ENTRY)
  const validCandidates = await prisma.user.findMany({
    where: {
      id: { in: savedUserIds },
      OR: [
        { status: 'ACTIVE' },
        { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' }
      ],
      profile: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        isProfileVisible: true
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    }
  });

  const validUserIds = new Set(validCandidates.map(c => c.id));
  const validUserMap = new Map(validCandidates.map(c => [c.id, c]));

  const filteredMatches = savedMatches
    .filter(match => validUserIds.has(match.userId))
    .map(match => {
      const user = validUserMap.get(match.userId);
      return {
        ...match,
        firstName: user?.firstName || match.firstName,
        lastName: user?.lastName || match.lastName,
      };
    });

  const removedCount = savedMatches.length - filteredMatches.length;
  if (removedCount > 0) {
    console.log(`[Matching V3.4] Filtered out ${removedCount} unavailable candidates`);
  }

  console.log(`[Matching V3.4] Loaded ${filteredMatches.length} valid matches (${isStale ? 'STALE' : 'FRESH'})`);

  return {
    matches: filteredMatches,
    meta: {
      savedAt,
      matchmakerId: savedSearch.matchmakerId,
      algorithmVersion: savedSearch.algorithmVersion,
      totalCandidatesScanned: savedSearch.candidatesCount,
      validCandidatesCount: filteredMatches.length,
      isStale,
    }
  };
}

export async function saveMatchResults(
  targetUserId: string,
  matchmakerId: string,
  matches: MatchResult[],
  totalScanned: number,
  algorithmVersion: string = 'v3.4'
): Promise<void> {
  console.log(`[Matching V3.4] Saving ${matches.length} matches for user: ${targetUserId}`);

  await prisma.savedMatchSearch.upsert({
    where: { targetUserId },
    create: {
      targetUserId,
      matchmakerId,
      results: matches as any,
      algorithmVersion,
      candidatesCount: totalScanned,
    },
    update: {
      matchmakerId,
      results: matches as any,
      algorithmVersion,
      candidatesCount: totalScanned,
    }
  });

  console.log(`[Matching V3.4] ✅ Saved matches successfully`);
}

export async function deleteSavedMatches(targetUserId: string): Promise<void> {
  await prisma.savedMatchSearch.deleteMany({
    where: { targetUserId }
  });
  console.log(`[Matching V3.4] Deleted saved matches for user: ${targetUserId}`);
}

// ============================================================================
// TARGET USER DATA FUNCTIONS
// ============================================================================

async function getTargetUserData(userId: string): Promise<TargetUserData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          gender: true,
          birthDate: true,
          religiousLevel: true,
          religiousJourney: true,
          aiProfileSummary: true,
          nativeLanguage: true,
          additionalLanguages: true,
          aliyaCountry: true,
          aliyaYear: true,
          origin: true,
          about: true,
          matchingNotes: true,
        }
      }
    }
  });

  if (!user || !user.profile) return null;

  const age = calculateAge(user.profile.birthDate);
  
  // יצירת פרופיל רקע
  const backgroundProfile = createBackgroundProfile(
    user.profile.nativeLanguage,
    user.profile.additionalLanguages || [],
    user.profile.aliyaCountry,
    user.profile.aliyaYear,
    user.profile.origin,
    user.profile.about,
    user.profile.matchingNotes
  );
  
  console.log(`[Matching V3.4] Target background profile:`, {
    category: backgroundProfile.category,
    confidence: backgroundProfile.confidence,
    nativeLanguage: backgroundProfile.nativeLanguage,
    textLanguage: backgroundProfile.textLanguage,
    hebrewQuality: backgroundProfile.hebrewQuality,
  });
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.profile.gender,
    birthDate: user.profile.birthDate,
    age,
    religiousLevel: user.profile.religiousLevel,
    religiousJourney: user.profile.religiousJourney,
    aiProfileSummary: user.profile.aiProfileSummary as AiProfileSummary | null,
    backgroundProfile,
  };
}

// ============================================================================
// 🆕 V3.4 - LENIENT CANDIDATE FETCHING (עם תמיכה ב-MANUAL_ENTRY)
// ============================================================================

/**
 * סינון סלחני עם תמיכה מלאה ב-MANUAL_ENTRY
 */
async function fetchAllRelevantCandidates(
  targetUser: TargetUserData
): Promise<CandidateData[]> {
  const oppositeGender = targetUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const { minAge, maxAge } = getAgeRange(targetUser.age, targetUser.gender);
  const compatibleReligiousLevels = getCompatibleReligiousLevels(targetUser.religiousLevel);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[V3.4] 🔍 FETCHING CANDIDATES (LENIENT MODE) FOR: ${targetUser.firstName} ${targetUser.lastName}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`[V3.4] Target User Details:`);
  console.log(`  - ID: ${targetUser.id}`);
  console.log(`  - Gender: ${targetUser.gender} → Looking for: ${oppositeGender}`);
  console.log(`  - Age: ${targetUser.age} → Preferred age range: ${minAge}-${maxAge}`);
  console.log(`  - Religious Level: ${targetUser.religiousLevel}`);

  // 🆕 שאילתה עם תמיכה ב-MANUAL_ENTRY
  const candidates = await prisma.user.findMany({
    where: {
      id: { not: targetUser.id },
      
      // סטטוס - כולל MANUAL_ENTRY
      OR: [
        { status: 'ACTIVE' },
        { status: 'PENDING_EMAIL_VERIFICATION', source: 'MANUAL_ENTRY' }
      ],
      
      profile: {
        gender: oppositeGender as Gender,
        
        OR: [
          { about: { not: null } },
          { manualEntryText: { not: null } },
        ],
        
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        isProfileVisible: true
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      source: true,
      profile: {
        select: {
          birthDate: true,
          religiousLevel: true,
          religiousJourney: true,
          city: true,
          occupation: true,
          aiProfileSummary: true,
          about: true,
          manualEntryText: true,
          nativeLanguage: true,
          additionalLanguages: true,
          aliyaCountry: true,
          aliyaYear: true,
          origin: true,
          matchingNotes: true,
        }
      },
      questionnaireResponses: {
        select: { id: true },
        take: 1
      }
    },
    orderBy: {
      profile: {
        updatedAt: 'desc'
      }
    }
  });

  console.log(`[V3.4] Raw query returned ${candidates.length} candidates`);

  // סינון נוסף בקוד + בניית נתונים
  const candidatesWithData: (CandidateData | null)[] = candidates.map(c => {
    const hasContent = !!(c.profile?.about?.trim()) || 
                       !!(c.profile?.manualEntryText?.trim()) || 
                       (c.questionnaireResponses && c.questionnaireResponses.length > 0);
    
    if (!hasContent) {
      console.log(`[V3.4] Skipping ${c.firstName} ${c.lastName} - no content`);
      return null;
    }

    let age: number | null = null;
    let ageScore: AgeScoreResult | null = null;
    
    if (c.profile?.birthDate) {
      age = calculateAge(c.profile.birthDate);
      ageScore = calculateAgeScoreForMatch(targetUser.age, targetUser.gender, age);
      
      if (!ageScore.eligible) {
        console.log(`[V3.4] Skipping ${c.firstName} ${c.lastName} - age ${age} not eligible (${ageScore.description})`);
        return null;
      }
    } else {
      console.log(`[V3.4] Including ${c.firstName} ${c.lastName} - no birthDate (will be scored by AI)`);
    }

    if (c.profile?.religiousLevel) {
      if (!compatibleReligiousLevels.includes(c.profile.religiousLevel)) {
        console.log(`[V3.4] Skipping ${c.firstName} ${c.lastName} - religious level ${c.profile.religiousLevel} not compatible`);
        return null;
      }
    }

    const aiSummary = c.profile!.aiProfileSummary as AiProfileSummary | null;
    
    const backgroundProfile = createBackgroundProfile(
      c.profile!.nativeLanguage,
      c.profile!.additionalLanguages || [],
      c.profile!.aliyaCountry,
      c.profile!.aliyaYear,
      c.profile!.origin,
      c.profile!.about,
      c.profile!.matchingNotes
    );
    
    const backgroundMatch = targetUser.backgroundProfile 
      ? calculateBackgroundMatch(targetUser.backgroundProfile, backgroundProfile)
      : { multiplier: 1.0, compatibility: 'good' as const, bonusPoints: 0, reasoning: '' };
    
    let summaryText = '';
    if (aiSummary?.personalitySummary) {
      summaryText = `אישיות: ${aiSummary.personalitySummary}\nמה מחפש/ת: ${aiSummary.lookingForSummary || 'לא צוין'}`;
    } else if (c.profile!.about) {
      summaryText = `אודות: ${c.profile!.about}`;
    } else if (c.profile!.manualEntryText) {
      summaryText = `מידע: ${c.profile!.manualEntryText}`;
    } else {
      summaryText = `מועמד/ת ${age ? `בן/בת ${age}` : ''}, ${c.profile!.religiousLevel || 'לא צוין'}, ${c.profile!.city || 'לא צוין'}`;
    }

    return {
      userId: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      age,
      religiousLevel: c.profile!.religiousLevel,
      religiousJourney: c.profile!.religiousJourney,
      city: c.profile!.city,
      occupation: c.profile!.occupation,
      summaryText: summaryText.substring(0, 1500),
      backgroundProfile,
      backgroundMatch,
      ageScore,
    };
  });
  
  const filteredCandidates = candidatesWithData.filter((c): c is CandidateData => c !== null);
  
  console.log(`[V3.4] After filtering: ${filteredCandidates.length} candidates`);
  console.log(`  - With birthDate: ${filteredCandidates.filter(c => c.age !== null).length}`);
  console.log(`  - Without birthDate: ${filteredCandidates.filter(c => c.age === null).length}`);
  console.log(`  - With religiousLevel: ${filteredCandidates.filter(c => c.religiousLevel !== null).length}`);
  console.log(`  - Without religiousLevel: ${filteredCandidates.filter(c => c.religiousLevel === null).length}`);
  console.log(`${'='.repeat(70)}\n`);
  
  return filteredCandidates;
}

// ============================================================================
// AI PROMPT GENERATORS
// ============================================================================

function generateFirstPassPrompt(
  targetProfile: string,
  targetBackgroundInfo: string,
  candidates: CandidateData[],
  batchNumber: number,
  totalBatches: number
): string {
  const candidatesText = candidates.map((c, index) => {
    const bgInfo = c.backgroundProfile 
      ? `רקע: ${getCategoryDescription(c.backgroundProfile.category)} | שפת אם: ${c.backgroundProfile.nativeLanguage || 'לא צוין'} | התאמת רקע: ${c.backgroundMatch?.compatibility || 'unknown'}`
      : '';
    
    const ageInfo = c.ageScore 
      ? `התאמת גיל: ${c.ageScore.score}/100 (${c.ageScore.description})`
      : 'גיל: לא ידוע - יש להעריך לפי התוכן';
    
    return `[מועמד/ת ${index + 1}]
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age ?? 'לא ידוע'} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${bgInfo}
${ageInfo}
${c.summaryText}
---`;
  }).join('\n\n');

  return `אתה שדכן AI מומחה במערכת NeshamaTech.

המשימה: לנתח התאמות פוטנציאליות בין המועמד/ת המסומן/ת לבין רשימת מועמדים.
(Batch ${batchNumber}/${totalBatches})

=== פרופיל המועמד/ת המסומן/ת ===
${targetProfile}

=== פרופיל רקע של המועמד/ת המסומן/ת ===
${targetBackgroundInfo}

=== מועמדים לניתוח (${candidates.length} מועמדים) ===
${candidatesText}

=== מערכת הציון (100 נקודות) ===

חלק את הציון ל-7 קטגוריות:

1. התאמה דתית-רוחנית (30 נקודות)
   - האם ברמה דתית דומה או תואמת?
   - האם הכיוון הרוחני דומה?
   - האם יש גמישות או קפדנות דומה?

2. התאמת גיל (10 נקודות)
   - אם יש ציון התאמת גיל - השתמש בו
   - אם הגיל לא ידוע - תן ציון ניטרלי (5/10) והעריך לפי התוכן
   - ציון 100 = אידיאלי (10 נק'), 80 = טוב (8 נק'), 65 = סביר (6.5 נק'), 45 = בעייתי (4.5 נק')

3. וייב קריירה-משפחה (15 נקודות)
   - קריירה לוחצת vs מאוזנת
   - תפיסה דומה לגבי עבודה/משפחה

4. סגנון חיים (13 נקודות)
   - חוויות עומק vs הנאה קלילה
   - יחס לטבע וטיולים
   - סגנון בילויים וחופשות

5. רמת שאפתנות (11 נקודות)
   - שאפתני vs שלו
   - האם הדינמיקה תעבוד?

6. אנרגיה ותקשורת (11 נקודות)
   - מופנם vs מוחצן
   - רגשי vs שכלי
   - סגנון תקשורת

7. הערכים ועדיפויות (10 נקודות)
   - מה חשוב בחיים
   - סדרי עדיפויות תואמים

=== הנחיה חשובה לגבי רקע ושפה ===
שים לב מאוד להתאמת הרקע! 
- מועמדים עם "התאמת רקע: excellent" או "good" - תן ציון רגיל
- מועמדים עם "התאמת רקע: possible" - שקול בזהירות
- מועמדים עם "התאמת רקע: problematic" או "not_recommended" - הורד ציון משמעותית!

=== הנחיה חשובה לגבי מידע חסר ===
אם למועמד/ת חסר מידע (גיל, רמה דתית וכו') - תן ציון על בסיס מה שכתוב בסיכום שלו/ה.
אל תוריד ציון רק בגלל מידע חסר - העריך לפי התוכן הקיים.

=== הוראות ===
- דרג כל מועמד/ת מ-0 עד 100
- פרט את הציון לפי הקטגוריות
- כתוב נימוק קצר (משפט אחד בלבד)

=== פורמט התשובה (JSON בלבד) ===
{
  "candidates": [
    {
      "index": 1,
      "totalScore": 85,
      "breakdown": {
        "religious": 26,
        "ageCompatibility": 10,
        "careerFamily": 12,
        "lifestyle": 11,
        "ambition": 9,
        "communication": 9,
        "values": 8
      },
      "shortReasoning": "התאמה דתית טובה, רקע דומה"
    }
  ]
}

התשובה חייבת להיות JSON תקין בלבד, בלי טקסט נוסף.`;
}

function generateDeepAnalysisPrompt(
  targetProfile: string,
  targetBackgroundInfo: string,
  topCandidates: Array<CandidateData & FirstPassResult>
): string {
  const candidatesText = topCandidates.map((c, index) => {
    const bgInfo = c.backgroundProfile 
      ? `רקע: ${getCategoryDescription(c.backgroundProfile.category)} | התאמת רקע: ${c.backgroundMatch?.compatibility} (מכפיל: ${c.backgroundMatch?.multiplier.toFixed(2)})`
      : '';
    
    const ageInfo = c.ageScore 
      ? `התאמת גיל: ${c.ageScore.score}/100 (${c.ageScore.description})`
      : 'גיל: לא ידוע';
    
    return `[מועמד/ת ${index + 1}] - ציון ראשוני: ${c.totalScore} (לפני מכפיל רקע: ${c.rawScore})
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age ?? 'לא ידוע'} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${bgInfo}
${ageInfo}
${c.summaryText}
פירוט ציון: דתי=${c.breakdown.religious}/30, גיל=${c.breakdown.ageCompatibility}/10, קריירה-משפחה=${c.breakdown.careerFamily}/15, סגנון חיים=${c.breakdown.lifestyle}/13, שאפתנות=${c.breakdown.ambition}/11, תקשורת=${c.breakdown.communication}/11, ערכים=${c.breakdown.values}/10
נימוק ראשוני: ${c.shortReasoning}
---`;
  }).join('\n\n');

  return `אתה שדכן AI מומחה במערכת NeshamaTech.

המשימה: לבצע ניתוח מעמיק והשוואה בין ${topCandidates.length} המועמדים המובילים.

=== פרופיל המועמד/ת המסומן/ת ===
${targetProfile}

=== פרופיל רקע של המועמד/ת המסומן/ת ===
${targetBackgroundInfo}

=== ${topCandidates.length} המועמדים המובילים ===
${candidatesText}

=== המשימה ===

1. סקור שוב את כל ${topCandidates.length} המועמדים
2. השווה ביניהם - מי באמת הכי מתאים?
3. לכל מועמד/ת:
   - תן ציון סופי (0-100)
   - כתוב נימוק מפורט (3-5 שורות) שמסביר:
     * למה ההתאמה טובה (או פחות טובה)
     * מה הפוטנציאל לכימיה
     * התייחסות לרקע ושפה משותפת
     * התייחסות להתאמת הגיל (אם ידוע)
     * האם יש אזהרות או נקודות לתשומת לב

4. דרג את כולם מהכי מתאים (rank=1) לפחות מתאים

=== הנחיות מיוחדות
- שים דגש על התאמת רקע ושפה
- אם יש פער רקע משמעותי, ציין זאת בנימוק
- שפה משותפת היא יתרון משמעותי
- אם חסר מידע על מועמד - העריך לפי מה שכתוב

=== פורמט התשובה (JSON בלבד) ===
{
  "deepAnalysis": [
    {
      "index": 1,
      "userId": "user_id_here",
      "finalScore": 92,
      "rank": 1,
      "detailedReasoning": "התאמה יוצאת דופן. שניהם עולים מארה"ב עם רקע דומה ושפת אם משותפת (אנגלית). ..."
    }
  ]
}

התשובה חייבת להיות JSON תקין בלבד, בלי טקסט נוסף.`;
}

// ============================================================================
// AI ANALYSIS FUNCTIONS
// ============================================================================

async function getGeminiModel() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });
}

function parseJsonResponse<T>(jsonString: string): T {
  let cleaned = jsonString;
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7, -3).trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3, -3).trim();
  }
  return JSON.parse(cleaned) as T;
}

async function runFirstPassAnalysis(
  targetProfile: string,
  targetBackgroundInfo: string,
  candidates: CandidateData[]
): Promise<FirstPassResult[]> {
  const model = await getGeminiModel();
  const allResults: FirstPassResult[] = [];
  
  const totalBatches = Math.ceil(candidates.length / BATCH_SIZE);
  console.log(`[Matching V3.4] Starting First Pass: ${candidates.length} candidates in ${totalBatches} batches`);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, candidates.length);
    const batchCandidates = candidates.slice(start, end);
    
    console.log(`[Matching V3.4] Processing batch ${batchIndex + 1}/${totalBatches} (${batchCandidates.length} candidates)`);
    
    const prompt = generateFirstPassPrompt(
      targetProfile,
      targetBackgroundInfo,
      batchCandidates,
      batchIndex + 1,
      totalBatches
    );

    try {
      const startTime = Date.now();
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonString = response.text();
      const duration = Date.now() - startTime;
      
      console.log(`[Matching V3.4] Batch ${batchIndex + 1} completed in ${duration}ms`);

      const parsed = parseJsonResponse<AiFirstPassResponse>(jsonString);
      
      if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
        console.error(`[Matching V3.4] Invalid response format for batch ${batchIndex + 1}`);
        continue;
      }

      for (const aiResult of parsed.candidates) {
        const candidate = batchCandidates[aiResult.index - 1];
        if (!candidate) continue;

        const rawScore = Math.min(100, Math.max(0, aiResult.totalScore));
        const backgroundMultiplier = candidate.backgroundMatch?.multiplier || 1.0;
        const adjustedScore = Math.round(rawScore * backgroundMultiplier);

        allResults.push({
          userId: candidate.userId,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          totalScore: adjustedScore,
          rawScore,
          backgroundMultiplier,
          breakdown: aiResult.breakdown || {
            religious: 0,
            ageCompatibility: 0,
            careerFamily: 0,
            lifestyle: 0,
            ambition: 0,
            communication: 0,
            values: 0
          },
          shortReasoning: aiResult.shortReasoning || ''
        });
      }

    } catch (error) {
      console.error(`[Matching V3.4] Error in batch ${batchIndex + 1}:`, error);
    }
  }

  allResults.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log(`[Matching V3.4] First Pass completed: ${allResults.length} candidates scored`);
  if (allResults.length > 0) {
    console.log(`[Matching V3.4] Top 5 from First Pass:`);
    allResults.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.firstName} ${r.lastName} - Score: ${r.totalScore} (raw: ${r.rawScore}, multiplier: ${r.backgroundMultiplier.toFixed(2)})`);
    });
  }

  return allResults;
}

async function runDeepAnalysis(
  targetProfile: string,
  targetBackgroundInfo: string,
  topCandidates: Array<CandidateData & FirstPassResult>
): Promise<DeepAnalysisResult[]> {
  const model = await getGeminiModel();
  
  console.log(`[Matching V3.4] Starting Deep Analysis for ${topCandidates.length} candidates`);
  
  const prompt = generateDeepAnalysisPrompt(targetProfile, targetBackgroundInfo, topCandidates);

  try {
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[Matching V3.4] Deep Analysis completed in ${duration}ms`);

    const parsed = parseJsonResponse<AiDeepAnalysisResponse>(jsonString);
    
    if (!parsed.deepAnalysis || !Array.isArray(parsed.deepAnalysis)) {
      throw new Error('Invalid Deep Analysis response format');
    }

    const results: DeepAnalysisResult[] = parsed.deepAnalysis.map(aiResult => {
      const candidate = topCandidates[aiResult.index - 1];
      return {
        userId: candidate?.userId || aiResult.userId,
        finalScore: Math.min(100, Math.max(0, aiResult.finalScore)),
        rank: aiResult.rank,
        detailedReasoning: aiResult.detailedReasoning || ''
      };
    });

    results.sort((a, b) => a.rank - b.rank);

    console.log(`[Matching V3.4] Deep Analysis results:`);
    results.slice(0, 3).forEach(r => {
      const candidate = topCandidates.find(c => c.userId === r.userId);
      console.log(`  Rank ${r.rank}: ${candidate?.firstName} ${candidate?.lastName} - Final Score: ${r.finalScore}`);
    });

    return results;

  } catch (error) {
    console.error(`[Matching V3.4] Error in Deep Analysis:`, error);
    return topCandidates.map((c, index) => ({
      userId: c.userId,
      finalScore: c.totalScore,
      rank: index + 1,
      detailedReasoning: c.shortReasoning
    }));
  }
}

// ============================================================================
// PROFILE PREPARATION
// ============================================================================

async function prepareTargetProfile(targetUser: TargetUserData): Promise<string> {
  let targetProfile = '';
  
  if (targetUser.aiProfileSummary?.personalitySummary) {
    targetProfile = `שם: ${targetUser.firstName} ${targetUser.lastName}
גיל: ${targetUser.age}
רמה דתית: ${targetUser.religiousLevel || 'לא צוין'}

=== ניתוח אישיות ===
${targetUser.aiProfileSummary.personalitySummary}

=== מה מחפש/ת ===
${targetUser.aiProfileSummary.lookingForSummary || 'לא צוין'}`;
  } else {
    console.log(`[Matching V3.4] No AI summary for target user, generating narrative...`);
    const narrative = await profileAiService.generateNarrativeProfile(targetUser.id);
    targetProfile = narrative || `${targetUser.firstName}, בן/בת ${targetUser.age}, ${targetUser.religiousLevel || 'לא צוין'}`;
  }

  return targetProfile;
}

function prepareTargetBackgroundInfo(targetUser: TargetUserData): string {
  const bg = targetUser.backgroundProfile;
  if (!bg) return 'אין מידע רקע זמין';
  
  const lines = [
    `קטגוריה: ${getCategoryDescription(bg.category)} (ביטחון: ${Math.round(bg.confidence * 100)}%)`,
    `שפת אם: ${bg.nativeLanguage || 'לא צוין'}`,
    `שפות נוספות: ${bg.additionalLanguages.length > 0 ? bg.additionalLanguages.join(', ') : 'אין'}`,
  ];
  
  if (bg.aliyaCountry) lines.push(`ארץ עלייה: ${bg.aliyaCountry}`);
  if (bg.aliyaYear) lines.push(`שנת עלייה: ${bg.aliyaYear} (${bg.yearsInIsrael} שנים בארץ)`);
  lines.push(`שפת מילוי פרופיל: ${bg.textLanguage}`);
  lines.push(`איכות עברית: ${bg.hebrewQuality}`);
  
  lines.push('');
  lines.push('=== הנחיות מיוחדות לפי רקע ===');
  
  if (bg.category === 'oleh_new') {
    lines.push('⚠️ המועמד/ת עולה חדש/ה - תן עדיפות גבוהה למועמדים עם:');
    lines.push('   - רקע עלייה דומה');
    lines.push('   - שפת אם משותפת');
    lines.push('   - הורד ציון משמעותית לצברים ללא רקע בינלאומי');
  } else if (bg.category === 'oleh_mid') {
    lines.push('המועמד/ת עולה בתהליך קליטה - העדף מועמדים עם רקע בינלאומי או שפה משותפת');
  } else if (bg.category === 'sabra') {
    lines.push('המועמד/ת צבר/ית - היזהר משידוך עם עולים חדשים שאין להם רקע ישראלי');
  }
  
  return lines.join('\n');
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function findMatchesForUser(
  targetUserId: string,
  matchmakerId: string,
  options: {
    maxCandidatesToAnalyze?: number;
    forceRefresh?: boolean;
    autoSave?: boolean;
  } = {}
): Promise<{
  matches: MatchResult[];
  fromCache: boolean;
  meta: {
    savedAt?: Date;
    isStale?: boolean;
    algorithmVersion: string;
    totalCandidatesScanned?: number;
  };
}> {
  const {
    forceRefresh = false,
    autoSave = true,
  } = options;

  console.log(`\n========================================`);
  console.log(`[Matching V3.4] Starting match search for user: ${targetUserId}`);
  console.log(`[Matching V3.4] Options: forceRefresh=${forceRefresh}, autoSave=${autoSave}`);
  console.log(`========================================\n`);

  // בדיקת Cache
  if (!forceRefresh) {
    const savedResults = await loadSavedMatches(targetUserId);
    
    if (savedResults && savedResults.matches.length > 0) {
      console.log(`[Matching V3.4] ✅ Using cached results (${savedResults.matches.length} matches)`);
      
      return {
        matches: savedResults.matches,
        fromCache: true,
        meta: {
          savedAt: savedResults.meta.savedAt,
          isStale: savedResults.meta.isStale,
          algorithmVersion: savedResults.meta.algorithmVersion,
          totalCandidatesScanned: savedResults.meta.totalCandidatesScanned,
        }
      };
    }
  }

  // שלב 1: שליפת נתוני המועמד המסומן
  const targetUser = await getTargetUserData(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found or has no profile');
  }
  console.log(`[Matching V3.4] Target user: ${targetUser.firstName} ${targetUser.lastName}, Age: ${targetUser.age}, Gender: ${targetUser.gender}`);

  // שלב 2: שליפת כל המועמדים הרלוונטיים (סינון סלחני + MANUAL_ENTRY)
  const allCandidates = await fetchAllRelevantCandidates(targetUser);
  if (allCandidates.length === 0) {
    console.log(`[Matching V3.4] No candidates found after filtering`);
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v3.4', totalCandidatesScanned: 0 }
    };
  }

  // שלב 3: הכנת פרופיל ה-Target
  const targetProfile = await prepareTargetProfile(targetUser);
  const targetBackgroundInfo = prepareTargetBackgroundInfo(targetUser);

  // שלב 4: סריקה ראשונית ב-batches
  const firstPassResults = await runFirstPassAnalysis(targetProfile, targetBackgroundInfo, allCandidates);
  
  if (firstPassResults.length === 0) {
    console.log(`[Matching V3.4] No results from First Pass`);
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v3.4', totalCandidatesScanned: allCandidates.length }
    };
  }

  // שלב 5: בחירת Top 15
  const topCandidates = firstPassResults.slice(0, TOP_CANDIDATES_COUNT);
  
  const topCandidatesWithData = topCandidates.map(result => {
    const candidateData = allCandidates.find(c => c.userId === result.userId)!;
    return {
      ...candidateData,
      ...result
    };
  });

  // שלב 6: סריקה מעמיקה של Top 15
  const deepAnalysisResults = await runDeepAnalysis(targetProfile, targetBackgroundInfo, topCandidatesWithData);

  // שלב 7: מיזוג התוצאות
  const finalResults: MatchResult[] = deepAnalysisResults.map(deepResult => {
    const firstPassResult = topCandidates.find(fp => fp.userId === deepResult.userId)!;
    const candidateData = allCandidates.find(c => c.userId === deepResult.userId)!;

    return {
      userId: deepResult.userId,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      
      firstPassScore: firstPassResult.totalScore,
      finalScore: deepResult.finalScore,
      
      scoreBreakdown: firstPassResult.breakdown,
      
      shortReasoning: firstPassResult.shortReasoning,
      detailedReasoning: deepResult.detailedReasoning,
      
      rank: deepResult.rank,
      backgroundMultiplier: firstPassResult.backgroundMultiplier,
      backgroundCompatibility: candidateData.backgroundMatch?.compatibility,
      ageScore: candidateData.ageScore?.score ?? null,
    };
  });

  finalResults.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // שלב 8: שמירה
  if (autoSave && finalResults.length > 0) {
    await saveMatchResults(targetUserId, matchmakerId, finalResults, allCandidates.length, 'v3.4');
  }

  console.log(`\n[Matching V3.4] ✅ Completed! Found ${finalResults.length} matches`);
  console.log(`[Matching V3.4] Total candidates scanned: ${allCandidates.length}`);
  console.log(`[Matching V3.4] Final Top 3:`);
  finalResults.slice(0, 3).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Final: ${m.finalScore}, Age: ${m.ageScore ?? 'N/A'}, BG: ${m.backgroundCompatibility}`);
  });
  console.log(`========================================\n`);

  return {
    matches: finalResults,
    fromCache: false,
    meta: { 
      algorithmVersion: 'v3.4',
      totalCandidatesScanned: allCandidates.length
    }
  };
}

// ============================================================================
// VIRTUAL USER MATCHING
// ============================================================================

interface VirtualTargetUserData {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: Date;
  age: number;
  religiousLevel: string | null;
  aiProfileSummary: {
    personalitySummary: string;
    lookingForSummary: string;
  };
  narrativeProfile?: string;
  backgroundProfile?: BackgroundProfile;
  isVirtual: true;
}

/**
 * ממיר פרופיל וירטואלי למבנה שהאלגוריתם מצפה לו
 */
function convertVirtualToTargetUser(
  virtualProfileId: string,
  virtualProfileName: string | null,
  generatedProfile: GeneratedVirtualProfile,
  gender: Gender,
  religiousLevel: string
): VirtualTargetUserData {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - generatedProfile.inferredAge;
  const estimatedBirthDate = new Date(birthYear, 0, 1);

  return {
    id: virtualProfileId,
    firstName: 'מועמד וירטואלי',
    lastName: virtualProfileName || '',
    gender,
    birthDate: estimatedBirthDate,
    age: generatedProfile.inferredAge,
    religiousLevel,
    aiProfileSummary: {
      personalitySummary: generatedProfile.personalitySummary,
      lookingForSummary: generatedProfile.lookingForSummary,
    },
    narrativeProfile: `
שם: מועמד וירטואלי ${virtualProfileName || ''}
גיל: ${generatedProfile.inferredAge}
רמה דתית: ${religiousLevel}
עיר: ${generatedProfile.inferredCity || 'לא צוין'}
מקצוע: ${generatedProfile.inferredOccupation || 'לא צוין'}

=== ניתוח אישיות ===
${generatedProfile.personalitySummary}

=== מה מחפש/ת ===
${generatedProfile.lookingForSummary}

=== תכונות מרכזיות ===
${generatedProfile.keyTraits?.join(', ') || 'לא צוין'}

=== מחפש בבן/בת זוג ===
${generatedProfile.idealPartnerTraits?.join(', ') || 'לא צוין'}

=== קווים אדומים ===
${generatedProfile.dealBreakers?.join(', ') || 'אין'}
    `.trim(),
    isVirtual: true,
  };
}

/**
 * מוצא התאמות עבור פרופיל וירטואלי.
 */
export async function findMatchesForVirtualUser(
  virtualProfileId: string,
  virtualProfileName: string | null,
  generatedProfile: GeneratedVirtualProfile,
  gender: Gender,
  religiousLevel: string,
  matchmakerId: string,
  editedSummary?: string | null
): Promise<{
  matches: MatchResult[];
  fromCache: false;
  meta: {
    algorithmVersion: string;
    totalCandidatesScanned: number;
    isVirtualSearch: true;
  };
}> {
  console.log(`\n========================================`);
  console.log(`[Matching V3.4 - Virtual] Starting match search for virtual profile: ${virtualProfileId}`);
  console.log(`[Matching V3.4 - Virtual] Gender: ${gender}, Religious: ${religiousLevel}`);
  console.log(`========================================\n`);

  const virtualTargetUser = convertVirtualToTargetUser(
    virtualProfileId,
    virtualProfileName,
    generatedProfile,
    gender,
    religiousLevel
  );

  if (editedSummary?.trim()) {
    virtualTargetUser.narrativeProfile = editedSummary.trim();
    virtualTargetUser.aiProfileSummary.personalitySummary = editedSummary.trim();
  }

  const allCandidates = await fetchAllRelevantCandidates(virtualTargetUser as unknown as TargetUserData);
  
  if (allCandidates.length === 0) {
    console.log(`[Matching V3.4 - Virtual] No candidates found after filtering`);
    return {
      matches: [],
      fromCache: false,
      meta: { 
        algorithmVersion: 'v3.4-virtual', 
        totalCandidatesScanned: 0,
        isVirtualSearch: true 
      }
    };
  }

  console.log(`[Matching V3.4 - Virtual] Found ${allCandidates.length} potential candidates`);

  const targetProfile = virtualTargetUser.narrativeProfile || '';
  
  const targetBackgroundInfo = `
קטגוריה: לא ידוע (פרופיל וירטואלי)
שפת אם: עברית (הנחה)
שפות נוספות: אין מידע

=== הנחיות מיוחדות ===
זהו פרופיל וירטואלי שנוצר מטקסט חופשי. 
יש להתייחס לנתונים כאומדן ולא כעובדות מאומתות.
  `.trim();

  const firstPassResults = await runFirstPassAnalysis(targetProfile, targetBackgroundInfo, allCandidates);
  
  if (firstPassResults.length === 0) {
    console.log(`[Matching V3.4 - Virtual] No results from First Pass`);
    return {
      matches: [],
      fromCache: false,
      meta: { 
        algorithmVersion: 'v3.4-virtual', 
        totalCandidatesScanned: allCandidates.length,
        isVirtualSearch: true 
      }
    };
  }

  const topCandidates = firstPassResults.slice(0, TOP_CANDIDATES_COUNT);
  
  const topCandidatesWithData = topCandidates.map(result => {
    const candidateData = allCandidates.find(c => c.userId === result.userId)!;
    return {
      ...candidateData,
      ...result
    };
  });

  const deepAnalysisResults = await runDeepAnalysis(targetProfile, targetBackgroundInfo, topCandidatesWithData);

  const finalResults: MatchResult[] = deepAnalysisResults.map(deepResult => {
    const firstPassResult = topCandidates.find(fp => fp.userId === deepResult.userId)!;
    const candidateData = allCandidates.find(c => c.userId === deepResult.userId)!;

    return {
      userId: deepResult.userId,
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      
      firstPassScore: firstPassResult.totalScore,
      finalScore: deepResult.finalScore,
      
      scoreBreakdown: firstPassResult.breakdown,
      
      shortReasoning: firstPassResult.shortReasoning,
      detailedReasoning: deepResult.detailedReasoning,
      
      rank: deepResult.rank,
      backgroundMultiplier: firstPassResult.backgroundMultiplier,
      backgroundCompatibility: candidateData.backgroundMatch?.compatibility,
      ageScore: candidateData.ageScore?.score ?? null,
    };
  });

  finalResults.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  console.log(`\n[Matching V3.4 - Virtual] ✅ Completed! Found ${finalResults.length} matches`);
  console.log(`[Matching V3.4 - Virtual] Total candidates scanned: ${allCandidates.length}`);
  if (finalResults.length > 0) {
    console.log(`[Matching V3.4 - Virtual] Final Top 3:`);
    finalResults.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Final: ${m.finalScore}`);
    });
  }
  console.log(`========================================\n`);

  return {
    matches: finalResults,
    fromCache: false,
    meta: { 
      algorithmVersion: 'v3.4-virtual',
      totalCandidatesScanned: allCandidates.length,
      isVirtualSearch: true
    }
  };
}

// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

export const matchingAlgorithmService = {
  // פונקציות עיקריות
  findMatchesForUser,
  findMatchesForVirtualUser,
  loadSavedMatches,
  saveMatchResults,
  deleteSavedMatches,
  
  // פונקציות עזר - רמה דתית
  getCompatibleReligiousLevels,
  areReligiousLevelsCompatible,
  
  // פונקציות עזר - גיל
  calculateAge,
  getAgeRange,
  calculateAgeScore,
  calculateAgeScoreForMatch,
  
  // פונקציות עזר - רקע
  createBackgroundProfile,
  calculateBackgroundMatch,
  analyzeTextLanguage,
  
  // 🆕 V3.4 - פילטר היסטוריה
  checkBlockingHistory,
  filterBlockedFemales,
  BLOCKING_SUGGESTION_STATUSES,
  BLOCKING_POTENTIAL_MATCH_STATUSES,
  
  // 🆕 V3.4 - שמירה ב-ScannedPair
  saveScannedPair,
  saveScannedPairsBatch,
  
  // 🆕 V3.4 - סריקה דיפרנציאלית
  needsRescan,
  getFemalesToScan,
  
  // 🆕 V3.4 - MANUAL_ENTRY
  getActiveUsersWhereClause,
};

export default matchingAlgorithmService;