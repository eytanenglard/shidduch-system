// src/lib/services/matchingAlgorithmService.ts
// 🎯 אלגוריתם מציאת התאמות V3.1 - NeshamaTech
// משלב סינון חכם + אבחון רקע ושפה + סריקה ב-batches + ניתוח מעמיק

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Gender, AvailabilityStatus } from "@prisma/client";
import profileAiService from "./profileAiService";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AiProfileSummary {
  personalitySummary: string;
  lookingForSummary: string;
}

// 🆕 קטגוריות רקע
type BackgroundCategory = 
  | 'sabra'              // צבר מובהק
  | 'sabra_international' // צבר עם רקע בינלאומי
  | 'oleh_veteran'       // עולה ותיק (10+ שנים)
  | 'oleh_mid'           // עולה 3-10 שנים
  | 'oleh_new';          // עולה חדש (פחות מ-3 שנים)

// 🆕 פרופיל רקע
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

// 🆕 תוצאת התאמת רקע
interface BackgroundMatchResult {
  multiplier: number;              // 0.15 - 1.25
  compatibility: 'excellent' | 'good' | 'possible' | 'problematic' | 'not_recommended';
  bonusPoints: number;             // בונוס שפה משותפת
  reasoning: string;               // הסבר קצר
}

interface TargetUserData {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: Date;
  age: number;
  religiousLevel: string | null;
  aiProfileSummary: AiProfileSummary | null;
  narrativeProfile?: string | null;
  backgroundProfile?: BackgroundProfile;  // 🆕
}

interface CandidateData {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  religiousLevel: string | null;
  city: string | null;
  occupation: string | null;
  summaryText: string;
  backgroundProfile?: BackgroundProfile;  // 🆕
  backgroundMatch?: BackgroundMatchResult; // 🆕
}

interface ScoreBreakdown {
  religious: number;
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
  backgroundMultiplier?: number;    // 🆕
  backgroundCompatibility?: string; // 🆕
}

interface FirstPassResult {
  userId: string;
  firstName: string;
  lastName: string;
  totalScore: number;
  rawScore: number;                 // 🆕 ציון לפני מכפיל
  backgroundMultiplier: number;     // 🆕
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

// ============================================================================
// CONSTANTS
// ============================================================================

const BATCH_SIZE = 20;
const TOP_CANDIDATES_COUNT = 15;
const STALE_DAYS = 7;
const CURRENT_YEAR = new Date().getFullYear();

// 🆕 מטריצת התאמת רקע
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

// 🆕 מיפוי מכפיל לרמת התאמה
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

function getCompatibleReligiousLevels(level: string | null): string[] {
  if (!level) return RELIGIOUS_LEVEL_ORDER;
  const index = RELIGIOUS_LEVEL_ORDER.indexOf(level);
  if (index === -1) return RELIGIOUS_LEVEL_ORDER;
  const minIndex = Math.max(0, index - 3);
  const maxIndex = Math.min(RELIGIOUS_LEVEL_ORDER.length - 1, index + 3);
  return RELIGIOUS_LEVEL_ORDER.slice(minIndex, maxIndex + 1);
}

function areReligiousLevelsCompatible(level1: string | null, level2: string | null): boolean {
  if (!level1 || !level2) return true;
  const compatible = getCompatibleReligiousLevels(level1);
  return compatible.includes(level2);
}

// ============================================================================
// AGE CALCULATION HELPERS
// ============================================================================

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getAgeRange(age: number, gender: Gender): { minAge: number; maxAge: number } {
  if (gender === 'MALE') {
    return { minAge: age - 7, maxAge: age + 5 };
  } else {
    return { minAge: age - 5, maxAge: age + 5 };
  }
}

// ============================================================================
// 🆕 BACKGROUND ANALYSIS FUNCTIONS
// ============================================================================

/**
 * מנתח טקסט ומזהה את השפה העיקרית
 */
function analyzeTextLanguage(text: string | null | undefined): {
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
    // בדיקת דפוסים לא טבעיים בעברית
    const unnaturalPatterns = [
      /אני הוא|אני היא/,  // I am he/she - תרגום ישיר
      /יש לי ל/,          // I have to - תרגום ישיר
      /אני רוצה ל(?!היות|לעשות|ללמוד|לעבוד)/, // פועל אחרי "רוצה ל" שלא נשמע טבעי
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
    // mixed
    hebrewQuality = hebrewRatio > 0.5 ? 'moderate' : 'weak';
    indicators.push('Hebrew proficiency unclear from mixed text');
  }

  return { language, hebrewQuality, indicators };
}

/**
 * יוצר פרופיל רקע למועמד
 */
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
  
