// ===========================================
// src/lib/services/vectorMatchingService.ts
// ===========================================
// 🚀 שירות חיפוש התאמות מבוסס Vector Similarity V1.1
// משתמש ב-pgvector לחיפוש מהיר של פרופילים דומים
// כולל ציון התאמת גיל מתקדם

import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Gender, AvailabilityStatus } from "@prisma/client";
import { 
  createBackgroundProfile, 
  calculateBackgroundMatch,
  calculateAgeScoreForMatch,  // 🆕
} from "./matchingAlgorithmService";

// ============================================================================
// TYPES
// ============================================================================

export interface VectorMatchResult {
  userId: string;
  firstName: string;
  lastName: string;
  profileId: string;
  similarity: number;
  age: number;
  religiousLevel: string | null;
  city: string | null;
  occupation: string | null;
  // שימוש ב-any או טיפוס גמיש כדי למנוע שגיאות המרה מ-Prisma Json
  aiProfileSummary: any; 
  about: string | null;
  backgroundMatch: {
    compatibility: string;
    multiplier: number;
    bonusPoints: number;
  };
  // 🆕 ציון התאמת גיל
  ageScore?: {
    score: number;
    description: string;
  };
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

const ALGORITHM_VERSION = "vector-v1.1";
const STALE_DAYS = 7;
const VECTOR_SEARCH_LIMIT = 50; // כמה תוצאות לשלוף מה-vector search הראשוני
const TOP_CANDIDATES_FOR_AI = 25; // כמה לשלוח ל-AI לדירוג סופי
const FINAL_RESULTS_COUNT = 15; // כמה תוצאות להחזיר למשתמש

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

function isReligiousLevelCompatible(targetLevel: string | null, candidateLevel: string | null, range: number = 4): boolean {
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
  console.log(`[Vector Search V1.1] Starting for user: ${targetUserId}`);
  console.log(`[Vector Search V1.1] Options: forceRefresh=${forceRefresh}, autoSave=${autoSave}`);
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

  // Create background profile for target (using imported function)
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

  // Step 4: Vector similarity search (Cosine Similarity)
  console.log(`[Vector Search] Running pgvector similarity search...`);
  const vectorSearchStart = Date.now();

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
      AND p."availabilityStatus" = 'AVAILABLE'::"AvailabilityStatus"
      AND p."isProfileVisible" = true
      AND u.status = 'ACTIVE'::"UserStatus"
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

  // Step 6: Filter and enrich candidates
  console.log(`[Vector Search] Filtering and enriching candidates...`);
  
  const enrichedCandidates: VectorMatchResult[] = [];
  let filteredByAge = 0;
  let filteredByReligion = 0;
  let filteredByBackground = 0;

  for (const candidate of candidates) {
    if (!candidate.profile) continue;

    const candidateAge = calculateAge(candidate.profile.birthDate);
    const similarityData = similarProfiles.find(p => p.userId === candidate.id);
    
    // 🆕 Age compatibility score and filter (replaces simple ±7 filter)
    const ageScore = calculateAgeScoreForMatch(targetAge, targetGender, candidateAge);
    if (!ageScore.eligible) {
      filteredByAge++;
      continue;
    }

    // Religious level filter
    if (!isReligiousLevelCompatible(targetProfile.religiousLevel, candidate.profile.religiousLevel)) {
      filteredByReligion++;
      continue;
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
      // 🆕 ציון גיל
      ageScore: {
        score: ageScore.score,
        description: ageScore.description,
      },
    });
  }

  // Sort by similarity descending
  enrichedCandidates.sort((a, b) => b.similarity - a.similarity);

  console.log(`[Vector Search] Filtering summary:`);
  console.log(`  - Filtered by age: ${filteredByAge}`);
  console.log(`  - Filtered by religion: ${filteredByReligion}`);
  console.log(`  - Filtered by background: ${filteredByBackground}`);
  console.log(`  - Remaining candidates: ${enrichedCandidates.length}`);
  
  if (enrichedCandidates.length > 0) {
    console.log(`[Vector Search] Top 3 by similarity:`);
    enrichedCandidates.slice(0, 3).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.firstName} ${c.lastName} - Similarity: ${(c.similarity * 100).toFixed(1)}%, Age Score: ${c.ageScore?.score}`);
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
    return `
מועמד ${idx + 1} (ID: ${c.userId}):
- שם: ${c.firstName} ${c.lastName}
- גיל: ${c.age}
- התאמת גיל: ${c.ageScore?.score || 'N/A'}/100 (${c.ageScore?.description || ''})
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
- שים לב לציון התאמת הגיל - ציון 100 הוא אידיאלי, ציון נמוך מ-70 דורש התייחסות
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

    console.log(`\n[Vector Search V1.1] ✅ Completed! Found ${finalMatches.length} matches`);
    console.log(`[Vector Search V1.1] Final Top 3:`);
    finalMatches.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.firstName} ${m.lastName} - Score: ${m.finalScore}, Similarity: ${(m.similarity * 100).toFixed(1)}%, Age: ${m.ageScore?.score}`);
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

// ============================================================================
// EXPORTS
// ============================================================================

const vectorMatchingService = {
  findMatchesWithVector,
  loadSavedVectorMatches,
  saveVectorMatchResults,
  deleteSavedVectorMatches,
};

export default vectorMatchingService;