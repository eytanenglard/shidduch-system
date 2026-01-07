// src/lib/services/matchingAlgorithmService.ts
// 🎯 אלגוריתם מציאת התאמות V2.1 - NeshamaTech
// משלב סינון חכם + ניתוח AI מעמיק + שמירת תוצאות

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
}

export interface MatchResult {
  userId: string;
  score: number;
  reasoning: string;
  firstName?: string;
  lastName?: string;
}

interface AiMatchResponse {
  matches: Array<{
    candidateIndex: number;
    score: number;
    reasoning: string;
  }>;
}

// 🆕 Interface לתוצאות שמורות
export interface SavedSearchResult {
  matches: MatchResult[];
  meta: {
    savedAt: Date;
    matchmakerId: string;
    algorithmVersion: string;
    originalCandidatesCount: number;
    validCandidatesCount: number;  // כמה עדיין תקפים
    isStale: boolean;              // האם עברו יותר מ-7 ימים
  };
}

// ============================================================================
// RELIGIOUS LEVEL MAPPING
// ============================================================================

// ============================================================================
// RELIGIOUS LEVEL MAPPING
// ============================================================================

/**
 * מפת רמות דתיות לפי סדר (מחמיר -> פתוח)
 * הסדר קריטי לאלגוריתם כדי למצוא התאמות "קרובות"
 */
const RELIGIOUS_LEVEL_ORDER: string[] = [
  // --- חרדי ---
  'charedi_hasidic',       // חרדי חסידי (לרוב המחמיר/שמרני ביותר)
  'charedi_litvak',        // חרדי ליטאי
  'charedi_sephardic',     // חרדי ספרדי
  'chabad',                // חב"ד (שמנו כאן בגלל האופי החרדי, למרות הייחוד)
  'breslov',               // ברסלב
  'charedi_modern',        // חרדי מודרני (גשר לדתי לאומי)

  // --- דתי לאומי ---
  'dati_leumi_torani',     // דתי לאומי תורני
  'dati_leumi_standard',   // דתי לאומי (סטנדרטי)
  'dati_leumi_liberal',    // דתי לאומי ליברלי

  // --- מסורתי ---
  'masorti_strong',        // מסורתי (קרוב לדת)
  'masorti_light',         // מסורתי (קשר קל)

  // --- חילוני ורוחני ---
  'secular_traditional_connection', // חילוני עם זיקה
  'secular',               // חילוני
  'spiritual_not_religious', // רוחני
  'other'                  // אחר
];

/**
 * מחזיר את הרמות הדתיות התואמות לרמה נתונה
 * מכיוון שהרשימה גדלה (15 רמות במקום 10), הגדלתי מעט את הטווח ל-3 רמות לכל כיוון
 */
function getCompatibleReligiousLevels(level: string | null): string[] {
  if (!level) return RELIGIOUS_LEVEL_ORDER; // אם לא צוין - הכל מתאים
  
  const index = RELIGIOUS_LEVEL_ORDER.indexOf(level);
  if (index === -1) return RELIGIOUS_LEVEL_ORDER; // לא נמצא - הכל מתאים
  
  // עדכון: טווח של ±3 רמות (במקום 2) כדי לאפשר גמישות ברשימה הארוכה יותר
  // למשל: 'דתי לאומי סטנדרטי' יראה גם 'חרדי מודרני' וגם 'מסורתי קרוב לדת'
  const minIndex = Math.max(0, index - 3);
  const maxIndex = Math.min(RELIGIOUS_LEVEL_ORDER.length - 1, index + 3);
  
  return RELIGIOUS_LEVEL_ORDER.slice(minIndex, maxIndex + 1);
}

/**
 * בדיקה מהירה האם שתי רמות דתיות תואמות
 */
