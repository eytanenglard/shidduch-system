// src/lib/services/matchingAlgorithmService.ts
// 🎯 אלגוריתם מציאת התאמות V2.5.1 - NeshamaTech
// גרסה משופרת עם לוגים מפורטים לדיבאג

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
  hasAiSummary: boolean;
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

export interface SavedSearchResult {
  matches: MatchResult[];
  meta: {
    savedAt: Date;
    matchmakerId: string;
    algorithmVersion: string;
    originalCandidatesCount: number;
    validCandidatesCount: number;
    isStale: boolean;
  };
}

// ============================================================================
// 🆕 CONFIGURATION - הגדלתי את AI_MAX ל-30!
// ============================================================================

const CONFIG = {
  // DB Filtering - null = NO LIMIT, scans everything!
  DB_LIMIT: null as number | null,
  
  // 🆕 AI Analysis - שולח 30 ל-AI במקום 15!
  AI_MAX_CANDIDATES: 30,
  
  // Smart Pre-filtering
  PRIORITIZE_AI_SUMMARIES: true,
  
  // Cache
  CACHE_STALE_DAYS: 7,
  
  // 🆕 Debug mode - מציג את כל המועמדים שנמצאו
  DEBUG_SHOW_ALL_CANDIDATES: true,
};

// ============================================================================
// RELIGIOUS LEVEL MAPPING
// ============================================================================

