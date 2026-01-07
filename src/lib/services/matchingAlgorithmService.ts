// src/lib/services/matchingAlgorithmService.ts
// 🎯 אלגוריתם מציאת התאמות V2 - NeshamaTech
// משלב סינון חכם + ניתוח AI מעמיק

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
  summaryText: string; // הטקסט שישלח ל-AI
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

// ============================================================================
// RELIGIOUS LEVEL MAPPING
// ============================================================================

/**
 * מפת רמות דתיות לפי סדר (מחמיר -> פתוח)
 * כל רמה תואמת לרמות סמוכות בלבד
 */
const RELIGIOUS_LEVEL_ORDER: string[] = [
  'HAREDI_STRICT',           // חרדי קיצוני
  'HAREDI',                  // חרדי
  'HAREDI_MODERN',           // חרדי מודרני
  'DATI_LEUMI_TORANI',       // דתי לאומי תורני
  'DATI_LEUMI',              // דתי לאומי
  'DATI_LEUMI_LITE',         // דתי לאומי לייט/מודרני
  'MASORTI_SHOMER_SHABBAT',  // מסורתי שומר שבת
  'MASORTI',                 // מסורתי
  'HILONI_MAZDAHE',          // חילוני מזדהה
  'HILONI',                  // חילוני
];

/**
 * מחזיר את הרמות הדתיות התואמות לרמה נתונה
 * רמות "גבוהות" (חרדי ומעלה) לא מתאימות למסורתי ומטה
 * רמות "נמוכות" (מסורתי ומטה) לא מתאימות לחרדי ומעלה
 */
function getCompatibleReligiousLevels(level: string | null): string[] {
  if (!level) return RELIGIOUS_LEVEL_ORDER; // אם לא צוין - הכל מתאים
  
  const index = RELIGIOUS_LEVEL_ORDER.indexOf(level);
  if (index === -1) return RELIGIOUS_LEVEL_ORDER; // לא נמצא - הכל מתאים
  
  // טווח של ±2 רמות (5 רמות סה"כ)
  const minIndex = Math.max(0, index - 2);
  const maxIndex = Math.min(RELIGIOUS_LEVEL_ORDER.length - 1, index + 2);
  
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

/**
 * מחשב טווח גילאים מותר על פי מגדר
 * גבר: -7 עד +5 (יכול להיות מבוגר יותר מהאישה)
 * אישה: -5 עד +5
 */
function getAgeRange(age: number, gender: Gender): { minAge: number; maxAge: number } {
  if (gender === 'MALE') {
    return {
      minAge: age - 7,  // יכול להיות עם אישה צעירה ב-7 שנים
      maxAge: age + 5   // יכול להיות עם אישה מבוגרת ב-5 שנים
    };
  } else {
    return {
      minAge: age - 5,
      maxAge: age + 5
    };
  }
}

// ============================================================================
// MAIN ALGORITHM FUNCTIONS
// ============================================================================

/**
 * שלב 1: שליפת נתוני היוזר המסומן
 */
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

/**
 * שלב 2: סינון מועמדים פוטנציאליים מה-DB
 */
async function filterCandidatesFromDb(
  targetUser: TargetUserData,
  maxCandidates: number = 50
): Promise<CandidateData[]> {
  const oppositeGender = targetUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const { minAge, maxAge } = getAgeRange(targetUser.age, targetUser.gender);
  const compatibleReligiousLevels = getCompatibleReligiousLevels(targetUser.religiousLevel);
  
  // חישוב תאריכי לידה לפי טווח הגילאים
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
        // סינון דתי - אם יש רמות תואמות
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

  // המרה למבנה הנדרש
  return candidates.map(c => {
    const age = calculateAge(c.profile!.birthDate);
    const aiSummary = c.profile!.aiProfileSummary as AiProfileSummary | null;
    
    // בניית טקסט סיכום - עדיפות ל-aiProfileSummary
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
      summaryText: summaryText.substring(0, 1500) // הגבלת אורך
    };
  });
}

/**
 * שלב 3: הכנת הנתונים לניתוח AI
 */
async function prepareDataForAi(
  targetUser: TargetUserData,
  candidates: CandidateData[]
): Promise<{ targetProfile: string; candidatesText: string }> {
  
  // הכנת פרופיל היוזר המסומן
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
    // Fallback - יצירת פרופיל נרטיבי
    console.log(`[Matching] No AI summary for target user, generating narrative...`);
    const narrative = await profileAiService.generateNarrativeProfile(targetUser.id);
    targetProfile = narrative || `${targetUser.firstName}, בן/בת ${targetUser.age}, ${targetUser.religiousLevel || 'לא צוין'}`;
  }

  // הכנת רשימת מועמדים
  const candidatesText = candidates.map((c, index) => {
    return `[מועמד/ת ${index + 1}]
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${c.summaryText}
---`;
  }).join('\n\n');

  return { targetProfile, candidatesText };
}

/**
 * שלב 4: ניתוח AI - שליחה ל-Gemini
 */
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

    // ניקוי JSON אם צריך
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonString) as AiMatchResponse;
    
    // וידוא שיש תוצאות
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
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * 🎯 הפונקציה הראשית - מציאת התאמות עבור יוזר מסומן
 * @param targetUserId - מזהה היוזר המסומן
 * @param maxCandidatesToAnalyze - מספר מועמדים מקסימלי לניתוח AI (ברירת מחדל: 15)
 * @returns מערך של התאמות מדורגות עם ציונים ונימוקים
 */
export async function findMatchesForUser(
  targetUserId: string,
  maxCandidatesToAnalyze: number = 15
): Promise<MatchResult[]> {
  console.log(`\n========================================`);
  console.log(`[Matching] Starting match search for user: ${targetUserId}`);
  console.log(`[Matching] Max candidates to analyze: ${maxCandidatesToAnalyze}`);
  console.log(`========================================\n`);

  // שלב 1: שליפת נתוני היוזר המסומן
  const targetUser = await getTargetUserData(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found or has no profile');
  }
  console.log(`[Matching] Target user: ${targetUser.firstName} ${targetUser.lastName}, Age: ${targetUser.age}, Gender: ${targetUser.gender}`);

  // שלב 2: סינון מועמדים מה-DB
  const filteredCandidates = await filterCandidatesFromDb(targetUser, maxCandidatesToAnalyze * 3);
  if (filteredCandidates.length === 0) {
    console.log(`[Matching] No candidates found after filtering`);
    return [];
  }

  // בחירת מועמדים לניתוח AI (מקסימום 15)
  const candidatesToAnalyze = filteredCandidates.slice(0, maxCandidatesToAnalyze);
  console.log(`[Matching] Selected ${candidatesToAnalyze.length} candidates for AI analysis`);

  // שלב 3: הכנת נתונים ל-AI
  const { targetProfile, candidatesText } = await prepareDataForAi(targetUser, candidatesToAnalyze);

  // שלב 4: ניתוח AI
  const aiResponse = await analyzeMatchesWithAi(targetProfile, candidatesText, candidatesToAnalyze.length);

  // שלב 5: מיפוי התוצאות
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


  console.log(`\n[Matching] ✅ Completed! Found ${results.length} matches`);
  console.log(`[Matching] Top 3 matches:`);
  results.slice(0, 3).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Score: ${m.score}`);
  });
  console.log(`========================================\n`);

  return results;
}

// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

export const matchingAlgorithmService = {
  findMatchesForUser,
  getCompatibleReligiousLevels,
  areReligiousLevelsCompatible,
  calculateAge,
  getAgeRange,
};

export default matchingAlgorithmService;