// ===========================================
// src/lib/services/vectorMatchingService.ts
// ===========================================
// 🚀 שירות חיפוש התאמות מבוסס Vector Similarity V1.2
// משתמש ב-pgvector לחיפוש מהיר של פרופילים דומים
// כולל ציון התאמת גיל מתקדם
// 🆕 V1.2: סינון סלחני - מכליל מועמדים עם שדות חסרים

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Gender, AvailabilityStatus } from "@prisma/client";
import { 
  createBackgroundProfile, 
  calculateBackgroundMatch,
  calculateAgeScoreForMatch,
} from "./matchingAlgorithmService";
import type { GeneratedVirtualProfile } from './aiService';

// ============================================================================
// TYPES
// ============================================================================

export interface VectorMatchResult {
  userId: string;
  firstName: string;
  lastName: string;
  profileId: string;
  similarity: number;
  age: number | null;  // 🆕 יכול להיות null
  religiousLevel: string | null;
  city: string | null;
  occupation: string | null;
  aiProfileSummary: any; 
  about: string | null;
  backgroundMatch: {
    compatibility: string;
    multiplier: number;
    bonusPoints: number;
  };
  // ציון התאמת גיל - יכול להיות null
  ageScore?: {
    score: number;
    description: string;
  } | null;
  // AI Analysis results
  finalScore?: number;
  reasoning?: string;
  rank?: number;
}

export interface VectorSearchOptions {
  forceRefresh?: boolean;
  autoSave?: boolean;
  limit?: number;
}

