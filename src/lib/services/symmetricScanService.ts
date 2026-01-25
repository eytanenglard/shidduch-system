// =============================================================================
// 📁 src/lib/services/symmetricScanService.ts
// =============================================================================
// 🎯 Symmetric Scan Service V3.1 - NeshamaTech
// 
// סריקה דו-כיוונית (סימטרית) עם Tiered Matching
// 
// ✅ שיפורים בגרסה זו (V3.1):
// - Batch Vector Cache Fetching (מניעת קריסת DB)
// - Real-time Saving (שמירת תוצאות תוך כדי ריצה)
// - Progress Tracking בזמן אמת
// - סריקה אינקרמנטלית (Delta Scan)
// =============================================================================

import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus, UserStatus, Prisma } from "@prisma/client";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { updateUserAiProfile } from '@/lib/services/profileAiService';
import { 
  calculateAge,
  calculateAgeScore,
  areReligiousLevelsCompatible,
  createBackgroundProfile,
  calculateBackgroundMatch,
  BLOCKING_SUGGESTION_STATUSES,
  BLOCKING_POTENTIAL_MATCH_STATUSES,
} from "./matchingAlgorithmService";

// =============================================================================
// TYPES
// =============================================================================

export interface ScanCandidate {
  userId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number | null;
  religiousLevel: string | null;
  city: string | null;
  occupation: string | null;
  profileUpdatedAt: Date;
  
  // Background
  backgroundProfile?: any;
  
  // Scores
  vectorSimilarity?: number;
  ageScore?: number;
  backgroundScore?: number;
  softScore?: number;
  
  // AI Results
  aiScore?: number;
  scoreForSource?: number;
  scoreForCandidate?: number;
  reasoning?: string;
}

export interface ScanPair {
  maleUserId: string;
  femaleUserId: string;
  maleAge: number;
  femaleAge: number;
  
  // Tier results
  passedQuickFilter: boolean;
  passedVectorFilter: boolean;
  passedSoftScoring: boolean;
  
  // Scores
  vectorSimilarity?: number;
  ageScore?: number;
  backgroundMultiplier?: number;
  softScore?: number;
  aiScore?: number;
  
  // Final
  finalScore?: number;
  scoreForMale?: number;
  scoreForFemale?: number;
  reasoning?: string;
  
  // Rejection reason if filtered
  rejectionReason?: string;
}

// Progress callback type
export interface ScanProgress {
  phase: 'initializing' | 'loading_users' | 'quick_filter' | 'vector_filter' | 'soft_scoring' | 'ai_analysis' | 'saving' | 'completed' | 'failed';
  currentUserIndex: number;
  totalUsers: number;
  currentUserName?: string;
  progressPercent: number;
  stats: {
    pairsEvaluated: number;
    pairsPassedQuickFilter: number;
    pairsPassedVectorFilter: number;
    pairsSentToAi: number;
    matchesFoundSoFar: number;
  };
  message: string;
}

export type ProgressCallback = (progress: ScanProgress) => void | Promise<void>;

export interface SymmetricScanOptions {
  forceRefresh?: boolean;           // לסרוק גם זוגות שלא השתנו
  usersToScan?: string[];           // רשימת משתמשים ספציפיים לסריקה
  maxPairsPerUser?: number;         // מקסימום זוגות לכל משתמש
  minAiScore?: number;              // סף מינימלי לציון AI
  skipVectorTier?: boolean;         // לדלג על Vector (לבדיקות)
  batchSize?: number;               // גודל batch ל-AI
  parallelBatchSize?: number;       // כמה משתמשים לעבד במקביל
  useVectorCache?: boolean;         // האם להשתמש ב-cache
  incrementalOnly?: boolean;        // רק משתמשים שהשתנו
  onProgress?: ProgressCallback;    // callback להתקדמות
  scanSessionId?: string;           // ID של session קיים (לעדכון)
}

export interface SymmetricScanResult {
  success: boolean;
  scanSessionId: string;
  
  // Stats
  stats: {
    usersScanned: number;
    malesScanned: number;
    femalesScanned: number;
    pairsEvaluated: number;
    
    // Filter stats
    pairsPassedQuickFilter: number;
    pairsPassedVectorFilter: number;
    pairsPassedSoftScoring: number;
    pairsSentToAi: number;
    
    // Results
    matchesFound: number;
    newMatches: number;
    updatedMatches: number;
    
    // Performance
    durationMs: number;
    aiCallsCount: number;
    
    // Cache stats
    vectorCacheHits?: number;
    vectorCacheMisses?: number;
  };
  