  // בדיקה אם צבר
  const hebrewAsNative = nativeLanguage?.toLowerCase() === 'hebrew' || 
                         nativeLanguage?.toLowerCase() === 'עברית' ||
                         nativeLanguage === 'he';
  
  const noAliyaInfo = !aliyaCountry && !aliyaYear;
  const originIsrael = !origin || origin.toLowerCase() === 'israel' || origin === 'ישראל';
  
  if (hebrewAsNative && noAliyaInfo && originIsrael && textAnalysis.hebrewQuality === 'native') {
    // צבר מובהק
    category = 'sabra';
    confidence = 0.95;
    indicators.push('classified as SABRA: Hebrew native, no aliyah info, Israeli origin');
  } else if (hebrewAsNative && (additionalLanguages.length > 0 || !originIsrael)) {
    // צבר עם רקע בינלאומי
    category = 'sabra_international';
    confidence = 0.85;
    indicators.push('classified as SABRA_INTERNATIONAL: Hebrew native with international background');
  } else if (yearsInIsrael !== null) {
    // יש מידע על עלייה
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
    // כתב באנגלית בלי עברית - כנראה עולה חדש
    category = 'oleh_new';
    confidence = 0.7;
    indicators.push('classified as OLEH_NEW (inferred): English text, no Hebrew');
  } else if (textAnalysis.language === 'english' || textAnalysis.hebrewQuality === 'weak') {
    // כתב באנגלית או עברית חלשה - כנראה עולה
    category = 'oleh_mid';
    confidence = 0.6;
    indicators.push('classified as OLEH_MID (inferred): weak Hebrew or English text');
  } else if (textAnalysis.hebrewQuality === 'moderate') {
    // עברית בינונית - יכול להיות עולה ותיק
    category = 'oleh_veteran';
    confidence = 0.5;
    indicators.push('classified as OLEH_VETERAN (inferred): moderate Hebrew quality');
  } else {
    // ברירת מחדל - צבר עם רקע בינלאומי (כי לא בטוחים)
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
function calculateBackgroundMatch(
  targetProfile: BackgroundProfile,
  candidateProfile: BackgroundProfile
): BackgroundMatchResult {
  // מכפיל בסיסי מהמטריצה
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
  
  // יצירת הסבר
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

// ============================================================================
// SAVED RESULTS FUNCTIONS
// ============================================================================

export async function loadSavedMatches(targetUserId: string): Promise<SavedSearchResult | null> {
  console.log(`[Matching V3.1] Loading saved matches for user: ${targetUserId}`);

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
    console.log(`[Matching V3.1] No saved search found for user: ${targetUserId}`);
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

  const validCandidates = await prisma.user.findMany({
    where: {
      id: { in: savedUserIds },
      status: 'ACTIVE',
      profile: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        isProfileVisible: true,
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
    console.log(`[Matching V3.1] Filtered out ${removedCount} unavailable candidates`);
  }

  console.log(`[Matching V3.1] Loaded ${filteredMatches.length} valid matches (${isStale ? 'STALE' : 'FRESH'})`);

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
  algorithmVersion: string = 'v3.1'
): Promise<void> {
  console.log(`[Matching V3.1] Saving ${matches.length} matches for user: ${targetUserId}`);

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
      updatedAt: new Date(),
    }
  });

  console.log(`[Matching V3.1] ✅ Saved matches successfully`);
}

export async function deleteSavedMatches(targetUserId: string): Promise<void> {
  await prisma.savedMatchSearch.delete({
    where: { targetUserId }
  }).catch(() => {});
  console.log(`[Matching V3.1] Deleted saved matches for user: ${targetUserId}`);
}

// ============================================================================
// DATA FETCHING FUNCTIONS
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
  
  // 🆕 יצירת פרופיל רקע
  const backgroundProfile = createBackgroundProfile(
    user.profile.nativeLanguage,
    user.profile.additionalLanguages || [],
    user.profile.aliyaCountry,
    user.profile.aliyaYear,
    user.profile.origin,
    user.profile.about,
    user.profile.matchingNotes
  );
  
  console.log(`[Matching V3.1] Target background profile:`, {
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
    aiProfileSummary: user.profile.aiProfileSummary as AiProfileSummary | null,
    backgroundProfile,
  };
}

async function fetchAllRelevantCandidates(
  targetUser: TargetUserData
): Promise<CandidateData[]> {
  const oppositeGender = targetUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const { minAge, maxAge } = getAgeRange(targetUser.age, targetUser.gender);
  const compatibleReligiousLevels = getCompatibleReligiousLevels(targetUser.religiousLevel);
  
  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minBirthDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  console.log(`[Matching V3.1] Fetching ALL relevant candidates for ${targetUser.firstName}:`);
  console.log(`  - Gender: ${oppositeGender}`);
  console.log(`  - Age range: ${minAge}-${maxAge}`);
  console.log(`  - Target background: ${getCategoryDescription(targetUser.backgroundProfile?.category || 'sabra_international')}`);

  const candidates = await prisma.user.findMany({
    where: {
      id: { not: targetUser.id },
      status: 'ACTIVE',
      profile: {
        gender: oppositeGender as Gender,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        isProfileVisible: true,
        birthDate: {
          gte: minBirthDate,
          lte: maxBirthDate,
        },
        ...(compatibleReligiousLevels.length < RELIGIOUS_LEVEL_ORDER.length && {
          religiousLevel: { in: compatibleReligiousLevels }
        })
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          birthDate: true,
          religiousLevel: true,
          city: true,
          occupation: true,
          aiProfileSummary: true,
          about: true,
          nativeLanguage: true,
          additionalLanguages: true,
          aliyaCountry: true,
          aliyaYear: true,
          origin: true,
          matchingNotes: true,
        }
      }
    },
    orderBy: {
      profile: {
        updatedAt: 'desc'
      }
    }
  });

  console.log(`[Matching V3.1] Found ${candidates.length} total candidates`);

  // 🆕 יצירת פרופיל רקע והתאמה לכל מועמד
  const candidatesWithBackground = candidates.map(c => {
    const age = calculateAge(c.profile!.birthDate);
    const aiSummary = c.profile!.aiProfileSummary as AiProfileSummary | null;
    
    // יצירת פרופיל רקע
    const backgroundProfile = createBackgroundProfile(
      c.profile!.nativeLanguage,
      c.profile!.additionalLanguages || [],
      c.profile!.aliyaCountry,
      c.profile!.aliyaYear,
      c.profile!.origin,
      c.profile!.about,
      c.profile!.matchingNotes
    );
    
    // חישוב התאמת רקע
    const backgroundMatch = targetUser.backgroundProfile 
      ? calculateBackgroundMatch(targetUser.backgroundProfile, backgroundProfile)
      : { multiplier: 1.0, compatibility: 'good' as const, bonusPoints: 0, reasoning: '' };
    
    let summaryText = '';
    if (aiSummary?.personalitySummary) {
      summaryText = `אישיות: ${aiSummary.personalitySummary}\nמה מחפש/ת: ${aiSummary.lookingForSummary || 'לא צוין'}`;
    } else if (c.profile!.about) {
      summaryText = `אודות: ${c.profile!.about}`;
    } else {
      summaryText = `מועמד/ת בן/בת ${age}, ${c.profile!.religiousLevel || 'לא צוין'}, ${c.profile!.city || 'לא צוין'}`;
    }

    return {
      userId: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      age,
      religiousLevel: c.profile!.religiousLevel,
      city: c.profile!.city,
      occupation: c.profile!.occupation,
      summaryText: summaryText.substring(0, 1500),
      backgroundProfile,
      backgroundMatch,
    };
  });
  
  // 🆕 סטטיסטיקות רקע
  const bgStats = {
    excellent: candidatesWithBackground.filter(c => c.backgroundMatch?.compatibility === 'excellent').length,
    good: candidatesWithBackground.filter(c => c.backgroundMatch?.compatibility === 'good').length,
    possible: candidatesWithBackground.filter(c => c.backgroundMatch?.compatibility === 'possible').length,
    problematic: candidatesWithBackground.filter(c => c.backgroundMatch?.compatibility === 'problematic').length,
    not_recommended: candidatesWithBackground.filter(c => c.backgroundMatch?.compatibility === 'not_recommended').length,
  };
  
  console.log(`[Matching V3.1] Background compatibility distribution:`);
  console.log(`  - Excellent: ${bgStats.excellent}`);
  console.log(`  - Good: ${bgStats.good}`);
  console.log(`  - Possible: ${bgStats.possible}`);
  console.log(`  - Problematic: ${bgStats.problematic}`);
  console.log(`  - Not Recommended: ${bgStats.not_recommended}`);

  return candidatesWithBackground;
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
    
    return `[מועמד/ת ${index + 1}]
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${bgInfo}
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

חלק את הציון ל-6 קטגוריות:

1. התאמה דתית-רוחנית (35 נקודות)
   - האם ברמה דתית דומה או תואמת?
   - האם הכיוון הרוחני דומה?
   - האם יש גמישות או קפדנות דומה?

2. וייב קריירה-משפחה (15 נקודות)
   - קריירה לוחצת vs מאוזנת
   - תפיסה דומה לגבי עבודה/משפחה

3. סגנון חיים (15 נקודות)
   - חוויות עומק vs הנאה קלילה
   - יחס לטבע וטיולים
   - סגנון בילויים וחופשות

4. רמת שאפתנות (12 נקודות)
   - שאפתני vs שלו
   - האם הדינמיקה תעבוד?

5. אנרגיה ותקשורת (12 נקודות)
   - מופנם vs מוחצן
   - רגשי vs שכלי
   - סגנון תקשורת

6. ערכים ועדיפויות (11 נקודות)
   - מה חשוב בחיים
   - סדרי עדיפויות תואמים

=== הנחיה חשובה לגבי רקע ושפה ===
שים לב מאוד להתאמת הרקע! 
- מועמדים עם "התאמת רקע: excellent" או "good" - תן ציון רגיל
- מועמדים עם "התאמת רקע: possible" - שקול בזהירות
- מועמדים עם "התאמת רקע: problematic" או "not_recommended" - הורד ציון משמעותית!

עולה חדש + צבר/ית ללא רקע בינלאומי = בעייתי מאוד!

=== הוראות ===
- דרג כל מועמד/ת מ-0 עד 100
- פרט את הציון לפי הקטגוריות
- כתוב נימוק קצר (משפט אחד בלבד)
- התייחס גם להתאמת הרקע בנימוק אם רלוונטי

=== פורמט התשובה (JSON בלבד) ===
{
  "candidates": [
    {
      "index": 1,
      "totalScore": 85,
      "breakdown": {
        "religious": 30,
        "careerFamily": 12,
        "lifestyle": 13,
        "ambition": 10,
        "communication": 10,
        "values": 10
      },
      "shortReasoning": "התאמה דתית טובה, רקע דומה, שניהם בכיוון קריירה מאוזן"
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
    
    return `[מועמד/ת ${index + 1}] - ציון ראשוני: ${c.totalScore} (לפני מכפיל רקע: ${c.rawScore})
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${bgInfo}
${c.summaryText}
פירוט ציון: דתי=${c.breakdown.religious}/35, קריירה-משפחה=${c.breakdown.careerFamily}/15, סגנון חיים=${c.breakdown.lifestyle}/15, שאפתנות=${c.breakdown.ambition}/12, תקשורת=${c.breakdown.communication}/12, ערכים=${c.breakdown.values}/11
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
     * האם יש אזהרות או נקודות לתשומת לב

4. דרג את כולם מהכי מתאים (rank=1) לפחות מתאים

=== הנחיות מיוחדות ===
- שים דגש על התאמת רקע ושפה
- אם יש פער רקע משמעותי, ציין זאת בנימוק
- שפה משותפת היא יתרון משמעותי

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
  console.log(`[Matching V3.1] Starting First Pass: ${candidates.length} candidates in ${totalBatches} batches`);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, candidates.length);
    const batchCandidates = candidates.slice(start, end);
    
