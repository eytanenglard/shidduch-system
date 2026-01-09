// src/lib/services/matchingAlgorithmService.ts
// 🎯 אלגוריתם מציאת התאמות V3.0 - NeshamaTech
// משלב סינון חכם + סריקה ראשונית ב-batches + ניתוח מעמיק של Top 15

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

// 🆕 מבנה ציון מפורט
interface ScoreBreakdown {
  religious: number;      // מתוך 35
  careerFamily: number;   // מתוך 15
  lifestyle: number;      // מתוך 15
  ambition: number;       // מתוך 12
  communication: number;  // מתוך 12
  values: number;         // מתוך 11
}

// 🆕 תוצאת התאמה משופרת
export interface MatchResult {
  userId: string;
  firstName?: string;
  lastName?: string;
  
  // ציונים
  firstPassScore: number;       // ציון מהסריקה הראשונית
  finalScore: number;           // ציון סופי (אחרי סריקה מעמיקה)
  
  // פירוט ציונים
  scoreBreakdown: ScoreBreakdown;
  
  // נימוקים
  shortReasoning: string;       // מהסריקה הראשונית (משפט אחד)
  detailedReasoning: string;    // מהסריקה המעמיקה (3-5 שורות)
  
  // מטא-דאטה
  rank?: number;                // דירוג סופי (1-15)
}

// 🆕 תוצאה מסריקה ראשונית (לפני Deep Analysis)
interface FirstPassResult {
  userId: string;
  firstName: string;
  lastName: string;
  totalScore: number;
  breakdown: ScoreBreakdown;
  shortReasoning: string;
}

// 🆕 תוצאה מסריקה מעמיקה
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

const BATCH_SIZE = 20;           // כמה מועמדים בכל batch של סריקה ראשונית
const TOP_CANDIDATES_COUNT = 15; // כמה מועמדים לבחור לסריקה מעמיקה
const STALE_DAYS = 7;            // אחרי כמה ימים התוצאות נחשבות "ישנות"

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
// SAVED RESULTS FUNCTIONS
// ============================================================================