  // Top results preview
  topMatches: Array<{
    maleUserId: string;
    maleName: string;
    femaleUserId: string;
    femaleName: string;
    finalScore: number;
  }>;
  
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_OPTIONS: Required<Omit<SymmetricScanOptions, 'onProgress' | 'scanSessionId'>> = {
  forceRefresh: false,
  usersToScan: [],
  maxPairsPerUser: 50,
  minAiScore: 70,
  skipVectorTier: false,
  batchSize: 25,           
  parallelBatchSize: 5,    
  useVectorCache: true,    
  incrementalOnly: false,  
};

// Tier 1 thresholds
const QUICK_FILTER = {
  MAX_AGE_GAP_MALE_OLDER: 12,
  MAX_AGE_GAP_FEMALE_OLDER: 6,
  RELIGIOUS_LEVEL_RANGE: 4,
};

// Tier 2 thresholds
const VECTOR_FILTER = {
  MIN_SIMILARITY: 0.25,
  TOP_CANDIDATES: 50,
};

// Tier 3 thresholds
const SOFT_SCORING = {
  TOP_FOR_AI: 30,
  MIN_SCORE: 40,
};

// Tier 4
const AI_SCORING = {
  MIN_SCORE: 70,
  BATCH_SIZE: 25,  
};

// Vector Cache settings
const VECTOR_CACHE = {
  BATCH_SIZE: 100,  // כמה זוגות לשמור בבת אחת
};

// =============================================================================
// GEMINI SETUP
// =============================================================================

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.3,
  }
});

// =============================================================================
// VECTOR CACHE FUNCTIONS
// =============================================================================

/**
 * שומר ערך cache לזוג פרופילים
 */
async function saveVectorSimilarityToCache(
  profileId1: string,
  profileId2: string,
  similarity: number
): Promise<void> {
  const [id1, id2] = [profileId1, profileId2].sort();
  
  try {
    await prisma.$executeRaw`
      INSERT INTO "VectorSimilarityCache" (id, "profileId1", "profileId2", similarity, "calculatedAt")
      VALUES (${`${id1}_${id2}`}, ${id1}, ${id2}, ${similarity}, NOW())
      ON CONFLICT ("profileId1", "profileId2")
      DO UPDATE SET similarity = EXCLUDED.similarity, "calculatedAt" = NOW()
    `;
  } catch (error) {
    console.warn('[VectorCache] Could not save to cache:', error);
  }
}

/**
 * שומר batch של ערכי cache
 */