const RELIGIOUS_LEVEL_ORDER: string[] = [
  'charedi_hasidic', 'charedi_litvak', 'charedi_sephardic', 'chabad', 'breslov', 'charedi_modern',
  'dati_leumi_torani', 'dati_leumi_standard', 'dati_leumi_liberal',
  'masorti_strong', 'masorti_light',
  'secular_traditional_connection', 'secular', 'spiritual_not_religious', 'other'
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
// LOGGING UTILITIES
// ============================================================================

function logSection(title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📌 ${title}`);
  console.log(`${'='.repeat(60)}`);
}

function logStep(step: number, description: string) {
  console.log(`\n[Step ${step}] ${description}`);
  console.log(`${'-'.repeat(50)}`);
}

function logStats(label: string, value: number | string) {
  console.log(`   📊 ${label}: ${value}`);
}

// ============================================================================
// SAVED RESULTS FUNCTIONS
// ============================================================================

export async function loadSavedMatches(targetUserId: string): Promise<SavedSearchResult | null> {
  console.log(`[Cache] Loading saved matches for user: ${targetUserId}`);

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
    console.log(`[Cache] ❌ No saved search found`);
    return null;
  }

  const savedMatches = savedSearch.results as unknown as MatchResult[];
  const savedAt = savedSearch.updatedAt;
  const daysSinceSaved = Math.floor((Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceSaved > CONFIG.CACHE_STALE_DAYS;

  if (savedMatches.length === 0) {
    console.log(`[Cache] ⚠️ Saved search exists but has no matches`);
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
    select: { id: true, firstName: true, lastName: true }
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
    console.log(`[Cache] ⚠️ Filtered out ${removedCount} unavailable candidates`);
  }

  console.log(`[Cache] ✅ Loaded ${filteredMatches.length} valid matches (${isStale ? 'STALE' : 'FRESH'})`);

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

export async function saveMatchResults(
  targetUserId: string,
  matchmakerId: string,
  matches: MatchResult[],
  algorithmVersion: string = 'v2.5.1',
  candidatesCount: number = 0
): Promise<void> {
  console.log(`[Cache] Saving ${matches.length} matches for user: ${targetUserId}`);

  await prisma.savedMatchSearch.upsert({
    where: { targetUserId },
    create: {
      targetUserId,
      matchmakerId,
      results: matches as unknown as Parameters<typeof prisma.savedMatchSearch.create>[0]['data']['results'],
      algorithmVersion,
      candidatesCount,
    },
    update: {
      matchmakerId,
      results: matches as unknown as Parameters<typeof prisma.savedMatchSearch.update>[0]['data']['results'],
      algorithmVersion,
      candidatesCount,
      updatedAt: new Date(),
    }
  });

  console.log(`[Cache] ✅ Saved matches successfully`);
}

export async function deleteSavedMatches(targetUserId: string): Promise<void> {
  await prisma.savedMatchSearch.delete({
    where: { targetUserId }
  }).catch(() => { });
  console.log(`[Cache] Deleted saved matches for user: ${targetUserId}`);
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

/**
 * 🆕 גרסה V2.5.1 - ללא LIMIT + לוגים מפורטים
 */
async function filterCandidatesFromDb(
  targetUser: TargetUserData,
  maxCandidates: number | null = CONFIG.DB_LIMIT
): Promise<{ candidates: CandidateData[]; totalFound: number }> {
  const oppositeGender = targetUser.gender === 'MALE' ? 'FEMALE' : 'MALE';
  const { minAge, maxAge } = getAgeRange(targetUser.age, targetUser.gender);
  const compatibleReligiousLevels = getCompatibleReligiousLevels(targetUser.religiousLevel);

  const today = new Date();
  const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minBirthDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  logStep(1, "DB Filtering - Searching for ALL matching candidates");
  logStats("Target gender", oppositeGender);
  logStats("Age range", `${minAge}-${maxAge}`);
  logStats("Compatible religious levels", compatibleReligiousLevels.join(', '));
  logStats("DB LIMIT", maxCandidates === null ? "🚀 NONE (scanning ALL)" : maxCandidates.toString());

  const whereClause = {
    id: { not: targetUser.id },
    status: 'ACTIVE' as const,
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
  };

  const totalCount = await prisma.user.count({ where: whereClause });
  logStats("Total matching in DB", totalCount);

  const candidates = await prisma.user.findMany({
    where: whereClause,
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
    },
    ...(maxCandidates !== null && { take: maxCandidates })
  });

  logStats("Candidates retrieved", candidates.length);

  // 🆕 DEBUG: הצגת כל המועמדים שנמצאו
  if (CONFIG.DEBUG_SHOW_ALL_CANDIDATES) {
    console.log(`\n   📋 ALL ${candidates.length} candidates found in DB:`);
    candidates.forEach((c, i) => {
      const profile = c.profile;
      if (profile) {
        const age = calculateAge(profile.birthDate);
        const aiSummary = profile.aiProfileSummary as AiProfileSummary | null;
        const hasAi = !!aiSummary?.personalitySummary;
        console.log(`   ${i + 1}. ${c.firstName} ${c.lastName} - Age: ${age}, Religious: ${profile.religiousLevel || 'N/A'}, City: ${profile.city || 'N/A'} [AI: ${hasAi ? '✅' : '❌'}]`);
      }
    });
  }

  const mappedCandidates: CandidateData[] = candidates
    .filter(c => c.profile !== null)
    .map(c => {
      const profile = c.profile!;
      const age = calculateAge(profile.birthDate);
      const aiSummary = profile.aiProfileSummary as AiProfileSummary | null;
      const hasAiSummary = !!aiSummary?.personalitySummary;

      let summaryText = '';
      if (aiSummary?.personalitySummary) {
        summaryText = `אישיות: ${aiSummary.personalitySummary}\nמה מחפש/ת: ${aiSummary.lookingForSummary || 'לא צוין'}`;
      } else if (profile.about) {
        summaryText = `אודות: ${profile.about}`;
      } else {
        summaryText = `מועמד/ת בן/בת ${age}, ${profile.religiousLevel || 'לא צוין'}, ${profile.city || 'לא צוין'}`;
      }

      return {
        userId: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        age,
        religiousLevel: profile.religiousLevel,
        city: profile.city,
        occupation: profile.occupation,
        summaryText: summaryText.substring(0, 1500),
        hasAiSummary,
      };
    });

  return { candidates: mappedCandidates, totalFound: totalCount };
}

/**
 * Smart pre-ranking - מעדיף מועמדים עם AI summary
 */
function smartRankCandidates(candidates: CandidateData[]): CandidateData[] {
  if (!CONFIG.PRIORITIZE_AI_SUMMARIES) {
    return candidates;
  }

  const withAiSummary = candidates.filter(c => c.hasAiSummary);
  const withoutAiSummary = candidates.filter(c => !c.hasAiSummary);

  console.log(`   📊 Candidates with AI summary: ${withAiSummary.length}`);
  console.log(`   📊 Candidates without AI summary: ${withoutAiSummary.length}`);

  return [...withAiSummary, ...withoutAiSummary];
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
    console.log(`[AI Prep] No AI summary for target user, generating narrative...`);
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
    console.log(`[AI] Sending ${candidateCount} candidates to Gemini for analysis...`);
    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonString = response.text();

    const duration = Date.now() - startTime;
    console.log(`[AI] Gemini responded in ${duration}ms`);

    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonString) as AiMatchResponse;

    if (!parsed.matches || !Array.isArray(parsed.matches)) {
      throw new Error('Invalid AI response format');
    }

    console.log(`[AI] ✅ Successfully analyzed ${parsed.matches.length} candidates`);
    return parsed;

  } catch (error) {
    console.error('[AI] ❌ Error during AI analysis:', error);
    throw error;
  }
}

// ============================================================================
// 🆕 MAIN EXPORT FUNCTION - V2.5.1
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
    stats?: {
      totalInDb: number;
      sentToAi: number;
    };
  };
}> {
  // 🆕 שימוש ב-CONFIG.AI_MAX_CANDIDATES במקום הערך שמגיע מהפרונט!
  const {
    maxCandidatesToAnalyze = CONFIG.AI_MAX_CANDIDATES,
    forceRefresh = false,
    autoSave = true,
  } = options;

  // 🆕 אם הפרונט שלח ערך קטן מדי, נשתמש ב-CONFIG
  const effectiveMaxCandidates = Math.max(maxCandidatesToAnalyze, CONFIG.AI_MAX_CANDIDATES);

  logSection(`NeshamaTech Matching Algorithm V2.5.1`);
  console.log(`🎯 Target User: ${targetUserId}`);
  console.log(`👤 Matchmaker: ${matchmakerId}`);
  console.log(`⚙️ Options: forceRefresh=${forceRefresh}, autoSave=${autoSave}`);
  console.log(`📊 Config: DB_LIMIT=${CONFIG.DB_LIMIT}, AI_MAX=${effectiveMaxCandidates} (requested: ${maxCandidatesToAnalyze})`);

  // STEP 0: CHECK CACHE
  if (!forceRefresh) {
    logStep(0, "Checking for cached results");
    const savedResults = await loadSavedMatches(targetUserId);

    if (savedResults && savedResults.matches.length > 0) {
      console.log(`✅ Using cached results (${savedResults.matches.length} matches)`);
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
    console.log(`❌ No valid cache found, proceeding with new search`);
  }

  // STEP 1: GET TARGET USER DATA
  logStep(1, "Loading target user data");
  const targetUser = await getTargetUserData(targetUserId);
  if (!targetUser) {
    throw new Error('Target user not found or has no profile');
  }
  console.log(`✅ Target: ${targetUser.firstName} ${targetUser.lastName}`);
  logStats("Age", targetUser.age);
  logStats("Gender", targetUser.gender);
  logStats("Religious Level", targetUser.religiousLevel || 'Not specified');

  // STEP 2: DB FILTERING - GET ALL CANDIDATES
  const { candidates: allCandidates, totalFound } = await filterCandidatesFromDb(targetUser);

  if (allCandidates.length === 0) {
    console.log(`❌ No candidates found after DB filtering`);
    return {
      matches: [],
      fromCache: false,
      meta: { algorithmVersion: 'v2.5.1', stats: { totalInDb: 0, sentToAi: 0 } }
    };
  }

  console.log(`✅ Found ${allCandidates.length} candidates out of ${totalFound} total matching`);

  // STEP 3: SMART RANKING
  logStep(3, "Smart pre-ranking candidates");
  const rankedCandidates = smartRankCandidates(allCandidates);

  // STEP 4: SELECT TOP CANDIDATES FOR AI
  logStep(4, "Selecting candidates for AI analysis");
  const candidatesToAnalyze = rankedCandidates.slice(0, effectiveMaxCandidates);
  console.log(`📊 Selected ${candidatesToAnalyze.length} candidates for AI analysis (out of ${rankedCandidates.length} total)`);

  // 🆕 הצגת המועמדים שלא נבחרו
  if (rankedCandidates.length > effectiveMaxCandidates) {
    const notSelected = rankedCandidates.slice(effectiveMaxCandidates);
    console.log(`\n   ⚠️ ${notSelected.length} candidates NOT sent to AI:`);
    notSelected.forEach((c, i) => {
      console.log(`   - ${c.firstName} ${c.lastName} - ${c.age}, ${c.religiousLevel || 'N/A'} [AI: ${c.hasAiSummary ? '✅' : '❌'}]`);
    });
  }

  // הצגת המועמדים שנבחרו
  console.log(`\n   📋 Selected candidates for AI:`);
  candidatesToAnalyze.slice(0, 15).forEach((c, i) => {
    const aiIcon = c.hasAiSummary ? '✅' : '❌';
    console.log(`   ${i + 1}. ${c.firstName} ${c.lastName} - ${c.age}, ${c.religiousLevel || 'N/A'} [AI: ${aiIcon}]`);
  });
  if (candidatesToAnalyze.length > 15) {
    console.log(`   ... and ${candidatesToAnalyze.length - 15} more`);
  }

  // STEP 5: AI ANALYSIS
  logStep(5, "AI Deep Analysis");

  const { targetProfile, candidatesText } = await prepareDataForAi(targetUser, candidatesToAnalyze);
  const aiResponse = await analyzeMatchesWithAi(targetProfile, candidatesText, candidatesToAnalyze.length);

  // STEP 6: PROCESS RESULTS
  logStep(6, "Processing results");

  const results: MatchResult[] = aiResponse.matches
    .map((match): MatchResult | null => {
      const candidate = candidatesToAnalyze[match.candidateIndex - 1];
      if (!candidate) return null;

      return {
        userId: candidate.userId,
        score: Math.min(100, Math.max(0, match.score)),
        reasoning: match.reasoning,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
      };
    })
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => b.score - a.score);

  // STEP 7: SAVE RESULTS
  if (autoSave && results.length > 0) {
    logStep(7, "Saving results to cache");
    await saveMatchResults(targetUserId, matchmakerId, results, 'v2.5.1', totalFound);
  }

  // SUMMARY
  logSection("SEARCH COMPLETED");
  console.log(`\n📊 STATISTICS:`);
  logStats("Total matching in DB", totalFound);
  logStats("After DB filter", allCandidates.length);
  logStats("Sent to AI", candidatesToAnalyze.length);
  logStats("Final matches", results.length);

  console.log(`\n🏆 TOP 5 MATCHES:`);
  results.slice(0, 5).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.firstName} ${m.lastName} - Score: ${m.score}`);
  });

  return {
    matches: results,
    fromCache: false,
    meta: {
      algorithmVersion: 'v2.5.1',
      stats: {
        totalInDb: totalFound,
        sentToAi: candidatesToAnalyze.length,
      }
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
  CONFIG,
};

export default matchingAlgorithmService;