export async function loadSavedMatches(targetUserId: string): Promise<SavedSearchResult | null> {
  console.log(`[Matching V3] Loading saved matches for user: ${targetUserId}`);

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
    console.log(`[Matching V3] No saved search found for user: ${targetUserId}`);
    return null;
  }

  const savedMatches = savedSearch.results as unknown as MatchResult[];
  const savedAt = savedSearch.updatedAt;
  
  const daysSinceSaved = Math.floor((Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceSaved > STALE_DAYS;

  if (savedMatches.length === 0) {
    console.log(`[Matching V3] Saved search exists but has no matches`);
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

  // בדיקת תקינות המועמדים השמורים
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
    console.log(`[Matching V3] Filtered out ${removedCount} unavailable candidates`);
  }

  console.log(`[Matching V3] Loaded ${filteredMatches.length} valid matches (${isStale ? 'STALE' : 'FRESH'})`);

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
  algorithmVersion: string = 'v3.0'
): Promise<void> {
  console.log(`[Matching V3] Saving ${matches.length} matches for user: ${targetUserId}`);

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

  console.log(`[Matching V3] ✅ Saved matches successfully`);
}

export async function deleteSavedMatches(targetUserId: string): Promise<void> {
  await prisma.savedMatchSearch.delete({
    where: { targetUserId }
  }).catch(() => {});
  console.log(`[Matching V3] Deleted saved matches for user: ${targetUserId}`);
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
 * 🆕 שליפת כל המועמדים הרלוונטיים (בלי LIMIT נמוך)
 */
async function fetchAllRelevantCandidates(
  targetUser: TargetUserData
): Promise<CandidateData[]> {
  const oppositeGender = targetUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const { minAge, maxAge } = getAgeRange(targetUser.age, targetUser.gender);
  const compatibleReligiousLevels = getCompatibleReligiousLevels(targetUser.religiousLevel);
  
  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minBirthDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  console.log(`[Matching V3] Fetching ALL relevant candidates for ${targetUser.firstName}:`);
  console.log(`  - Gender: ${oppositeGender}`);
  console.log(`  - Age range: ${minAge}-${maxAge}`);
  console.log(`  - Compatible religious levels: ${compatibleReligiousLevels.join(', ')}`);

  // 🆕 שליפה בלי LIMIT - מביאים את כולם
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
    orderBy: {
      profile: {
        updatedAt: 'desc'
      }
    }
  });

  console.log(`[Matching V3] Found ${candidates.length} total relevant candidates`);

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

// ============================================================================
// AI PROMPT GENERATORS
// ============================================================================

function generateFirstPassPrompt(
  targetProfile: string,
  candidates: CandidateData[],
  batchNumber: number,
  totalBatches: number
): string {
  const candidatesText = candidates.map((c, index) => {
    return `[מועמד/ת ${index + 1}]
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${c.summaryText}
---`;
  }).join('\n\n');

  return `אתה שדכן AI מומחה במערכת NeshamaTech.

המשימה: לנתח התאמות פוטנציאליות בין המועמד/ת המסומן/ת לבין רשימת מועמדים.
(Batch ${batchNumber}/${totalBatches})

=== פרופיל המועמד/ת המסומן/ת ===
${targetProfile}

=== מועמדים לניתוח (${candidates.length} מועמדים) ===
${candidatesText}

=== מערכת הציון (100 נקודות) ===

חלק את הציון ל-6 קטגוריות:

1. התאמה דתית-רוחנית (35 נקודות)
   - האם ברמה דתית דומה או תואמת?
   - האם הכיוון הרוחני דומה (בעל תשובה, צבר דתי, וכו')?
   - האם יש גמישות או קפדנות דומה?

2. וייב קריירה-משפחה (15 נקודות)
   - קריירה לוחצת (הייטק, משפטים, רפואה) vs מאוזנת
   - האם שניהם בתפיסה דומה לגבי עבודה/משפחה?

3. סגנון חיים (15 נקודות)
   - חוויות עומק (לימוד, אמנות, פילוסופיה) vs הנאה קלילה
   - יחס לטבע וטיולים
   - סגנון בילויים וחופשות

4. רמת שאפתנות (12 נקודות)
   - שאפתני ודוחף vs שלו ומרוצה
   - האם הדינמיקה תעבוד? (דומה או משלים)

5. אנרגיה ותקשורת (12 נקודות)
   - מופנם vs מוחצן
   - רגשי vs שכלי
   - סגנון תקשורת

6. ערכים ועדיפויות (11 נקודות)
   - מה חשוב בחיים (משפחה, קריירה, צמיחה, נתינה)
   - האם סדרי העדיפויות תואמים?

=== הוראות ===
- דרג כל מועמד/ת מ-0 עד 100
- פרט את הציון לפי הקטגוריות
- כתוב נימוק קצר (משפט אחד בלבד)
- התייחס רק למידע שיש לך, אל תמציא

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
      "shortReasoning": "התאמה דתית טובה, שניהם בכיוון קריירה מאוזן"
    }
  ]
}

התשובה חייבת להיות JSON תקין בלבד, בלי טקסט נוסף.`;
}

function generateDeepAnalysisPrompt(
  targetProfile: string,
  topCandidates: Array<CandidateData & { firstPassScore: number; breakdown: ScoreBreakdown; shortReasoning: string }>
): string {
  const candidatesText = topCandidates.map((c, index) => {
    return `[מועמד/ת ${index + 1}] - ציון ראשוני: ${c.firstPassScore}
שם: ${c.firstName} ${c.lastName}
גיל: ${c.age} | רמה דתית: ${c.religiousLevel || 'לא צוין'} | עיר: ${c.city || 'לא צוין'} | עיסוק: ${c.occupation || 'לא צוין'}
${c.summaryText}
פירוט ציון ראשוני: דתי=${c.breakdown.religious}/35, קריירה-משפחה=${c.breakdown.careerFamily}/15, סגנון חיים=${c.breakdown.lifestyle}/15, שאפתנות=${c.breakdown.ambition}/12, תקשורת=${c.breakdown.communication}/12, ערכים=${c.breakdown.values}/11
נימוק ראשוני: ${c.shortReasoning}
---`;
  }).join('\n\n');

  return `אתה שדכן AI מומחה במערכת NeshamaTech.

המשימה: לבצע ניתוח מעמיק והשוואה בין ${topCandidates.length} המועמדים המובילים עבור המועמד/ת המסומן/ת.

=== פרופיל המועמד/ת המסומן/ת ===
${targetProfile}

=== ${topCandidates.length} המועמדים המובילים ===
${candidatesText}

=== המשימה ===

1. סקור שוב את כל ${topCandidates.length} המועמדים
2. השווה ביניהם - מי באמת הכי מתאים?
3. לכל מועמד/ת:
   - תן ציון סופי (0-100) - יכול להיות שונה מהציון הראשוני
   - כתוב נימוק מפורט (3-5 שורות) שמסביר:
     * למה ההתאמה טובה (או פחות טובה)
     * מה הפוטנציאל לכימיה
     * האם יש אזהרות או נקודות לתשומת לב
     * מה הייחודיות של ההתאמה הזו

4. דרג את כל ${topCandidates.length} מהכי מתאים (rank=1) לפחות מתאים (rank=${topCandidates.length})

=== קריטריונים להתעמקות ===

- חפש "כימיה פוטנציאלית" - לא רק התאמה טכנית
- שים לב להשלמות - לפעמים שונה = טוב
- זהה "red flags" פוטנציאליים
- חשוב כמו שדכן אנושי - מה היית אומר למועמד/ת?

=== פורמט התשובה (JSON בלבד) ===
{
  "deepAnalysis": [
    {
      "index": 1,
      "userId": "user_id_here",
      "finalScore": 92,
      "rank": 1,
      "detailedReasoning": "התאמה יוצאת דופן. שניהם דתיים לאומיים תורניים עם גישה פתוחה ומקבלת. יש כאן פוטנציאל אמיתי לכימיה - שניהם אוהבים טיולים בטבע ומחפשים עומק בחיים. הוא קצת יותר שאפתן בקריירה, היא יותר ממוקדת משפחה - זה יכול להיות השלמה טובה. נקודה לתשומת לב: הוא מירושלים והיא מתל אביב - כדאי לברר גמישות מיקום."
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

/**
 * 🆕 שלב 2: סריקה ראשונית ב-batches
 */
async function runFirstPassAnalysis(
  targetProfile: string,
  candidates: CandidateData[]
): Promise<FirstPassResult[]> {
  const model = await getGeminiModel();
  const allResults: FirstPassResult[] = [];
  
  const totalBatches = Math.ceil(candidates.length / BATCH_SIZE);
  console.log(`[Matching V3] Starting First Pass: ${candidates.length} candidates in ${totalBatches} batches`);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, candidates.length);
    const batchCandidates = candidates.slice(start, end);
    
    console.log(`[Matching V3] Processing batch ${batchIndex + 1}/${totalBatches} (${batchCandidates.length} candidates)`);
    
    const prompt = generateFirstPassPrompt(
      targetProfile,
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
      
      console.log(`[Matching V3] Batch ${batchIndex + 1} completed in ${duration}ms`);

      const parsed = parseJsonResponse<AiFirstPassResponse>(jsonString);
      
      if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
        console.error(`[Matching V3] Invalid response format for batch ${batchIndex + 1}`);
        continue;
      }

      // מיפוי התוצאות
      for (const aiResult of parsed.candidates) {
        const candidate = batchCandidates[aiResult.index - 1];
        if (!candidate) continue;

        allResults.push({
          userId: candidate.userId,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          totalScore: Math.min(100, Math.max(0, aiResult.totalScore)),
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
      console.error(`[Matching V3] Error in batch ${batchIndex + 1}:`, error);
      // ממשיכים ל-batch הבא גם אם יש שגיאה
    }
  }

  // מיון לפי ציון
  allResults.sort((a, b) => b.totalScore - a.totalScore);
  
  console.log(`[Matching V3] First Pass completed: ${allResults.length} candidates scored`);
  if (allResults.length > 0) {
    console.log(`[Matching V3] Top 3 from First Pass:`);
    allResults.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.firstName} ${r.lastName} - Score: ${r.totalScore}`);
    });
  }

  return allResults;
}