async function saveVectorSimilaritiesBatch(
  similarities: Array<{ profileId1: string; profileId2: string; similarity: number }>
): Promise<void> {
  if (similarities.length === 0) return;
  
  try {
    // נרמול וייצור values
    const values = similarities.map(s => {
      const [id1, id2] = [s.profileId1, s.profileId2].sort();
      return `('${id1}_${id2}', '${id1}', '${id2}', ${s.similarity}, NOW())`;
    }).join(',\n');
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "VectorSimilarityCache" (id, "profileId1", "profileId2", similarity, "calculatedAt")
      VALUES ${values}
      ON CONFLICT ("profileId1", "profileId2")
      DO UPDATE SET similarity = EXCLUDED.similarity, "calculatedAt" = NOW()
    `);
  } catch (error) {
    console.warn('[VectorCache] Could not save batch to cache:', error);
  }
}

// =============================================================================
// INCREMENTAL SCAN HELPERS
// =============================================================================

/**
 * מוצא משתמשים שהפרופיל שלהם השתנה מאז הסריקה האחרונה
 */
async function getChangedUsersSinceLastScan(): Promise<string[]> {
  const lastScan = await prisma.scanSession.findFirst({
    where: { status: 'completed' },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true }
  });
  
  if (!lastScan?.completedAt) {
    return [];
  }
  
  const changedUsers = await prisma.user.findMany({
    where: {
      status: { in: [UserStatus.ACTIVE, UserStatus.PENDING_PHONE_VERIFICATION] },
      profile: {
        availabilityStatus: { in: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.PAUSED] },
        updatedAt: { gt: lastScan.completedAt }
      }
    },
    select: { id: true }
  });
  
  console.log(`[SymmetricScan] 🔄 Found ${changedUsers.length} users changed since last scan`);
  
  return changedUsers.map(u => u.id);
}

// =============================================================================
// PROGRESS UPDATE HELPER
// =============================================================================

async function updateProgress(
  scanSessionId: string | null,
  progress: ScanProgress,
  callback?: ProgressCallback
): Promise<void> {
  if (callback) {
    try {
      await callback(progress);
    } catch (error) {
      console.warn('[SymmetricScan] Progress callback error:', error);
    }
  }
  
  if (scanSessionId) {
    try {
      await prisma.scanSession.update({
        where: { id: scanSessionId },
        data: {
          pairsEvaluated: progress.stats.pairsEvaluated,
          matchesFound: progress.stats.matchesFoundSoFar,
        }
      });
    } catch (error) {
      // Ignore update errors
    }
  }
}

// =============================================================================
// MAIN SCAN FUNCTION - V3.1
// =============================================================================

export async function runSymmetricScan(
  options: SymmetricScanOptions = {}
): Promise<SymmetricScanResult> {
  const opts = { 
    ...DEFAULT_OPTIONS, 
    ...options,
    onProgress: options.onProgress,
    scanSessionId: options.scanSessionId,
  };
  
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[SymmetricScan] 🔄 Starting Symmetric Tiered Scan V3.1`);
  console.log(`[SymmetricScan] Options: forceRefresh=${opts.forceRefresh}, incremental=${opts.incrementalOnly}, useCache=${opts.useVectorCache}`);
  console.log(`${'='.repeat(70)}\n`);

  let scanSessionId = opts.scanSessionId;
  
  if (!scanSessionId) {
    const scanSession = await prisma.scanSession.create({
      data: {
        scanType: opts.usersToScan?.length ? 'manual' : opts.incrementalOnly ? 'incremental' : 'nightly',
        status: 'running',
      },
    });
    scanSessionId = scanSession.id;
  }

  const stats = {
    usersScanned: 0,
    malesScanned: 0,
    femalesScanned: 0,
    pairsEvaluated: 0,
    pairsPassedQuickFilter: 0,
    pairsPassedVectorFilter: 0,
    pairsPassedSoftScoring: 0,
    pairsSentToAi: 0,
    matchesFound: 0,
    newMatches: 0,
    updatedMatches: 0,
    durationMs: 0,
    aiCallsCount: 0,
    vectorCacheHits: 0,
    vectorCacheMisses: 0,
  };

  const topMatches: SymmetricScanResult['topMatches'] = [];

  const sendProgress = async (phase: ScanProgress['phase'], userIndex: number, totalUsers: number, userName?: string, message?: string) => {
    const progress: ScanProgress = {
      phase,
      currentUserIndex: userIndex,
      totalUsers,
      currentUserName: userName,
      progressPercent: totalUsers > 0 ? Math.round((userIndex / totalUsers) * 100) : 0,
      stats: {
        pairsEvaluated: stats.pairsEvaluated,
        pairsPassedQuickFilter: stats.pairsPassedQuickFilter,
        pairsPassedVectorFilter: stats.pairsPassedVectorFilter,
        pairsSentToAi: stats.pairsSentToAi,
        matchesFoundSoFar: stats.matchesFound,
      },
      message: message || `עיבוד ${userIndex}/${totalUsers}`,
    };
    await updateProgress(scanSessionId, progress, opts.onProgress);
  };

  try {
    // ==========================================================================
    // שלב 1: שליפת משתמשים
    // ==========================================================================
    
    await sendProgress('loading_users', 0, 0, undefined, 'טוען משתמשים...');
    
    let usersToScan = opts.usersToScan;
    if (opts.incrementalOnly && (!usersToScan || usersToScan.length === 0)) {
      usersToScan = await getChangedUsersSinceLastScan();
      if (usersToScan.length === 0) {
        console.log(`[SymmetricScan] ✅ No changes since last scan - nothing to do`);
        
        await prisma.scanSession.update({
          where: { id: scanSessionId },
          data: {
            status: 'completed',
            durationMs: Date.now() - startTime,
            completedAt: new Date(),
          }
        });
        
        return {
          success: true,
          scanSessionId,
          stats: { ...stats, durationMs: Date.now() - startTime },
          topMatches: [],
        };
      }
    }
    
    const { males, females, blockedPairs } = await fetchActiveUsersAndBlockedPairs(usersToScan);
    
    stats.malesScanned = males.length;
    stats.femalesScanned = females.length;
    stats.usersScanned = males.length + females.length;
    
    console.log(`[SymmetricScan] 📊 Population: ${males.length} Males, ${females.length} Females`);
    console.log(`[SymmetricScan] 🚫 Blocked Pairs Loaded: ${blockedPairs.size}`);

    if (males.length === 0 || females.length === 0) {
      throw new Error('No active users to scan');
    }

    // ==========================================================================
    // שלב 2: לולאה על משתמשים - עם Parallel Processing ושמירה בזמן אמת
    // ==========================================================================
    
    const allUsers = [...males, ...females];
    const processedPairs = new Set<string>();
    const vectorCacheToSave: Array<{ profileId1: string; profileId2: string; similarity: number }> = [];

    // עיבוד ב-batches מקבילים
    for (let batchStart = 0; batchStart < allUsers.length; batchStart += opts.parallelBatchSize) {
      const batch = allUsers.slice(batchStart, batchStart + opts.parallelBatchSize);
      
      await sendProgress(
        'quick_filter', 
        batchStart, 
        allUsers.length, 
        batch[0]?.firstName,
        `סורק ${batchStart + 1}-${Math.min(batchStart + opts.parallelBatchSize, allUsers.length)} מתוך ${allUsers.length}`
      );
      
      // עיבוד מקבילי של batch
      const batchResults = await Promise.all(
        batch.map(async (sourceUser) => {
          return processUserMatches(
            sourceUser,
            sourceUser.gender === 'MALE' ? females : males,
            processedPairs,
            blockedPairs,
            opts,
            stats,
            vectorCacheToSave
          );
        })
      );
      
      // 🚀 איסוף תוצאות ושמירה מיידית
      const matchesInBatch = batchResults.flat();
      
      if (matchesInBatch.length > 0) {
        console.log(`[SymmetricScan] 💾 Saving batch of ${matchesInBatch.length} matches...`);
        
        // שמירת ההתאמות שנמצאו ב-batch הנוכחי
        await Promise.all(matchesInBatch.map(async (match) => {
          const saveResult = await saveToPotentialMatch(match);
          if (saveResult === 'new') stats.newMatches++;
          else if (saveResult === 'updated') stats.updatedMatches++;
        }));
        
        stats.matchesFound += matchesInBatch.length;
      }
      
      // שמירת cache כל כמה batches
      if (vectorCacheToSave.length >= VECTOR_CACHE.BATCH_SIZE) {
        await saveVectorSimilaritiesBatch(vectorCacheToSave);
        vectorCacheToSave.length = 0;
      }
      
      // עדכון התקדמות כולל כמות ההתאמות שנמצאו עד כה
      await sendProgress(
        'ai_analysis', 
        batchStart + batch.length, 
        allUsers.length, 
        batch[batch.length-1]?.firstName,
        `נמצאו ${stats.matchesFound} התאמות (${stats.newMatches} חדשות)`
      );
      
      // Small delay למניעת עומס
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // שמירת cache שנשאר
    if (vectorCacheToSave.length > 0) {
      await saveVectorSimilaritiesBatch(vectorCacheToSave);
    }

    // ==========================================================================
    // סיום
    // ==========================================================================
    
    stats.durationMs = Date.now() - startTime;
    
    await sendProgress('completed', allUsers.length, allUsers.length, undefined, 
      `הושלם! נמצאו ${stats.matchesFound} התאמות (${stats.newMatches} חדשות)`);
    
    // עדכון session log
    await prisma.scanSession.update({
      where: { id: scanSessionId },
      data: {
        status: 'completed',
        totalUsersScanned: stats.usersScanned,
        malesScanned: stats.malesScanned,
        femalesScanned: stats.femalesScanned,
        pairsEvaluated: stats.pairsEvaluated,
        matchesFound: stats.matchesFound,
        newMatches: stats.newMatches,
        updatedMatches: stats.updatedMatches,
        aiCallsCount: stats.aiCallsCount,
        durationMs: stats.durationMs,
        completedAt: new Date(),
      },
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[SymmetricScan] ✅ Completed!`);
    console.log(`[SymmetricScan] Duration: ${(stats.durationMs / 1000 / 60).toFixed(2)} minutes`);
    console.log(`[SymmetricScan] Matches found: ${stats.matchesFound} (${stats.newMatches} new)`);
    console.log(`[SymmetricScan] Vector cache: ${stats.vectorCacheHits} hits, ${stats.vectorCacheMisses} misses`);
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      scanSessionId,
      stats,
      topMatches,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SymmetricScan] ❌ Error:`, error);
    
    await sendProgress('failed', 0, 0, undefined, `שגיאה: ${errorMessage}`);
    
    await prisma.scanSession.update({
      where: { id: scanSessionId },
      data: {
        status: 'failed',
        error: errorMessage,
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      },
    });
    
    return {
      success: false,
      scanSessionId,
      stats: { ...stats, durationMs: Date.now() - startTime },
      topMatches: [],
      error: errorMessage,
    };
  }
}

// =============================================================================
// PROCESS SINGLE USER MATCHES
// =============================================================================

/**
 * מעבד התאמות עבור משתמש בודד
 */
async function processUserMatches(
  sourceUser: ScanCandidate,
  oppositeGender: ScanCandidate[],
  processedPairs: Set<string>,
  blockedPairs: Set<string>,
  opts: Required<Omit<SymmetricScanOptions, 'onProgress' | 'scanSessionId'>> & { 
    useVectorCache: boolean;
    onProgress?: ProgressCallback;
  },
  stats: {
    pairsEvaluated: number;
    pairsPassedQuickFilter: number;
    pairsPassedVectorFilter: number;
    pairsPassedSoftScoring: number;
    pairsSentToAi: number;
    aiCallsCount: number;
    vectorCacheHits: number;
    vectorCacheMisses: number;
  },
  vectorCacheToSave: Array<{ profileId1: string; profileId2: string; similarity: number }>
): Promise<ScanPair[]> {
  const matches: ScanPair[] = [];
  
  // -----------------------------------------------------------------------
  // Tier 1: Quick Filter
  // -----------------------------------------------------------------------
  
  const quickFilterPassed: ScanCandidate[] = [];
  
  for (const candidate of oppositeGender) {
    const maleId = sourceUser.gender === 'MALE' ? sourceUser.userId : candidate.userId;
    const femaleId = sourceUser.gender === 'FEMALE' ? sourceUser.userId : candidate.userId;
    const pairKey = `${maleId}_${femaleId}`;
    
    if (processedPairs.has(pairKey)) continue;
    
    stats.pairsEvaluated++;
    
    if (blockedPairs.has(pairKey)) continue;
    
    // בדיקת גיל
    if (sourceUser.age !== null && candidate.age !== null) {
      const maleAge = sourceUser.gender === 'MALE' ? sourceUser.age : candidate.age;
      const femaleAge = sourceUser.gender === 'FEMALE' ? sourceUser.age : candidate.age;
      const ageDiff = maleAge - femaleAge;
      
      if (ageDiff > QUICK_FILTER.MAX_AGE_GAP_MALE_OLDER || 
          ageDiff < -QUICK_FILTER.MAX_AGE_GAP_FEMALE_OLDER) {
        continue;
      }
    }
    
    // בדיקת רמה דתית
    if (!areReligiousLevelsCompatible(sourceUser.religiousLevel, candidate.religiousLevel)) {
      continue;
    }
    
    quickFilterPassed.push(candidate);
  }
  
  stats.pairsPassedQuickFilter += quickFilterPassed.length;
  
  if (quickFilterPassed.length === 0) return matches;
  
  // -----------------------------------------------------------------------
  // Tier 2: Vector Similarity (עם Cache)
  // -----------------------------------------------------------------------
  
  let vectorPassed: ScanCandidate[] = quickFilterPassed;
  
  if (!opts.skipVectorTier && quickFilterPassed.length > VECTOR_FILTER.TOP_CANDIDATES) {
    vectorPassed = await filterByVectorSimilarityWithCache(
      sourceUser,
      quickFilterPassed,
      VECTOR_FILTER.TOP_CANDIDATES,
      VECTOR_FILTER.MIN_SIMILARITY,
      opts.useVectorCache,
      stats,
      vectorCacheToSave
    );
    stats.pairsPassedVectorFilter += vectorPassed.length;
  } else {
    stats.pairsPassedVectorFilter += quickFilterPassed.length;
  }
  
  if (vectorPassed.length === 0) return matches;
  
  // -----------------------------------------------------------------------
  // Tier 3: Soft Scoring
  // -----------------------------------------------------------------------
  
  const softScoredCandidates = calculateSoftScores(sourceUser, vectorPassed);
  
  softScoredCandidates.sort((a, b) => (b.softScore || 0) - (a.softScore || 0));
  const topForAi = softScoredCandidates
    .filter(c => (c.softScore || 0) >= SOFT_SCORING.MIN_SCORE)
    .slice(0, SOFT_SCORING.TOP_FOR_AI);
  
  stats.pairsPassedSoftScoring += topForAi.length;
  
  if (topForAi.length === 0) return matches;
  
  // -----------------------------------------------------------------------
  // Tier 4: AI Deep Analysis
  // -----------------------------------------------------------------------
  
  const aiResults = await runAiAnalysisBatched(sourceUser, topForAi, opts.batchSize);
  
  stats.pairsSentToAi += topForAi.length;
  stats.aiCallsCount += Math.ceil(topForAi.length / opts.batchSize);
  
  // עיבוד התוצאות
  for (const result of aiResults) {
    if ((result.aiScore || 0) < opts.minAiScore) continue;
    
    const maleId = sourceUser.gender === 'MALE' ? sourceUser.userId : result.userId;
    const femaleId = sourceUser.gender === 'FEMALE' ? sourceUser.userId : result.userId;
    const pairKey = `${maleId}_${femaleId}`;
    
    processedPairs.add(pairKey);
    
    matches.push({
      maleUserId: maleId,
      femaleUserId: femaleId,
      maleAge: sourceUser.gender === 'MALE' ? sourceUser.age! : result.age!,
      femaleAge: sourceUser.gender === 'FEMALE' ? sourceUser.age! : result.age!,
      passedQuickFilter: true,
      passedVectorFilter: true,
      passedSoftScoring: true,
      vectorSimilarity: result.vectorSimilarity,
      ageScore: result.ageScore,
      backgroundMultiplier: result.backgroundScore,
      softScore: result.softScore,
      aiScore: result.aiScore,
      finalScore: result.aiScore,
      scoreForMale: sourceUser.gender === 'MALE' ? result.scoreForSource : result.scoreForCandidate,
      scoreForFemale: sourceUser.gender === 'FEMALE' ? result.scoreForSource : result.scoreForCandidate,
      reasoning: result.reasoning,
    });
  }
  
  return matches;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * שליפת משתמשים פעילים וזוגות חסומים
 */
async function fetchActiveUsersAndBlockedPairs(specificUserIds?: string[]): Promise<{
  males: ScanCandidate[];
  females: ScanCandidate[];
  blockedPairs: Set<string>;
}> {
  const whereClause: any = {
    status: {
      in: [
        UserStatus.ACTIVE, 
        UserStatus.PENDING_PHONE_VERIFICATION, 
        UserStatus.PENDING_EMAIL_VERIFICATION
      ]
    },
    profile: {
      availabilityStatus: {
        in: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.PAUSED],
      },
    },
  };
  
  if (specificUserIds?.length) {
    whereClause.id = { in: specificUserIds };
  }
  
  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      profile: true,
    },
  });
  
  const males: ScanCandidate[] = [];
  const females: ScanCandidate[] = [];
  
  for (const user of users) {
    if (!user.profile) continue;
    
    const candidate: ScanCandidate = {
      userId: user.id,
      profileId: user.profile.id,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.profile.gender,
      age: user.profile.birthDate ? calculateAge(user.profile.birthDate) : null,
      religiousLevel: user.profile.religiousLevel,
      city: user.profile.city,
      occupation: user.profile.occupation,
      profileUpdatedAt: user.profile.updatedAt,
    };
    
    if (user.profile.gender === 'MALE') {
      males.push(candidate);
    } else {
      females.push(candidate);
    }
  }
  
  // טעינת זוגות חסומים
  const maleIds = males.map(m => m.userId);
  const femaleIds = females.map(f => f.userId);
  
  const blockedSuggestions = await prisma.matchSuggestion.findMany({
    where: {
      status: { in: BLOCKING_SUGGESTION_STATUSES },
      OR: [
        { firstPartyId: { in: maleIds }, secondPartyId: { in: femaleIds } },
        { firstPartyId: { in: femaleIds }, secondPartyId: { in: maleIds } },
      ],
    },
    select: { firstPartyId: true, secondPartyId: true },
  });
  
  const blockedPotential = await prisma.potentialMatch.findMany({
    where: {
      maleUserId: { in: maleIds },
      femaleUserId: { in: femaleIds },
      status: { in: BLOCKING_POTENTIAL_MATCH_STATUSES },
    },
    select: { maleUserId: true, femaleUserId: true },
  });
  
  const blockedPairs = new Set<string>();
  
  for (const s of blockedSuggestions) {
    const maleId = maleIds.includes(s.firstPartyId) ? s.firstPartyId : s.secondPartyId;
    const femaleId = femaleIds.includes(s.firstPartyId) ? s.firstPartyId : s.secondPartyId;
    blockedPairs.add(`${maleId}_${femaleId}`);
  }
  
  for (const p of blockedPotential) {
    blockedPairs.add(`${p.maleUserId}_${p.femaleUserId}`);
  }
  
  return { males, females, blockedPairs };
}