function areReligiousLevelsCompatible(level1: string | null, level2: string | null): boolean {
  if (!level1 || !level2) return true; // אם אחד לא צוין - מתאים
  
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
// 🆕 SAVED RESULTS FUNCTIONS
// ============================================================================

/**
 * טוען תוצאות שמורות עבור יוזר מסומן
 * מסנן אוטומטית מועמדים שכבר לא זמינים או נמחקו
 */
export async function loadSavedMatches(targetUserId: string): Promise<SavedSearchResult | null> {
  console.log(`[Matching] Loading saved matches for user: ${targetUserId}`);

  // שליפת החיפוש השמור
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
    console.log(`[Matching] No saved search found for user: ${targetUserId}`);
    return null;
  }

const savedMatches = savedSearch.results as unknown as MatchResult[];
  const savedAt = savedSearch.updatedAt;
  
  // בדיקה האם התוצאות "ישנות" (יותר מ-7 ימים)
  const daysSinceSaved = Math.floor((Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceSaved > 7;

  if (savedMatches.length === 0) {
    console.log(`[Matching] Saved search exists but has no matches`);
    return {
      matches: [],
      meta: {
        savedAt,
        matchmakerId: savedSearch.matchmakerId,
        algorithmVersion: savedSearch.algorithmVersion,
        originalCandidatesCount: savedSearch.candidatesCount,
        validCandidatesCount: 0,
        isStale,
      }
    };
  }

  // שליפת מזהי המועמדים השמורים
  const savedUserIds = savedMatches.map(m => m.userId);

  // בדיקה אילו מועמדים עדיין תקפים (קיימים, פעילים, וזמינים)
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

  // סינון התוצאות - רק מועמדים תקפים
  const filteredMatches = savedMatches
    .filter(match => validUserIds.has(match.userId))
    .map(match => {
      const user = validUserMap.get(match.userId);
      return {
        ...match,
        // עדכון השמות למקרה שהשתנו
        firstName: user?.firstName || match.firstName,
        lastName: user?.lastName || match.lastName,
      };
    });

  const removedCount = savedMatches.length - filteredMatches.length;
  if (removedCount > 0) {
    console.log(`[Matching] Filtered out ${removedCount} unavailable candidates`);
  }

  console.log(`[Matching] Loaded ${filteredMatches.length} valid matches (${isStale ? 'STALE' : 'FRESH'})`);

  return {
    matches: filteredMatches,
    meta: {
      savedAt,
      matchmakerId: savedSearch.matchmakerId,
      algorithmVersion: savedSearch.algorithmVersion,
      originalCandidatesCount: savedSearch.candidatesCount,
      validCandidatesCount: filteredMatches.length,
      isStale,
    }
  };
}

/**
 * שומר תוצאות חיפוש התאמות
 */
export async function saveMatchResults(
  targetUserId: string,
  matchmakerId: string,
  matches: MatchResult[],
  algorithmVersion: string = 'v2.1'
): Promise<void> {
  console.log(`[Matching] Saving ${matches.length} matches for user: ${targetUserId}`);

  await prisma.savedMatchSearch.upsert({
    where: { targetUserId },
    create: {
      targetUserId,
      matchmakerId,
     results: matches as any,
      algorithmVersion,
      candidatesCount: matches.length,
    },
    update: {
      matchmakerId,
      results: matches as any,
      algorithmVersion,
      candidatesCount: matches.length,
      updatedAt: new Date(),
    }
  });

  console.log(`[Matching] ✅ Saved matches successfully`);
}

/**
 * מוחק תוצאות שמורות
 */
export async function deleteSavedMatches(targetUserId: string): Promise<void> {
  await prisma.savedMatchSearch.delete({
    where: { targetUserId }
  }).catch(() => {
    // אם לא קיים - לא משנה
  });
  console.log(`[Matching] Deleted saved matches for user: ${targetUserId}`);
}

// ============================================================================
// MAIN ALGORITHM FUNCTIONS
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
        }
      }
    }
  });

  if (!user || !user.profile) return null;

  const age = calculateAge(user.profile.birthDate);
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    gender: user.profile.gender,
    birthDate: user.profile.birthDate,
    age,
    religiousLevel: user.profile.religiousLevel,
    aiProfileSummary: user.profile.aiProfileSummary as AiProfileSummary | null,
  };
}