/**
 * 🆕 שלב 4: סריקה מעמיקה של Top 15
 */
async function runDeepAnalysis(
  targetProfile: string,
  topCandidates: Array<CandidateData & FirstPassResult>
): Promise<DeepAnalysisResult[]> {
  const model = await getGeminiModel();
  
  console.log(`[Matching V3] Starting Deep Analysis for ${topCandidates.length} candidates`);
  
  const prompt = generateDeepAnalysisPrompt(targetProfile, topCandidates.map(c => ({
    ...c,
    firstPassScore: c.totalScore
  })));

  try {
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();
    const duration = Date.now() - startTime;
    
    console.log(`[Matching V3] Deep Analysis completed in ${duration}ms`);

    const parsed = parseJsonResponse<AiDeepAnalysisResponse>(jsonString);
    
    if (!parsed.deepAnalysis || !Array.isArray(parsed.deepAnalysis)) {
      throw new Error('Invalid Deep Analysis response format');
    }

    // מיפוי ה-userId מה-index
    const results: DeepAnalysisResult[] = parsed.deepAnalysis.map(aiResult => {
      const candidate = topCandidates[aiResult.index - 1];
      return {
        userId: candidate?.userId || aiResult.userId,
        finalScore: Math.min(100, Math.max(0, aiResult.finalScore)),
        rank: aiResult.rank,
        detailedReasoning: aiResult.detailedReasoning || ''
      };
    });

    // מיון לפי rank
    results.sort((a, b) => a.rank - b.rank);

    console.log(`[Matching V3] Deep Analysis results:`);
    results.slice(0, 3).forEach(r => {
      const candidate = topCandidates.find(c => c.userId === r.userId);
      console.log(`  Rank ${r.rank}: ${candidate?.firstName} ${candidate?.lastName} - Final Score: ${r.finalScore}`);
    });

    return results;

  } catch (error) {
    console.error(`[Matching V3] Error in Deep Analysis:`, error);
    // במקרה של שגיאה, מחזירים את התוצאות מהסריקה הראשונית
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
    console.log(`[Matching V3] No AI summary for target user, generating narrative...`);
    const narrative = await profileAiService.generateNarrativeProfile(targetUser.id);
    targetProfile = narrative || `${targetUser.firstName}, בן/בת ${targetUser.age}, ${targetUser.religiousLevel || 'לא צוין'}`;
  }

  return targetProfile;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * 🎯 הפונקציה הראשית V3.0 - מציאת התאמות עבור יוזר מסומן
 */
export async function findMatchesForUser(
  targetUserId: string,
  matchmakerId: string,
  options: {
    maxCandidatesToAnalyze?: number;  // לא בשימוש ב-V3 - סורקים את כולם
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
  console.log(`[Matching V3] Starting match search for user: ${targetUserId}`);
  console.log(`[Matching V3] Options: forceRefresh=${forceRefresh}, autoSave=${autoSave}`);
  console.log(`========================================\n`);

  // בדיקת Cache
  if (!forceRefresh) {
    const savedResults = await loadSavedMatches(targetUserId);
    
    if (savedResults && savedResults.matches.length > 0) {
      console.log(`[Matching V3] ✅ Using cached results (${savedResults.matches.length} matches)`);
      
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

  // === שלב 1: שליפת נתוני המועמד המסומן ===
  const targetUser = await getTargetUserData(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found or has no profile');
  }
  console.log(`[Matching V3] Target user: ${targetUser.firstName} ${targetUser.lastName}, Age: ${targetUser.age}, Gender: ${targetUser.gender}`);

  // === שלב 2: שליפת כל המועמדים הרלוונטיים ===
  const allCandidates = await fetchAllRelevantCandidates(targetUser);
  if (allCandidates.length === 0) {
    console.log(`[Matching V3] No candidates found after filtering`);
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v3.0', totalCandidatesScanned: 0 }
    };
  }

  // === שלב 3: הכנת פרופיל ה-Target ===
  const targetProfile = await prepareTargetProfile(targetUser);

  // === שלב 4: סריקה ראשונית ב-batches ===
  const firstPassResults = await runFirstPassAnalysis(targetProfile, allCandidates);
  
  if (firstPassResults.length === 0) {
    console.log(`[Matching V3] No results from First Pass`);
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v3.0', totalCandidatesScanned: allCandidates.length }
    };
  }

  // === שלב 5: בחירת Top 15 ===
  const topCandidates = firstPassResults.slice(0, TOP_CANDIDATES_COUNT);
  
  // מיפוי עם הנתונים המלאים
  const topCandidatesWithData = topCandidates.map(result => {
    const candidateData = allCandidates.find(c => c.userId === result.userId)!;
    return {
      ...candidateData,
      ...result
    };
  });

  // === שלב 6: סריקה מעמיקה של Top 15 ===
  const deepAnalysisResults = await runDeepAnalysis(targetProfile, topCandidatesWithData);

  // === שלב 7: מיזוג התוצאות ===
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
    };
  });

  // מיון לפי rank
  finalResults.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // === שלב 8: שמירה ===
  if (autoSave && finalResults.length > 0) {
    await saveMatchResults(targetUserId, matchmakerId, finalResults, allCandidates.length, 'v3.0');
  }

  console.log(`\n[Matching V3] ✅ Completed! Found ${finalResults.length} matches`);
  console.log(`[Matching V3] Total candidates scanned: ${allCandidates.length}`);
  console.log(`[Matching V3] Final Top 3:`);
  finalResults.slice(0, 3).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Final Score: ${m.finalScore} (First Pass: ${m.firstPassScore})`);
  });
  console.log(`========================================\n`);

  return {
    matches: finalResults,
    fromCache: false,
    meta: { 
      algorithmVersion: 'v3.0',
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
};

export default matchingAlgorithmService;