export interface VectorSearchResult {
  matches: VectorMatchResult[];
  fromCache: boolean;
  meta: {
    algorithmVersion: string;
    totalCandidatesScanned: number;
    savedAt?: Date;
    isStale: boolean;
    durationMs?: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ALGORITHM_VERSION = "vector-v1.2";
const STALE_DAYS = 7;
const VECTOR_SEARCH_LIMIT = 50;
const TOP_CANDIDATES_FOR_AI = 25;
const FINAL_RESULTS_COUNT = 15;

// Religious level ordering for filtering logic
const RELIGIOUS_LEVEL_ORDER = [
  'charedi_hasidic', 'charedi_litvish', 'charedi_general', 'charedi_lite',
  'torani_hardali', 'dati_leumi_plus', 'dati_leumi', 'dati_leumi_lite',
  'traditional_religious', 'traditional_lite', 'secular_traditional',
  'secular', 'secular_anti', 'other'
];

// ============================================================================
// GEMINI SETUP
// ============================================================================

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

export async function loadSavedVectorMatches(targetUserId: string): Promise<VectorSearchResult | null> {
  console.log(`[Vector Search] Loading saved matches for user: ${targetUserId}`);
  
  const saved = await prisma.savedVectorMatchSearch.findUnique({
    where: { targetUserId },
  });

  if (!saved) {
    console.log(`[Vector Search] No saved search found for user: ${targetUserId}`);
    return null;
  }

  const daysSinceSave = (Date.now() - saved.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const isStale = daysSinceSave > STALE_DAYS;

  console.log(`[Vector Search] Found saved search (${saved.candidatesCount} candidates, ${daysSinceSave.toFixed(1)} days old, stale: ${isStale})`);

  return {
    matches: saved.results as unknown as VectorMatchResult[],
    fromCache: true,
    meta: {
      algorithmVersion: saved.algorithmVersion,
      totalCandidatesScanned: saved.candidatesCount,
      savedAt: saved.updatedAt,
      isStale,
    },
  };
}

export async function saveVectorMatchResults(
  targetUserId: string,
  matchmakerId: string,
  matches: VectorMatchResult[],
  candidatesCount: number
): Promise<void> {
  console.log(`[Vector Search] Saving ${matches.length} matches for user: ${targetUserId}`);

  await prisma.savedVectorMatchSearch.upsert({
    where: { targetUserId },
    create: {
      targetUserId,
      matchmakerId,
      results: matches as any,
      algorithmVersion: ALGORITHM_VERSION,
      candidatesCount,
    },
    update: {
      matchmakerId,
      results: matches as any,
      algorithmVersion: ALGORITHM_VERSION,
      candidatesCount,
      updatedAt: new Date(),
    },
  });

  console.log(`[Vector Search] ✅ Saved matches successfully`);
}

export async function deleteSavedVectorMatches(targetUserId: string): Promise<void> {
  await prisma.savedVectorMatchSearch.deleteMany({
    where: { targetUserId },
  });
  console.log(`[Vector Search] Deleted saved matches for user: ${targetUserId}`);
}

// ============================================================================
// HELPER FUNCTIONS
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

function getReligiousLevelIndex(level: string | null): number {
  if (!level) return -1;
  return RELIGIOUS_LEVEL_ORDER.indexOf(level);
}

// 🆕 סינון רך - אם אין רמה דתית, מכליל
function isReligiousLevelCompatible(targetLevel: string | null, candidateLevel: string | null, range: number = 4): boolean {
  // אם אחד מהם חסר - מכליל (סינון רך)
  if (!targetLevel || !candidateLevel) return true;
  
  const targetIdx = getReligiousLevelIndex(targetLevel);
  const candidateIdx = getReligiousLevelIndex(candidateLevel);
  
  // If unknown level, allow match to be safe
  if (targetIdx === -1 || candidateIdx === -1) return true; 
  
  return Math.abs(targetIdx - candidateIdx) <= range;
}

// ============================================================================
// MAIN VECTOR SEARCH FUNCTION
// ============================================================================

export async function findMatchesWithVector(
  targetUserId: string,
  matchmakerId: string,
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult> {
  const startTime = Date.now();
  const { forceRefresh = false, autoSave = true, limit = FINAL_RESULTS_COUNT } = options;

  console.log(`\n========================================`);
  console.log(`[Vector Search V1.2] Starting for user: ${targetUserId}`);
  console.log(`[Vector Search V1.2] Options: forceRefresh=${forceRefresh}, autoSave=${autoSave}`);
  console.log(`========================================\n`);

  // Step 1: Check cache
  if (!forceRefresh) {
    const cached = await loadSavedVectorMatches(targetUserId);
    if (cached && !cached.meta.isStale) {
      console.log(`[Vector Search] Returning cached results (${cached.matches.length} matches)`);
      return {
        ...cached,
        meta: {
          ...cached.meta,
          durationMs: Date.now() - startTime
        }
      };
    }
  }

  // Step 2: Get target user data
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      profile: true,
    },
  });

  if (!targetUser || !targetUser.profile) {
    throw new Error(`Target user not found: ${targetUserId}`);
  }

  const targetProfile = targetUser.profile;
  const targetAge = calculateAge(targetProfile.birthDate);
  const targetGender = targetProfile.gender;
  const oppositeGender = targetGender === Gender.MALE ? Gender.FEMALE : Gender.MALE;

  console.log(`[Vector Search] Target: ${targetUser.firstName} ${targetUser.lastName}, Age: ${targetAge}, Gender: ${targetGender}`);

  // Create background profile for target
  const targetBackgroundProfile = createBackgroundProfile(
    targetProfile.nativeLanguage,
    targetProfile.additionalLanguages || [],
    targetProfile.aliyaCountry,
    targetProfile.aliyaYear,
    targetProfile.origin,
    targetProfile.about || "",
    targetProfile.matchingNotes
  );

  console.log(`[Vector Search] Target background: ${targetBackgroundProfile.category} (confidence: ${targetBackgroundProfile.confidence})`);

  // Step 3: Get target's vector
  const targetVectorResult = await prisma.$queryRaw<{ vector: string }[]>`
    SELECT vector::text as vector
    FROM profile_vectors pv
    JOIN "Profile" p ON p.id = pv."profileId"
    WHERE p."userId" = ${targetUserId}
    LIMIT 1
  `;

  if (!targetVectorResult || targetVectorResult.length === 0) {
    throw new Error(`No vector found for target user: ${targetUserId}. Please ensure profile embedding is generated.`);
  }

  // Step 4: 🆕 Vector similarity search with LENIENT filtering
  console.log(`[Vector Search V1.2] Running pgvector similarity search (LENIENT MODE)...`);
  const vectorSearchStart = Date.now();

  // 🆕 שאילתה עם סינון סלחני - מכלילים NULL ב-availabilityStatus ו-isProfileVisible
  const similarProfiles = await prisma.$queryRaw<{
    profileId: string;
    userId: string;
    similarity: number;
  }[]>`
  SELECT 
  pv."profileId",
  p."userId",
  1 - (pv.vector <=> (
    SELECT vector FROM profile_vectors pv2 
    JOIN "Profile" p2 ON p2.id = pv2."profileId" 
    WHERE p2."userId" = ${targetUserId}
  )) as similarity
FROM profile_vectors pv
JOIN "Profile" p ON p.id = pv."profileId"
JOIN "User" u ON u.id = p."userId"
WHERE p."userId" != ${targetUserId}
  AND p.gender = ${oppositeGender}::"Gender"
  AND (
    p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
    OR p."availabilityStatus" IS NULL
  )
  AND (
    p."isProfileVisible" = true
    OR p."isProfileVisible" IS NULL
  )
  AND (
    u.status = 'ACTIVE'::"UserStatus"
    OR (u.status = 'PENDING_EMAIL_VERIFICATION'::"UserStatus" AND u.source = 'MANUAL_ENTRY'::"UserSource")
  )
  AND (
    p.about IS NOT NULL AND p.about != ''
    OR p."manualEntryText" IS NOT NULL AND p."manualEntryText" != ''
  )
ORDER BY pv.vector <=> (
  SELECT vector FROM profile_vectors pv2 
  JOIN "Profile" p2 ON p2.id = pv2."profileId" 
  WHERE p2."userId" = ${targetUserId}
)
LIMIT ${VECTOR_SEARCH_LIMIT}
  `;

  console.log(`[Vector Search] Found ${similarProfiles.length} similar profiles in ${Date.now() - vectorSearchStart}ms`);

  // Step 5: Get full profile data for candidates
  const candidateUserIds = similarProfiles.map(p => p.userId);
  
  const candidates = await prisma.user.findMany({
    where: {
      id: { in: candidateUserIds },
    },
    include: {
      profile: true,
    },
  });

  // Step 6: 🆕 LENIENT Filter and enrich candidates
  console.log(`[Vector Search V1.2] Filtering and enriching candidates (LENIENT MODE)...`);
  
  const enrichedCandidates: VectorMatchResult[] = [];
  let filteredByAge = 0;
  let filteredByReligion = 0;
  let filteredByBackground = 0;
  let includedWithoutAge = 0;
  let includedWithoutReligiousLevel = 0;

  for (const candidate of candidates) {
    if (!candidate.profile) continue;

    const similarityData = similarProfiles.find(p => p.userId === candidate.id);
    
    // 🆕 בדיקת גיל - סינון רך
    let candidateAge: number | null = null;
    let ageScore: { score: number; description: string } | null = null;
    
    if (candidate.profile.birthDate) {
      candidateAge = calculateAge(candidate.profile.birthDate);
      const ageResult = calculateAgeScoreForMatch(targetAge, targetGender, candidateAge);
      
      // אם יש גיל והוא לא eligible - מעיפים
      if (!ageResult.eligible) {
        filteredByAge++;
        continue;
      }
      
      ageScore = {
        score: ageResult.score,
        description: ageResult.description,
      };
    } else {
      // 🆕 אין תאריך לידה - מכליל (סינון רך)
      includedWithoutAge++;
      console.log(`[Vector Search] Including ${candidate.firstName} ${candidate.lastName} - no birthDate (lenient)`);
    }

    // 🆕 Religious level filter - סינון רך
    if (candidate.profile.religiousLevel) {
      if (!isReligiousLevelCompatible(targetProfile.religiousLevel, candidate.profile.religiousLevel)) {
        filteredByReligion++;
        continue;
      }
    } else {
      // אין רמה דתית - מכליל
      includedWithoutReligiousLevel++;
    }

    // Calculate background match
    const candidateBackgroundProfile = createBackgroundProfile(
      candidate.profile.nativeLanguage,
      candidate.profile.additionalLanguages || [],
      candidate.profile.aliyaCountry,
      candidate.profile.aliyaYear,
      candidate.profile.origin,
      candidate.profile.about || "",
      candidate.profile.matchingNotes
    );

    const backgroundMatch = calculateBackgroundMatch(targetBackgroundProfile, candidateBackgroundProfile);

    // Skip if background is problematic or not recommended (strict filtering for vector search)
    if (backgroundMatch.compatibility === 'not_recommended' || backgroundMatch.compatibility === 'problematic') {
      filteredByBackground++;
      continue;
    }

    enrichedCandidates.push({
      userId: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      profileId: candidate.profile.id,
      similarity: similarityData?.similarity || 0,
      age: candidateAge,
      religiousLevel: candidate.profile.religiousLevel,
      city: candidate.profile.city,
      occupation: candidate.profile.occupation,
      aiProfileSummary: candidate.profile.aiProfileSummary,
      about: candidate.profile.about,
      backgroundMatch: {
        compatibility: backgroundMatch.compatibility,
        multiplier: backgroundMatch.multiplier,
        bonusPoints: backgroundMatch.bonusPoints,
      },
      ageScore,
    });
  }

  // Sort by similarity descending
  enrichedCandidates.sort((a, b) => b.similarity - a.similarity);

  console.log(`[Vector Search V1.2] Filtering summary:`);
  console.log(`  - Filtered by age (known & out of range): ${filteredByAge}`);
  console.log(`  - Filtered by religion: ${filteredByReligion}`);
  console.log(`  - Filtered by background: ${filteredByBackground}`);
  console.log(`  - Included without birthDate (lenient): ${includedWithoutAge}`);
  console.log(`  - Included without religiousLevel (lenient): ${includedWithoutReligiousLevel}`);
  console.log(`  - Remaining candidates: ${enrichedCandidates.length}`);
  
  if (enrichedCandidates.length > 0) {
    console.log(`[Vector Search] Top 3 by similarity:`);
    enrichedCandidates.slice(0, 3).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.firstName} ${c.lastName} - Similarity: ${(c.similarity * 100).toFixed(1)}%, Age Score: ${c.ageScore?.score ?? 'N/A'}`);
    });
  }

  // Step 7: AI Ranking (single call for top candidates)
  const topCandidates = enrichedCandidates.slice(0, TOP_CANDIDATES_FOR_AI);
  
  if (topCandidates.length === 0) {
    console.log(`[Vector Search] No candidates to analyze after filtering`);
    return {
      matches: [],
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION,
        totalCandidatesScanned: similarProfiles.length,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };
  }

  console.log(`[Vector Search] Sending ${topCandidates.length} candidates to AI for ranking...`);
  const aiStart = Date.now();

  const targetSummary = targetProfile.aiProfileSummary 
    ? JSON.stringify(targetProfile.aiProfileSummary) 
    : targetProfile.about || "לא זמין";

  const candidatesText = topCandidates.map((c, idx) => {
    const summary = c.aiProfileSummary 
      ? JSON.stringify(c.aiProfileSummary) 
      : c.about || "לא זמין";
    
    // 🆕 טיפול במידע חסר
    const ageInfo = c.ageScore 
      ? `התאמת גיל: ${c.ageScore.score}/100 (${c.ageScore.description})`
      : 'גיל: לא ידוע - יש להעריך לפי התוכן';
    
    return `
מועמד ${idx + 1} (ID: ${c.userId}):
- שם: ${c.firstName} ${c.lastName}
- גיל: ${c.age ?? 'לא ידוע'}
- ${ageInfo}
- רמה דתית: ${c.religiousLevel || 'לא צוין'}
- עיר: ${c.city || 'לא צוין'}
- עיסוק: ${c.occupation || 'לא צוין'}
- התאמת רקע: ${c.backgroundMatch.compatibility}
- דמיון וקטורי: ${(c.similarity * 100).toFixed(1)}%
- סיכום פרופיל: ${summary}
`;
  }).join('\n---\n');

  const prompt = `
אתה שדכן מקצועי בקהילה הדתית-לאומית בישראל.

## מטרת המשתמש (מי שמחפש זוג):
- שם: ${targetUser.firstName} ${targetUser.lastName}
- גיל: ${targetAge}
- מין: ${targetGender === 'MALE' ? 'גבר' : 'אישה'}
- רמה דתית: ${targetProfile.religiousLevel || 'לא צוין'}
- סיכום פרופיל: ${targetSummary}

## המועמדים לדירוג:
${candidatesText}

## משימה:
דרג את המועמדים מ-1 (הכי מתאים) עד ${topCandidates.length}.
לכל מועמד תן:
1. ציון התאמה (0-100)
2. נימוק קצר (2-3 משפטים) למה הם מתאימים או לא

## הנחיות חשובות:
- אם יש ציון התאמת גיל - השתמש בו
- אם הגיל לא ידוע - תן ציון על בסיס מה שכתוב בסיכום ואל תוריד ציון רק בגלל מידע חסר
- פער גיל כשהבת גדולה יותר (במיוחד ב-2+ שנים) הוא פחות מקובל בקהילה הדתית
- התאמת רקע ושפה משותפת הן יתרונות משמעותיים

החזר JSON בפורמט הבא בלבד (ללא markdown או טקסט נוסף):
{
  "rankings": [
    {
      "userId": "...",
      "rank": 1,
      "score": 95,
      "reasoning": "..."
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse JSON from response
    let cleanJson = responseText;
    if (responseText.includes("```json")) {
        cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    } else if (responseText.includes("```")) {
        cleanJson = responseText.replace(/```\n?|```/g, "").trim();
    }

    const aiResults = JSON.parse(cleanJson);
    
    console.log(`[Vector Search] AI ranking completed in ${Date.now() - aiStart}ms`);

    // Merge AI results with candidates
    const rankedCandidates: VectorMatchResult[] = [];
    
    if (aiResults && Array.isArray(aiResults.rankings)) {
        for (const ranking of aiResults.rankings) {
          const candidate = topCandidates.find(c => c.userId === ranking.userId);
          if (candidate) {
            rankedCandidates.push({
              ...candidate,
              finalScore: ranking.score,
              reasoning: ranking.reasoning,
              rank: ranking.rank,
            });
          }
        }
    } else {
        throw new Error("Invalid JSON structure from AI response");
    }

    // Sort by rank
    rankedCandidates.sort((a, b) => (a.rank || 999) - (b.rank || 999));

    // Take top results
    const finalMatches = rankedCandidates.slice(0, limit);

    console.log(`\n[Vector Search V1.2] ✅ Completed! Found ${finalMatches.length} matches`);
    console.log(`[Vector Search V1.2] Final Top 3:`);
    finalMatches.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Score: ${m.finalScore}, Similarity: ${(m.similarity * 100).toFixed(1)}%, Age: ${m.ageScore?.score ?? 'N/A'}`);
    });

    // Save results
    if (autoSave) {
      await saveVectorMatchResults(targetUserId, matchmakerId, finalMatches, similarProfiles.length);
    }

    return {
      matches: finalMatches,
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION,
        totalCandidatesScanned: similarProfiles.length,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };

  } catch (error) {
    console.error(`[Vector Search] AI ranking error:`, error);
    
    // Fallback: return candidates sorted by similarity without AI ranking if AI fails
    console.log(`[Vector Search] Returning fallback results based on vector similarity.`);
    const fallbackMatches = topCandidates.slice(0, limit).map((c, idx) => ({
      ...c,
      finalScore: Math.round(c.similarity * 100),
      reasoning: "דירוג לפי דמיון פרופיל (ללא ניתוח AI עקב שגיאה טכנית)",
      rank: idx + 1,
    }));

    if (autoSave) {
      await saveVectorMatchResults(targetUserId, matchmakerId, fallbackMatches, similarProfiles.length);
    }

    return {
      matches: fallbackMatches,
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION + "-fallback",
        totalCandidatesScanned: similarProfiles.length,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * מוצא התאמות עבור פרופיל וירטואלי באמצעות חיפוש וקטורי.
 * משתמש בוקטור שנוצר מהפרופיל הוירטואלי לחיפוש דמיון.
 */
export async function findMatchesForVirtualUserVector(
  virtualProfileId: string,
  generatedProfile: GeneratedVirtualProfile,
  gender: Gender,
  religiousLevel: string,
  matchmakerId: string,
  editedSummary?: string | null,
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult> {
  const startTime = Date.now();
  const { limit = FINAL_RESULTS_COUNT } = options;

  console.log(`\n========================================`);
  console.log(`[Vector Search V1.2 - Virtual] Starting for virtual profile: ${virtualProfileId}`);
  console.log(`[Vector Search V1.2 - Virtual] Gender: ${gender}, Religious: ${religiousLevel}`);
  console.log(`========================================\n`);

  // 1. יצירת טקסט לחיפוש וקטורי
  const searchText = editedSummary?.trim() || `
    ${generatedProfile.personalitySummary}
    ${generatedProfile.lookingForSummary}
    תכונות: ${generatedProfile.keyTraits?.join(', ') || ''}
    מחפש: ${generatedProfile.idealPartnerTraits?.join(', ') || ''}
  `.trim();

  // 2. שליפת הוקטור מה-DB או יצירה חדשה
  let searchVector: number[] | null = null;
  
  try {
    const existingVector = await prisma.$queryRaw<{ vector: string }[]>`
      SELECT vector::text
      FROM "VirtualProfile"
      WHERE id = ${virtualProfileId}
      AND vector IS NOT NULL
    `;
    
    if (existingVector.length > 0 && existingVector[0].vector) {
      const vectorString = existingVector[0].vector;
      searchVector = vectorString.replace(/^\[|\]$/g, '').split(',').map(Number);
    }
  } catch (e) {
    console.log(`[Vector Search - Virtual] No existing vector found, generating new one`);
  } 

  // אם אין וקטור, ניצור חדש
  if (!searchVector) {
    const embedding = await genAI.getGenerativeModel({ model: 'gemini-embedding-001' })
      .embedContent(searchText);
    searchVector = embedding.embedding?.values || null;
  }

  if (!searchVector || searchVector.length !== 768) {
    console.error(`[Vector Search - Virtual] Failed to get/generate vector`);
    return {
      matches: [],
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION + "-virtual",
        totalCandidatesScanned: 0,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };
  }

  // 3. מגדר הפוך לחיפוש
  const oppositeGender = gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;

  // 4. 🆕 חיפוש וקטורי בDB עם סינון סלחני
  const vectorSqlString = `[${searchVector.join(',')}]`;
  
  const similarProfiles = await prisma.$queryRaw<
    Array<{ userId: string; similarity: number }>
  >`
    SELECT 
      p."userId",
      1 - (pv.vector <=> ${vectorSqlString}::vector) AS similarity
    FROM "profile_vectors" pv
    JOIN "Profile" p ON pv."profileId" = p.id
    JOIN "User" u ON p."userId" = u.id
    WHERE p.gender = ${oppositeGender}::"Gender"
      AND (
        p."isProfileVisible" = true
        OR p."isProfileVisible" IS NULL
      )
      AND (
        p."availabilityStatus" IN ('AVAILABLE', 'PAUSED')
        OR p."availabilityStatus" IS NULL
      )
      AND u.status NOT IN ('BLOCKED', 'INACTIVE')
      AND pv.vector IS NOT NULL
      AND (
        p.about IS NOT NULL AND p.about != ''
        OR p."manualEntryText" IS NOT NULL AND p."manualEntryText" != ''
      )
    ORDER BY pv.vector <=> ${vectorSqlString}::vector
    LIMIT ${VECTOR_SEARCH_LIMIT}
  `;

  console.log(`[Vector Search V1.2 - Virtual] Found ${similarProfiles.length} similar profiles`);

  if (similarProfiles.length === 0) {
    return {
      matches: [],
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION + "-virtual",
        totalCandidatesScanned: 0,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };
  }

  // 5. שליפת פרטי המועמדים
  const candidateIds = similarProfiles.map(p => p.userId);
  const candidateUsers = await prisma.user.findMany({
    where: { id: { in: candidateIds } },
    include: {
      profile: true,
      images: {
        where: { isMain: true },
        take: 1,
      },
    },
  });

  // 6. 🆕 העשרת התוצאות עם סינון סלחני
  const virtualAge = generatedProfile.inferredAge;
  const enrichedCandidates: VectorMatchResult[] = [];
  let includedWithoutAge = 0;

  for (const candidate of candidateUsers) {
    if (!candidate.profile) continue;

    const similarityData = similarProfiles.find(p => p.userId === candidate.id);
    
    // 🆕 חישוב גיל - סינון רך
    let candidateAge: number | null = null;
    let ageScore: { score: number; description: string } | null = null;
    
    if (candidate.profile.birthDate) {
      candidateAge = calculateAge(candidate.profile.birthDate);
      
      // סינון בסיסי לפי גיל
      const ageDiff = candidateAge - virtualAge;
      const isAgeOk = gender === Gender.MALE 
        ? (ageDiff >= -7 && ageDiff <= 3)
        : (ageDiff >= -3 && ageDiff <= 7);

      if (!isAgeOk) continue;

      // ציון התאמת גיל
      const ageResult = calculateAgeScoreForMatch(
        virtualAge,
        gender,
        candidateAge
      );
      
      ageScore = {
        score: ageResult.score,
        description: ageResult.description,
      };
    } else {
      // 🆕 אין תאריך לידה - מכליל
      includedWithoutAge++;
    }

    // 🆕 סינון לפי רמה דתית - רך
    if (!isReligiousLevelCompatible(religiousLevel, candidate.profile.religiousLevel)) {
      continue;
    }

    enrichedCandidates.push({
      userId: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      profileId: candidate.profile.id,
      similarity: similarityData?.similarity || 0,
      age: candidateAge,
      religiousLevel: candidate.profile.religiousLevel,
      city: candidate.profile.city,
      occupation: candidate.profile.occupation,
      aiProfileSummary: candidate.profile.aiProfileSummary,
      about: candidate.profile.about,
      backgroundMatch: {
        compatibility: 'possible',
        multiplier: 1,
        bonusPoints: 0,
      },
      ageScore,
    });
  }

  // מיון לפי דמיון
  enrichedCandidates.sort((a, b) => b.similarity - a.similarity);

  console.log(`[Vector Search V1.2 - Virtual] ${enrichedCandidates.length} candidates after filtering`);
  console.log(`  - Included without birthDate (lenient): ${includedWithoutAge}`);

  if (enrichedCandidates.length === 0) {
    return {
      matches: [],
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION + "-virtual",
        totalCandidatesScanned: similarProfiles.length,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };
  }

  // 7. AI Ranking
  const topCandidates = enrichedCandidates.slice(0, TOP_CANDIDATES_FOR_AI);
  
  console.log(`[Vector Search V1.2 - Virtual] Sending ${topCandidates.length} candidates to AI...`);

  const virtualSummary = editedSummary?.trim() || generatedProfile.displaySummary;

  const candidatesText = topCandidates.map((c, idx) => {
    const summary = c.aiProfileSummary 
      ? JSON.stringify(c.aiProfileSummary) 
      : c.about || "לא זמין";
    
    const ageInfo = c.ageScore 
      ? `התאמת גיל: ${c.ageScore.score}/100 (${c.ageScore.description})`
      : 'גיל: לא ידוע - יש להעריך לפי התוכן';
    
    return `
מועמד ${idx + 1} (ID: ${c.userId}):
- שם: ${c.firstName} ${c.lastName}
- גיל: ${c.age ?? 'לא ידוע'}
- ${ageInfo}
- רמה דתית: ${c.religiousLevel || 'לא צוין'}
- עיר: ${c.city || 'לא צוין'}
- עיסוק: ${c.occupation || 'לא צוין'}
- דמיון וקטורי: ${(c.similarity * 100).toFixed(1)}%
- סיכום פרופיל: ${summary}
`;
  }).join('\n---\n');

  const prompt = `
אתה שדכן מקצועי בקהילה הדתית-לאומית בישראל.

## מטרת החיפוש (פרופיל וירטואלי):
- מגדר: ${gender === 'MALE' ? 'גבר' : 'אישה'}
- גיל משוער: ${virtualAge}
- רמה דתית: ${religiousLevel}
- סיכום: ${virtualSummary}

## המועמדים לדירוג:
${candidatesText}

## משימה:
דרג את המועמדים מ-1 (הכי מתאים) עד ${topCandidates.length}.
לכל מועמד תן:
1. ציון התאמה (0-100)
2. נימוק קצר (2-3 משפטים)

## הנחיות:
- זהו פרופיל וירטואלי - התייחס לנתונים כאומדן
- אם יש ציון התאמת גיל - השתמש בו
- אם הגיל לא ידוע - תן ציון על בסיס הסיכום ואל תוריד ציון בגלל מידע חסר
- העדף מועמדים עם דמיון וקטורי גבוה

החזר JSON בפורמט:
{
  "rankings": [
    { "userId": "...", "rank": 1, "score": 95, "reasoning": "..." }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    let cleanJson = responseText;
    if (responseText.includes("```json")) {
      cleanJson = responseText.replace(/```json\n?|```/g, "").trim();
    } else if (responseText.includes("```")) {
      cleanJson = responseText.replace(/```\n?|```/g, "").trim();
    }

    const aiResults = JSON.parse(cleanJson);
    
    // מיזוג תוצאות
    const rankedCandidates: VectorMatchResult[] = [];
    
    if (aiResults && Array.isArray(aiResults.rankings)) {
      for (const ranking of aiResults.rankings) {
        const candidate = topCandidates.find(c => c.userId === ranking.userId);
        if (candidate) {
          rankedCandidates.push({
            ...candidate,
            finalScore: ranking.score,
            reasoning: ranking.reasoning,
            rank: ranking.rank,
          });
        }
      }
    }

    rankedCandidates.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    const finalMatches = rankedCandidates.slice(0, limit);

    console.log(`\n[Vector Search V1.2 - Virtual] ✅ Completed! Found ${finalMatches.length} matches`);

    return {
      matches: finalMatches,
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION + "-virtual",
        totalCandidatesScanned: similarProfiles.length,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };

  } catch (error) {
    console.error(`[Vector Search - Virtual] AI ranking error:`, error);
    
    // Fallback
    const fallbackMatches = topCandidates.slice(0, limit).map((c, idx) => ({
      ...c,
      finalScore: Math.round(c.similarity * 100),
      reasoning: "דירוג לפי דמיון פרופיל",
      rank: idx + 1,
    }));

    return {
      matches: fallbackMatches,
      fromCache: false,
      meta: {
        algorithmVersion: ALGORITHM_VERSION + "-virtual-fallback",
        totalCandidatesScanned: similarProfiles.length,
        isStale: false,
        durationMs: Date.now() - startTime,
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

const vectorMatchingService = {
  findMatchesWithVector,
  findMatchesForVirtualUserVector,
  loadSavedVectorMatches,
  saveVectorMatchResults,
  deleteSavedVectorMatches,
};

export default vectorMatchingService;