/**
 * סינון לפי דמיון וקטורי עם Cache - גרסה אופטימלית (Batch Fetching)
 */
async function filterByVectorSimilarityWithCache(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[],
  topCount: number,
  minSimilarity: number,
  useCache: boolean,
  stats: { vectorCacheHits: number; vectorCacheMisses: number },
  cacheToSave: Array<{ profileId1: string; profileId2: string; similarity: number }>
): Promise<ScanCandidate[]> {
  
  // בדיקה שיש וקטור ל-source
  const hasSourceVector = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "profileId" as id FROM profile_vectors
    WHERE "profileId" = ${sourceUser.profileId} AND vector IS NOT NULL
  `;
  
  if (hasSourceVector.length === 0) {
    return candidates;
  }
  
  const candidatesWithSimilarity: Array<ScanCandidate & { similarity: number }> = [];
  const candidatesToCompute: ScanCandidate[] = [];
  
  // מפה לגישה מהירה למועמדים לפי ID
  const candidateMap = new Map(candidates.map(c => [c.profileId, c]));
  const candidateProfileIds = candidates.map(c => c.profileId);

  if (useCache && candidateProfileIds.length > 0) {
    // 🚀 BATCH FETCH: שליפת כל ה-Cache בשאילתה אחת
    const cachedResults = await prisma.vectorSimilarityCache.findMany({
      where: {
        OR: [
          {
            profileId1: sourceUser.profileId,
            profileId2: { in: candidateProfileIds }
          },
          {
            profileId1: { in: candidateProfileIds },
            profileId2: sourceUser.profileId
          }
        ]
      },
      select: {
        profileId1: true,
        profileId2: true,
        similarity: true,
        calculatedAt: true
      }
    });

    // יצירת מפה לתוצאות ה-Cache
    const cacheMap = new Map<string, number>();
    for (const res of cachedResults) {
      const otherId = res.profileId1 === sourceUser.profileId ? res.profileId2 : res.profileId1;
      const candidate = candidateMap.get(otherId);
      if (!candidate) continue;

      // בדיקת תוקף זמן (אם פרופיל השתנה)
      if (
        (res.calculatedAt < sourceUser.profileUpdatedAt) || 
        (res.calculatedAt < candidate.profileUpdatedAt)
      ) {
        continue; 
      }

      cacheMap.set(otherId, res.similarity);
    }

    // מיון ל-Hits ו-Misses
    for (const candidate of candidates) {
      const cachedSim = cacheMap.get(candidate.profileId);
      if (cachedSim !== undefined) {
        stats.vectorCacheHits++;
        candidatesWithSimilarity.push({ ...candidate, similarity: cachedSim });
      } else {
        stats.vectorCacheMisses++;
        candidatesToCompute.push(candidate);
      }
    }
  } else {
    candidatesToCompute.push(...candidates);
  }
  
  // חישוב דמיון לאלו שחסר (Batch Query)
  if (candidatesToCompute.length > 0) {
    const missingIds = candidatesToCompute.map(c => c.profileId);
    
    try {
      const similarities = await prisma.$queryRaw<{ profileId: string; similarity: number }[]>`
        SELECT
          pv."profileId",
          1 - (pv.vector <=> (
            SELECT vector FROM profile_vectors WHERE "profileId" = ${sourceUser.profileId}
          )) as similarity
        FROM profile_vectors pv
        WHERE pv."profileId" = ANY(${missingIds}::text[])
          AND pv.vector IS NOT NULL
      `;
      
      for (const sim of similarities) {
        const candidate = candidateMap.get(sim.profileId);
        if (candidate) {
          candidatesWithSimilarity.push({ ...candidate, similarity: sim.similarity });
          
          cacheToSave.push({
            profileId1: sourceUser.profileId,
            profileId2: candidate.profileId,
            similarity: sim.similarity,
          });
        }
      }
    } catch (e) {
      console.error("Vector computation failed", e);
    }
  }
  
  // מיון וסינון סופי
  candidatesWithSimilarity.sort((a, b) => b.similarity - a.similarity);
  
  return candidatesWithSimilarity
    .filter(c => c.similarity >= minSimilarity)
    .slice(0, topCount)
    .map(c => ({ ...c, vectorSimilarity: c.similarity }));
}


/**
 * חישוב ציונים רכים
 */
function calculateSoftScores(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[]
): ScanCandidate[] {
  return candidates.map(candidate => {
    let softScore = 50; // בסיס
    
    // בונוס לדמיון וקטורי
    if (candidate.vectorSimilarity) {
      softScore += candidate.vectorSimilarity * 30;
    }
    
    // בונוס להתאמת גיל
    if (sourceUser.age && candidate.age) {
      const maleAge = sourceUser.gender === 'MALE' ? sourceUser.age : candidate.age;
      const femaleAge = sourceUser.gender === 'FEMALE' ? sourceUser.age : candidate.age;
      const ageDiff = maleAge - femaleAge;
      
      // טווח אידיאלי: גבר גדול ב-0-4 שנים
      if (ageDiff >= 0 && ageDiff <= 4) {
        softScore += 15;
      } else if (ageDiff >= -2 && ageDiff <= 7) {
        softScore += 8;
      }
      
      const ageScoreResult = calculateAgeScore(maleAge, femaleAge);
      candidate.ageScore = ageScoreResult.score;
    }
    
    // בונוס לעיר זהה
    if (sourceUser.city && candidate.city && sourceUser.city === candidate.city) {
      softScore += 5;
    }
    
    return {
      ...candidate,
      softScore: Math.min(100, softScore),
    };
  });
}

/**
 * הרצת AI ב-batches
 */
async function runAiAnalysisBatched(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[],
  batchSize: number
): Promise<ScanCandidate[]> {
  const results: ScanCandidate[] = [];
  
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    try {
      const batchResults = await runAiBatchAnalysis(sourceUser, batch);
      results.push(...batchResults);
    } catch (error) {
      console.error(`[SymmetricScan] AI batch error:`, error);
      // Fallback לציון רך
      for (const c of batch) {
        results.push({
          ...c,
          aiScore: c.softScore,
          reasoning: 'AI error - using soft score',
        });
      }
    }
    
    // Small delay between batches
    if (i + batchSize < candidates.length) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  
  return results;
}

/**
 * הרצת batch בודד של AI
 */
async function runAiBatchAnalysis(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[]
): Promise<ScanCandidate[]> {
  const sourceGenderHe = sourceUser.gender === 'MALE' ? 'גבר' : 'אישה';
  const candidateGenderHe = sourceUser.gender === 'MALE' ? 'נשים' : 'גברים';
  
  const candidatesText = candidates.map((c, idx) => {
    const ageInfo = c.ageScore !== undefined 
      ? `התאמת גיל: ${c.ageScore}/100`
      : 'גיל: לא ידוע';
    
    return `
[מועמד/ת ${idx + 1}]
- ID: ${c.userId}
- שם: ${c.firstName} ${c.lastName}
- גיל: ${c.age ?? 'לא ידוע'}
- ${ageInfo}
- רמה דתית: ${c.religiousLevel || 'לא צוין'}
- עיר: ${c.city || 'לא צוין'}
- עיסוק: ${c.occupation || 'לא צוין'}
- ציון התאמה ראשוני: ${c.softScore || 0}
${c.vectorSimilarity ? `- דמיון פרופיל: ${(c.vectorSimilarity * 100).toFixed(0)}%` : ''}
`;
  }).join('\n---\n');
  
  const prompt = `אתה שדכן AI מומחה בקהילה הדתית-לאומית בישראל.

=== מי מחפש ===
${sourceGenderHe}: ${sourceUser.firstName} ${sourceUser.lastName}
גיל: ${sourceUser.age ?? 'לא ידוע'}
רמה דתית: ${sourceUser.religiousLevel || 'לא צוין'}
עיר: ${sourceUser.city || 'לא צוין'}
עיסוק: ${sourceUser.occupation || 'לא צוין'}

=== ${candidates.length} ${candidateGenderHe} לדירוג ===
${candidatesText}

=== המשימה ===
דרג כל מועמד/ת מ-0 עד 100.

קריטריונים:
1. התאמה דתית והשקפתית (25 נקודות)
2. התאמת גיל (15 נקודות)
3. איזון קריירה-משפחה (15 נקודות)
4. סגנון חיים (15 נקודות)
5. ערכים משותפים (15 נקודות)
6. התאמה מעשית (15 נקודות)

=== פורמט התשובה (JSON בלבד) ===
{
  "results": [
    { "userId": "...", "score": 85, "scoreForSource": 82, "scoreForCandidate": 88, "reasoning": "נימוק קצר" }
  ]
}

שים לב:
- score = ציון כללי
- scoreForSource = כמה המועמד/ת מתאים/ה למחפש/ת
- scoreForCandidate = כמה המחפש/ת מתאים/ה למועמד/ת

התשובה חייבת להיות JSON תקין בלבד.`;

  const result = await model.generateContent(prompt);
  let jsonString = result.response.text();
  
  // ניקוי markdown
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7, -3).trim();
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3, -3).trim();
  }
  
  const parsed = JSON.parse(jsonString) as {
    results: Array<{
      userId: string;
      score: number;
      scoreForSource?: number;
      scoreForCandidate?: number;
      reasoning: string;
    }>;
  };
  
  // First, filter to get valid candidates, then map to add AI scores
  const validResults: ScanCandidate[] = [];
  
  for (const r of parsed.results) {
    const candidate = candidates.find(c => c.userId === r.userId);
    if (candidate) {
      validResults.push({
        ...candidate,
        aiScore: Math.min(100, Math.max(0, r.score)),
        scoreForSource: r.scoreForSource,
        scoreForCandidate: r.scoreForCandidate,
        reasoning: r.reasoning || '',
      });
    }
  }
  
  return validResults;
}

/**
 * שמירה ב-PotentialMatch
 */
async function saveToPotentialMatch(
  match: ScanPair
): Promise<'new' | 'updated' | 'unchanged'> {
  try {
    const existing = await prisma.potentialMatch.findUnique({
      where: {
        maleUserId_femaleUserId: {
          maleUserId: match.maleUserId,
          femaleUserId: match.femaleUserId,
        },
      },
    });
    
    if (existing) {
      if (Math.abs(existing.aiScore - (match.aiScore || 0)) > 3 || existing.status === 'EXPIRED') {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            aiScore: match.aiScore || 0,
            scoreForMale: match.scoreForMale,
            scoreForFemale: match.scoreForFemale,
            surfaceMatchScore: match.softScore,
            shortReasoning: match.reasoning,
            scannedAt: new Date(),
            status: existing.status === 'EXPIRED' ? 'PENDING' : existing.status,
            confidenceLevel: match.vectorSimilarity,
          },
        });
        return 'updated';
      }
      return 'unchanged';
    }
    
    await prisma.potentialMatch.create({
      data: {
        maleUserId: match.maleUserId,
        femaleUserId: match.femaleUserId,
        aiScore: match.aiScore || 0,
        scoreForMale: match.scoreForMale,
        scoreForFemale: match.scoreForFemale,
        surfaceMatchScore: match.softScore,
        shortReasoning: match.reasoning,
        status: 'PENDING',
        scannedAt: new Date(),
        confidenceLevel: match.vectorSimilarity,
      },
    });
    
    return 'new';
    
  } catch (error) {
    console.warn(`[SymmetricScan] Could not save match:`, error);
    return 'unchanged';
  }
}

// =============================================================================
// SINGLE USER SCAN
// =============================================================================

export async function scanSingleUser(userId: string): Promise<{
  matchesFound: number;
  newMatches: number;
}> {
  console.log(`[SymmetricScan] 🎯 Scanning single user: ${userId}`);
  
  const result = await runSymmetricScan({
    usersToScan: [userId],
    forceRefresh: true,
  });
  
  return {
    matchesFound: result.stats.matchesFound,
    newMatches: result.stats.newMatches,
  };
}

/**
 * סריקה למשתמשים חדשים (שנרשמו ב-24 שעות האחרונות)
 */
export async function scanNewUsers(): Promise<SymmetricScanResult> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - 24);
  
  const newUsers = await prisma.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      createdAt: { gte: cutoffDate },
      profile: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
      },
    },
    select: { id: true },
  });
  
  if (newUsers.length === 0) {
    console.log(`[SymmetricScan] No new users to scan`);
    return {
      success: true,
      scanSessionId: '',
      stats: {
        usersScanned: 0,
        malesScanned: 0,
        femalesScanned: 0,
        pairsEvaluated: 0,
        pairsPassedQuickFilter: 0,
        pairsPassedVectorFilter: 0,
        pairsPassedSoftScoring: 0,
        pairsSentToAi: 0,
        matchesFound: 0,
        newMatches: 0,
        updatedMatches: 0,
        durationMs: 0,
        aiCallsCount: 0,
        vectorCacheHits: 0,
        vectorCacheMisses: 0,
      },
      topMatches: [],
    };
  }
  
  console.log(`[SymmetricScan] 🆕 Scanning ${newUsers.length} new users`);
  
  return runSymmetricScan({
    usersToScan: newUsers.map(u => u.id),
    forceRefresh: true,
  });
}

/**
 * סריקה אינקרמנטלית - רק משתמשים שהשתנו
 */
export async function runIncrementalScan(
  onProgress?: ProgressCallback
): Promise<SymmetricScanResult> {
  console.log(`[SymmetricScan] 🔄 Starting incremental scan`);
  
  return runSymmetricScan({
    incrementalOnly: true,
    useVectorCache: true,
    onProgress,
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

const symmetricScanService = {
  runSymmetricScan,
  scanSingleUser,
  scanNewUsers,
  runIncrementalScan,
  
  // Constants
  QUICK_FILTER,
  VECTOR_FILTER,
  SOFT_SCORING,
  AI_SCORING,
};

export default symmetricScanService;