async function filterCandidatesFromDb(
  targetUser: TargetUserData,
  maxCandidates: number = 50
): Promise<CandidateData[]> {
  const oppositeGender = targetUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const { minAge, maxAge } = getAgeRange(targetUser.age, targetUser.gender);
  const compatibleReligiousLevels = getCompatibleReligiousLevels(targetUser.religiousLevel);
  
  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minBirthDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  console.log(`[Matching] Filtering candidates for ${targetUser.firstName}:`);
  console.log(`  - Gender: ${oppositeGender}`);
  console.log(`  - Age range: ${minAge}-${maxAge}`);
  console.log(`  - Compatible religious levels: ${compatibleReligiousLevels.join(', ')}`);

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
        }
      }
    },
    take: maxCandidates,
    orderBy: {
      profile: {
        updatedAt: 'desc'
      }
    }
  });

  console.log(`[Matching] Found ${candidates.length} candidates after DB filtering`);

  return candidates.map(c => {
    const age = calculateAge(c.profile!.birthDate);
    const aiSummary = c.profile!.aiProfileSummary as AiProfileSummary | null;
    
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
      summaryText: summaryText.substring(0, 1500)
    };
  });
}

async function prepareDataForAi(
  targetUser: TargetUserData,
  candidates: CandidateData[]
): Promise<{ targetProfile: string; candidatesText: string }> {
  
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
    console.log(`[Matching] No AI summary for target user, generating narrative...`);
    const narrative = await profileAiService.generateNarrativeProfile(targetUser.id);
    targetProfile = narrative || `${targetUser.firstName}, בן/בת ${targetUser.age}, ${targetUser.religiousLevel || 'לא צוין'}`;
  }

  const candidatesText = candidates.map((c, index) => {
    return `[מועמד/ת ${index + 1}]
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${c.summaryText}
---`;
  }).join('\n\n');

  return { targetProfile, candidatesText };
}

async function analyzeMatchesWithAi(
  targetProfile: string,
  candidatesText: string,
  candidateCount: number
): Promise<AiMatchResponse> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  const prompt = `אתה שדכן AI מומחה במערכת NeshamaTech. המטרה שלך: לנתח התאמות פוטנציאליות בין המועמד/ת המסומן/ת לבין רשימת מועמדים.

=== פרופיל המועמד/ת המסומן/ת ===
${targetProfile}

=== רשימת מועמדים לניתוח (${candidateCount} מועמדים) ===
${candidatesText}

=== הוראות ===
1. נתח כל מועמד/ת והעריך את רמת ההתאמה למועמד/ת המסומן/ת
2. התחשב בגורמים הבאים:
   - התאמה ערכית ודתית
   - התאמה אישיותית (אנרגיה, סגנון תקשורת, ערכים)
   - התאמה בסגנון חיים (קריירה, משפחה, שאיפות)
   - פוטנציאל לחיבור רגשי
3. דרג כל מועמד/ת מ-0 עד 100
4. כתוב נימוק קצר (עד 100 מילים) לכל התאמה

=== פורמט התשובה ===
החזר JSON בפורמט הבא:
{
  "matches": [
    {
      "candidateIndex": 1,
      "score": 85,
      "reasoning": "נימוק קצר להתאמה..."
    },
    ...
  ]
}

דרג את כל ${candidateCount} המועמדים, מהציון הגבוה לנמוך.
התשובה חייבת להיות ב-JSON בלבד, בלי טקסט נוסף.`;

  try {
    console.log(`[Matching AI] Sending ${candidateCount} candidates to Gemini for analysis...`);
    const startTime = Date.now();
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonString = response.text();

    const duration = Date.now() - startTime;
    console.log(`[Matching AI] Gemini responded in ${duration}ms`);

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonString) as AiMatchResponse;
    
    if (!parsed.matches || !Array.isArray(parsed.matches)) {
      throw new Error('Invalid AI response format');
    }

    console.log(`[Matching AI] Successfully analyzed ${parsed.matches.length} candidates`);
    return parsed;

  } catch (error) {
    console.error('[Matching AI] Error during AI analysis:', error);
    throw error;
  }
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * 🎯 הפונקציה הראשית - מציאת התאמות עבור יוזר מסומן
 * @param targetUserId - מזהה היוזר המסומן
 * @param matchmakerId - מזהה השדכן שמבצע את החיפוש (לשמירה)
 * @param options - אפשרויות נוספות
 */