    console.log(`[Matching V3.1] Processing batch ${batchIndex + 1}/${totalBatches} (${batchCandidates.length} candidates)`);
    
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
      
      console.log(`[Matching V3.1] Batch ${batchIndex + 1} completed in ${duration}ms`);

      const parsed = parseJsonResponse<AiFirstPassResponse>(jsonString);
      
      if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
        console.error(`[Matching V3.1] Invalid response format for batch ${batchIndex + 1}`);
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
      console.error(`[Matching V3.1] Error in batch ${batchIndex + 1}:`, error);
    }
  }

  allResults.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log(`[Matching V3.1] First Pass completed: ${allResults.length} candidates scored`);
  if (allResults.length > 0) {
    console.log(`[Matching V3.1] Top 5 from First Pass:`);
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
  
  console.log(`[Matching V3.1] Starting Deep Analysis for ${topCandidates.length} candidates`);
  
  const prompt = generateDeepAnalysisPrompt(targetProfile, targetBackgroundInfo, topCandidates);

  try {
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[Matching V3.1] Deep Analysis completed in ${duration}ms`);

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

    console.log(`[Matching V3.1] Deep Analysis results:`);
    results.slice(0, 3).forEach(r => {
      const candidate = topCandidates.find(c => c.userId === r.userId);
      console.log(`  Rank ${r.rank}: ${candidate?.firstName} ${candidate?.lastName} - Final Score: ${r.finalScore}`);
    });

    return results;

  } catch (error) {
    console.error(`[Matching V3.1] Error in Deep Analysis:`, error);
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
    console.log(`[Matching V3.1] No AI summary for target user, generating narrative...`);
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
  
  // הנחיות מיוחדות
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
    // 👇 הוספנו את השורה הזו:
    onProgress?: (progress: number, stage: string) => Promise<void>;
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
    onProgress, // 👇 חילוץ הפונקציה
  } = options;

  // פונקציית עזר לדיווח התקדמות בטוח
  const reportProgress = async (prog: number, stage: string) => {
    if (onProgress) await onProgress(prog, stage);
  };

  console.log(`\n========================================`);
  console.log(`[Matching V3.1] Starting match search for user: ${targetUserId}`);
  
  // דיווח התחלה
  await reportProgress(5, 'initializing');

  // בדיקת Cache...
  if (!forceRefresh) {
    // ... (קוד ה-cache נשאר אותו דבר)
  }

  // שלב 1: שליפת נתוני המועמד המסומן
  await reportProgress(10, 'fetching_target_user'); // 👇 עדכון
  const targetUser = await getTargetUserData(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found or has no profile');
  }

  // שלב 2: שליפת כל המועמדים
  await reportProgress(20, 'fetching_candidates'); // 👇 עדכון
  const allCandidates = await fetchAllRelevantCandidates(targetUser);
  
  if (allCandidates.length === 0) {
    await reportProgress(100, 'done'); // 👇 עדכון
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v3.1', totalCandidatesScanned: 0 }
    };
  }

  // שלב 3: הכנת פרופיל
  await reportProgress(30, 'preparing_profiles'); // 👇 עדכון
  const targetProfile = await prepareTargetProfile(targetUser);
  const targetBackgroundInfo = prepareTargetBackgroundInfo(targetUser);

  // שלב 4: סריקה ראשונית
  await reportProgress(40, 'running_first_pass'); // 👇 עדכון
  const firstPassResults = await runFirstPassAnalysis(targetProfile, targetBackgroundInfo, allCandidates);
  
  if (firstPassResults.length === 0) {
    await reportProgress(100, 'done');
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v3.1', totalCandidatesScanned: allCandidates.length }
    };
  }

  // שלב 5: בחירת Top 15
  await reportProgress(70, 'selecting_top_candidates'); // 👇 עדכון
  const topCandidates = firstPassResults.slice(0, TOP_CANDIDATES_COUNT);
  const topCandidatesWithData = topCandidates.map(result => {
    const candidateData = allCandidates.find(c => c.userId === result.userId)!;
    return { ...candidateData, ...result };
  });

  // שלב 6: סריקה מעמיקה
  await reportProgress(80, 'running_deep_analysis'); // 👇 עדכון
  const deepAnalysisResults = await runDeepAnalysis(targetProfile, targetBackgroundInfo, topCandidatesWithData);

  // שלב 7: מיזוג תוצאות
  await reportProgress(90, 'finalizing_results'); // 👇 עדכון
  const finalResults: MatchResult[] = deepAnalysisResults.map(deepResult => {
     // ... (קוד המיזוג נשאר אותו דבר)
     // העתק את הלוגיקה הקיימת מכאן
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
     };
  });

  finalResults.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // שלב 8: שמירה
  if (autoSave && finalResults.length > 0) {
    await reportProgress(95, 'saving_results'); // 👇 עדכון
    await saveMatchResults(targetUserId, matchmakerId, finalResults, allCandidates.length, 'v3.1');
  }

  await reportProgress(100, 'done'); // 👇 עדכון סופי

  console.log(`\n[Matching V3.1] ✅ Completed!`);
  
  return {
    matches: finalResults,
    fromCache: false,
    meta: { 
      algorithmVersion: 'v3.1',
      totalCandidatesScanned: allCandidates.length
    }
  };
}


// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

export const matchingAlgorithmService = {
  findMatchesForUser,
  loadSavedMatches,
  saveMatchResults,
  deleteSavedMatches,
  getCompatibleReligiousLevels,
  areReligiousLevelsCompatible,
  calculateAge,
  getAgeRange,
  // 🆕 ייצוא פונקציות רקע לשימוש חיצוני
  createBackgroundProfile,
  calculateBackgroundMatch,
  analyzeTextLanguage,
};

export default matchingAlgorithmService;