export async function findMatchesForUser(
  targetUserId: string,
  matchmakerId: string,
  options: {
    maxCandidatesToAnalyze?: number;
    forceRefresh?: boolean;        // 🆕 האם לאלץ חיפוש חדש
    autoSave?: boolean;            // 🆕 האם לשמור אוטומטית
  } = {}
): Promise<{
  matches: MatchResult[];
  fromCache: boolean;
  meta: {
    savedAt?: Date;
    isStale?: boolean;
    algorithmVersion: string;
  };
}> {
  const {
    maxCandidatesToAnalyze = 15,
    forceRefresh = false,
    autoSave = true,
  } = options;

  console.log(`\n========================================`);
  console.log(`[Matching] Starting match search for user: ${targetUserId}`);
  console.log(`[Matching] Options: forceRefresh=${forceRefresh}, autoSave=${autoSave}`);
  console.log(`========================================\n`);

  // 🆕 בדיקה אם יש תוצאות שמורות (אלא אם ביקשו רענון)
  if (!forceRefresh) {
    const savedResults = await loadSavedMatches(targetUserId);
    
    if (savedResults && savedResults.matches.length > 0) {
      console.log(`[Matching] ✅ Using cached results (${savedResults.matches.length} matches)`);
      
      return {
        matches: savedResults.matches,
        fromCache: true,
        meta: {
          savedAt: savedResults.meta.savedAt,
          isStale: savedResults.meta.isStale,
          algorithmVersion: savedResults.meta.algorithmVersion,
        }
      };
    }
  }

  // המשך עם חיפוש חדש
  const targetUser = await getTargetUserData(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found or has no profile');
  }
  console.log(`[Matching] Target user: ${targetUser.firstName} ${targetUser.lastName}, Age: ${targetUser.age}, Gender: ${targetUser.gender}`);

  const filteredCandidates = await filterCandidatesFromDb(targetUser, maxCandidatesToAnalyze * 3);
  if (filteredCandidates.length === 0) {
    console.log(`[Matching] No candidates found after filtering`);
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v2.1' }
    };
  }

  const candidatesToAnalyze = filteredCandidates.slice(0, maxCandidatesToAnalyze);
  console.log(`[Matching] Selected ${candidatesToAnalyze.length} candidates for AI analysis`);

  const { targetProfile, candidatesText } = await prepareDataForAi(targetUser, candidatesToAnalyze);
  const aiResponse = await analyzeMatchesWithAi(targetProfile, candidatesText, candidatesToAnalyze.length);

  const results: MatchResult[] = aiResponse.matches
    .map((match): MatchResult | null => {
      const candidate = candidatesToAnalyze[match.candidateIndex - 1];
      if (!candidate) return null;
      
      return {
        userId: candidate.userId,
        score: Math.min(100, Math.max(0, match.score)), // וידוא טווח 0-100
        reasoning: match.reasoning,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
      };
    })
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => b.score - a.score); // מיון לפי ציון יורד


  // 🆕 שמירה אוטומטית
  if (autoSave && results.length > 0) {
    await saveMatchResults(targetUserId, matchmakerId, results, 'v2.1');
  }

  console.log(`\n[Matching] ✅ Completed! Found ${results.length} matches`);
  console.log(`[Matching] Top 3 matches:`);
  results.slice(0, 3).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Score: ${m.score}`);
  });
  console.log(`========================================\n`);

  return {
    matches: results,
    fromCache: false,
    meta: { algorithmVersion: 'v2.1' }
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
};

export default matchingAlgorithmService;