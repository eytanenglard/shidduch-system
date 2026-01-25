// =============================================================================
// 📁 src/lib/services/symmetricScanService.ts
// =============================================================================
// 🎯 Symmetric Scan Service V2.1 - NeshamaTech
// 
// סריקה דו-כיוונית (סימטרית) עם Tiered Matching.
// כולל תיקונים לטיפול בווקטורים חסרים והרחבת מעגל החיפוש.
// =============================================================================

import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus, UserStatus } from "@prisma/client";
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

export interface SymmetricScanOptions {
  forceRefresh?: boolean;           // לסרוק גם זוגות שלא השתנו
  usersToScan?: string[];           // רשימת משתמשים ספציפיים לסריקה
  maxPairsPerUser?: number;         // מקסימום זוגות לכל משתמש
  minAiScore?: number;              // סף מינימלי לציון AI
  skipVectorTier?: boolean;         // לדלג על Vector (לבדיקות)
  batchSize?: number;               // גודל batch ל-AI
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

const DEFAULT_OPTIONS: Required<SymmetricScanOptions> = {
  forceRefresh: false,
  usersToScan: [],
  maxPairsPerUser: 50,
  minAiScore: 70,
  skipVectorTier: false,
  batchSize: 15,
};

// Tier 1 thresholds
const QUICK_FILTER = {
  MAX_AGE_GAP_MALE_OLDER: 12,    // הורחב ל-12
  MAX_AGE_GAP_FEMALE_OLDER: 6,   // הורחב ל-6
  RELIGIOUS_LEVEL_RANGE: 4,      // מרחק מקסימלי ברמה דתית
};

// Tier 2 thresholds
const VECTOR_FILTER = {
  MIN_SIMILARITY: 0.25,          // סף דמיון מינימלי
  TOP_CANDIDATES: 50,            // כמה לקחת מ-Vector
};

// Tier 3 thresholds
const SOFT_SCORING = {
  TOP_FOR_AI: 30,                // כמה לשלוח ל-AI
  MIN_SCORE: 40,                 // סף מינימלי ל-Soft Score
};

// Tier 4
const AI_SCORING = {
  MIN_SCORE: 70,                 // סף מינימלי לשמירה
  BATCH_SIZE: 15,                // כמה זוגות בקריאה אחת
};

// =============================================================================
// MAIN SCAN FUNCTION
// =============================================================================

/**
 * מריץ סריקה סימטרית - גם גברים וגם נשים
 */
export async function runSymmetricScan(
  options: SymmetricScanOptions = {}
): Promise<SymmetricScanResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`[SymmetricScan] 🔄 Starting Symmetric Tiered Scan V2.1 (Full Fix)`);
  console.log(`[SymmetricScan] Options: forceRefresh=${opts.forceRefresh}`);
  console.log(`${'='.repeat(70)}\n`);

  // יצירת session log
  const scanSession = await prisma.scanSession.create({
    data: {
      scanType: opts.usersToScan?.length ? 'manual' : 'nightly',
      status: 'running',
    },
  });

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
  };

  const topMatches: SymmetricScanResult['topMatches'] = [];

  try {
    // ==========================================================================
    // שלב 1: שליפת כל המשתמשים (המורחבים)
    // ==========================================================================
    
    const { males, females, blockedPairs } = await fetchActiveUsersAndBlockedPairs(opts.usersToScan);
    
    stats.malesScanned = males.length;
    stats.femalesScanned = females.length;
    stats.usersScanned = males.length + females.length;
    
    console.log(`[SymmetricScan] 📊 Population: ${males.length} Males, ${females.length} Females`);
    console.log(`[SymmetricScan] 🚫 Blocked Pairs Loaded: ${blockedPairs.size}`);

    if (males.length === 0 || females.length === 0) {
      throw new Error('No active users to scan');
    }

    // ==========================================================================
    // שלב 2: לולאה על כל המשתמשים (גברים + נשים)
    // ==========================================================================
    
    const allUsers = [...males, ...females];
    const processedPairs = new Set<string>(); // למנוע כפילויות
    const matchesToSave: ScanPair[] = [];

    for (const sourceUser of allUsers) {
      const oppositeGender = sourceUser.gender === 'MALE' ? females : males;
      
      // -----------------------------------------------------------------------
      // Tier 1: Quick Filter
      // -----------------------------------------------------------------------
      
      const quickFilterPassed: ScanCandidate[] = [];
      
      for (const candidate of oppositeGender) {
        // יצירת מזהה זוג נורמלי (תמיד male_female)
        const maleId = sourceUser.gender === 'MALE' ? sourceUser.userId : candidate.userId;
        const femaleId = sourceUser.gender === 'FEMALE' ? sourceUser.userId : candidate.userId;
        const pairKey = `${maleId}_${femaleId}`;
        
        // דלג על זוגות שכבר עובדו
        if (processedPairs.has(pairKey)) continue;
        
        stats.pairsEvaluated++;
        
        // בדיקת היסטוריה חוסמת
        if (blockedPairs.has(pairKey)) {
          continue;
        }
        
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
      
      if (quickFilterPassed.length === 0) continue;
      
      // -----------------------------------------------------------------------
      // Tier 2: Vector Similarity (עם תיקון קריסה + יצירה אוטומטית)
      // -----------------------------------------------------------------------
      
      let vectorPassed: ScanCandidate[] = quickFilterPassed;
      
      if (!opts.skipVectorTier && quickFilterPassed.length > VECTOR_FILTER.TOP_CANDIDATES) {
        vectorPassed = await filterByVectorSimilarity(
          sourceUser,
          quickFilterPassed,
          VECTOR_FILTER.TOP_CANDIDATES,
          VECTOR_FILTER.MIN_SIMILARITY
        );
        stats.pairsPassedVectorFilter += vectorPassed.length;
      } else {
        stats.pairsPassedVectorFilter += quickFilterPassed.length;
      }
      
      if (vectorPassed.length === 0) continue;
      
      // -----------------------------------------------------------------------
      // Tier 3: Soft Scoring
      // -----------------------------------------------------------------------
      
      const softScoredCandidates = calculateSoftScores(sourceUser, vectorPassed);
      
      // מיון לפי ציון רך ולקיחת Top
      softScoredCandidates.sort((a, b) => (b.softScore || 0) - (a.softScore || 0));
      const topForAi = softScoredCandidates
        .filter(c => (c.softScore || 0) >= SOFT_SCORING.MIN_SCORE)
        .slice(0, SOFT_SCORING.TOP_FOR_AI);
      
      stats.pairsPassedSoftScoring += topForAi.length;
      
      if (topForAi.length === 0) continue;
      
      // -----------------------------------------------------------------------
      // Tier 4: AI Deep Analysis (Batched)
      // -----------------------------------------------------------------------
      
      const aiResults = await runAiAnalysisBatched(
        sourceUser,
        topForAi,
        opts.batchSize
      );
      
      stats.pairsSentToAi += topForAi.length;
      stats.aiCallsCount += Math.ceil(topForAi.length / opts.batchSize);
      
      // שמירת התוצאות
      for (const result of aiResults) {
        if ((result.aiScore || 0) < opts.minAiScore) continue;
        
        const maleId = sourceUser.gender === 'MALE' ? sourceUser.userId : result.userId;
        const femaleId = sourceUser.gender === 'FEMALE' ? sourceUser.userId : result.userId;
        const pairKey = `${maleId}_${femaleId}`;
        
        // סימון שעובד
        processedPairs.add(pairKey);
        
        matchesToSave.push({
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
          reasoning: result.reasoning,
        });
        
        stats.matchesFound++;
      }
    }
    
    // ==========================================================================
    // שלב 3: שמירה בדאטהבייס
    // ==========================================================================
    
    console.log(`[SymmetricScan] 💾 Saving ${matchesToSave.length} matches...`);
    
    for (const match of matchesToSave) {
      const saveResult = await saveToPotentialMatch(match);
      if (saveResult === 'new') stats.newMatches++;
      else if (saveResult === 'updated') stats.updatedMatches++;
    }
    
    // Top 10 לתצוגה
    const sortedMatches = matchesToSave.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    for (const match of sortedMatches.slice(0, 10)) {
      const male = males.find(m => m.userId === match.maleUserId);
      const female = females.find(f => f.userId === match.femaleUserId);
      
      topMatches.push({
        maleUserId: match.maleUserId,
        maleName: male ? `${male.firstName} ${male.lastName}` : 'Unknown',
        femaleUserId: match.femaleUserId,
        femaleName: female ? `${female.firstName} ${female.lastName}` : 'Unknown',
        finalScore: match.finalScore || 0,
      });
    }
    
    // ==========================================================================
    // סיום
    // ==========================================================================
    
    stats.durationMs = Date.now() - startTime;
    
    // עדכון session log
    await prisma.scanSession.update({
      where: { id: scanSession.id },
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
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      scanSessionId: scanSession.id,
      stats,
      topMatches,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SymmetricScan] ❌ Error:`, error);
    
    await prisma.scanSession.update({
      where: { id: scanSession.id },
      data: {
        status: 'failed',
        error: errorMessage,
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      },
    });
    
    return {
      success: false,
      scanSessionId: scanSession.id,
      stats,
      topMatches: [],
      error: errorMessage,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * שליפת משתמשים - עם הרחבת הסטטוסים לכיסוי מלא
 */
async function fetchActiveUsersAndBlockedPairs(specificUserIds?: string[]): Promise<{
  males: ScanCandidate[];
  females: ScanCandidate[];
  blockedPairs: Set<string>;
}> {
  // ✅ הרחבת הפילטר: כולל משתמשים הממתינים לאימות ומוסתרים
  const whereClause: any = {
    status: {
      in: [
        UserStatus.ACTIVE, 
        UserStatus.PENDING_PHONE_VERIFICATION, 
        UserStatus.PENDING_EMAIL_VERIFICATION
      ]
    },
    profile: {
      // ✅ מאפשר זמינות: פנוי, בהפסקה (שדכן יכול להציע), או לא מוגדר
      // אנחנו לא מסננים לפי isProfileVisible, כי לשדכן מותר לראות הכל
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
      backgroundProfile: createBackgroundProfile(
        user.profile.nativeLanguage,
        user.profile.additionalLanguages || [],
        user.profile.aliyaCountry,
        user.profile.aliyaYear,
        user.profile.origin,
        user.profile.about,
        user.profile.matchingNotes
      ),
    };
    
    if (user.profile.gender === 'MALE') {
      males.push(candidate);
    } else {
      females.push(candidate);
    }
  }
  
  const blockedPairs = await loadBlockedPairs(
    males.map(m => m.userId),
    females.map(f => f.userId)
  );
  
  return { males, females, blockedPairs };
}

async function loadBlockedPairs(maleIds: string[], femaleIds: string[]): Promise<Set<string>> {
  const blockedSet = new Set<string>();
  
  // הצעות שנדחו/נכשלו
  const blockingSuggestions = await prisma.matchSuggestion.findMany({
    where: {
      status: { in: BLOCKING_SUGGESTION_STATUSES },
      OR: [
        { firstPartyId: { in: maleIds }, secondPartyId: { in: femaleIds } },
        { firstPartyId: { in: femaleIds }, secondPartyId: { in: maleIds } },
      ],
    },
    select: { firstPartyId: true, secondPartyId: true },
  });
  
  for (const s of blockingSuggestions) {
    blockedSet.add(`${s.firstPartyId}_${s.secondPartyId}`);
    blockedSet.add(`${s.secondPartyId}_${s.firstPartyId}`);
  }
  
  // הצעות שנדחו ע"י שדכן בעבר (PotentialMatch DISMISSED)
  const dismissedMatches = await prisma.potentialMatch.findMany({
    where: {
      maleUserId: { in: maleIds },
      femaleUserId: { in: femaleIds },
      status: { in: BLOCKING_POTENTIAL_MATCH_STATUSES },
    },
    select: { maleUserId: true, femaleUserId: true },
  });
  
  for (const m of dismissedMatches) {
    blockedSet.add(`${m.maleUserId}_${m.femaleUserId}`);
  }
  
  return blockedSet;
}

/**
 * ✅ סינון וקטורי עם בדיקת קיום + יצירה אוטומטית
 */
async function filterByVectorSimilarity(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[],
  topN: number,
  minSimilarity: number
): Promise<ScanCandidate[]> {
  try {
    // בדיקה מהירה אם קיים וקטור (ללא שליפת המידע הכבד כדי למנוע קריסה)
    const vectorCheck = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "profileId" as id
      FROM profile_vectors 
      WHERE "profileId" = ${sourceUser.profileId}
      AND vector IS NOT NULL
    `;
    
    // ✅ התיקון: אם אין וקטור, נייצר אותו ברקע
    if (!vectorCheck.length) {
      console.warn(`[SymmetricScan] ⚠️ Missing vector for user ${sourceUser.userId}. Triggering background generation...`);
      
      // הפעלה ברקע (Fire and forget - לא עוצרים את הסריקה)
      updateUserAiProfile(sourceUser.userId).catch(err => 
        console.error(`[SymmetricScan] Failed to generate vector for ${sourceUser.userId}:`, err)
      );
      
      // מחזירים את המועמדים ללא סינון וקטורי הפעם
      return candidates.slice(0, topN);
    }
    
    const candidateIds = candidates.map(c => c.profileId);
    
    // חיפוש וקטורי בתוך ה-DB
    const similarProfiles = await prisma.$queryRaw<{ profileId: string; similarity: number }[]>`
      SELECT 
        pv."profileId",
        1 - (pv.vector <=> (
          SELECT vector FROM profile_vectors WHERE "profileId" = ${sourceUser.profileId}
        )) as similarity
      FROM profile_vectors pv
      WHERE pv."profileId" = ANY(${candidateIds}::text[])
        AND pv.vector IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${topN}
    `;
    
    const result: ScanCandidate[] = [];
    
    for (const sp of similarProfiles) {
      if (sp.similarity < minSimilarity) continue;
      const candidate = candidates.find(c => c.profileId === sp.profileId);
      if (candidate) {
        result.push({
          ...candidate,
          vectorSimilarity: sp.similarity,
        });
      }
    }
    
    return result;
    
  } catch (error) {
    // השתקת השגיאה הקריטית (malformed array literal) והמשך בסריקה רגילה
    console.warn(`[SymmetricScan] ⚠️ Vector filter skipped for ${sourceUser.userId} due to data issue. Falling back to basic filter.`);
    return candidates.slice(0, topN);
  }
}

/**
 * חישוב ציונים "רכים" (ללא AI)
 */
function calculateSoftScores(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[]
): ScanCandidate[] {
  return candidates.map(candidate => {
    let softScore = 50; // ציון בסיס
    
    // 1. ציון גיל (0-30 נקודות)
    if (sourceUser.age !== null && candidate.age !== null) {
      const maleAge = sourceUser.gender === 'MALE' ? sourceUser.age : candidate.age;
      const femaleAge = sourceUser.gender === 'FEMALE' ? sourceUser.age : candidate.age;
      
      const ageResult = calculateAgeScore(maleAge, femaleAge);
      const ageScore = (ageResult.score / 100) * 30;
      softScore += ageScore;
      candidate.ageScore = ageResult.score;
    }
    
    // 2. ציון רקע (0-20 נקודות)
    if (sourceUser.backgroundProfile && candidate.backgroundProfile) {
      const bgMatch = calculateBackgroundMatch(
        sourceUser.backgroundProfile,
        candidate.backgroundProfile
      );
      const bgScore = bgMatch.multiplier * 20;
      softScore += bgScore;
      candidate.backgroundScore = bgMatch.multiplier;
    }
    
    // 3. בונוס Vector Similarity (0-20 נקודות)
    if (candidate.vectorSimilarity) {
      softScore += candidate.vectorSimilarity * 20;
    }
    
    // 4. בונוס גיאוגרפיה (0-10 נקודות)
    if (sourceUser.city && candidate.city) {
      if (sourceUser.city === candidate.city) {
        softScore += 10;
      } else if (areCitiesNearby(sourceUser.city, candidate.city)) {
        softScore += 5;
      }
    }
    
    return {
      ...candidate,
      softScore: Math.round(softScore),
    };
  });
}

/**
 * בדיקה אם שתי ערים קרובות (פשוט - לשדרג בעתיד)
 */
function areCitiesNearby(city1: string, city2: string): boolean {
  const cityGroups: string[][] = [
    ['תל אביב', 'רמת גן', 'גבעתיים', 'בני ברק', 'חולון', 'בת ים', 'הרצליה', 'רעננה', 'פתח תקווה'],
    ['ירושלים', 'מבשרת ציון', 'מעלה אדומים', 'בית שמש', 'אפרת', 'גוש עציון'],
    ['חיפה', 'קריית אתא', 'קריית ביאליק', 'קריית מוצקין', 'טירת כרמל', 'נשר'],
    ['באר שבע', 'אופקים', 'נתיבות', 'שדרות'],
    ['מודיעין', 'מודיעין עילית', 'שוהם', 'לוד', 'רמלה'],
    ['נתניה', 'כפר סבא', 'הוד השרון', 'רעננה'],
  ];
  
  for (const group of cityGroups) {
    if (group.includes(city1) && group.includes(city2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * הרצת ניתוח AI ב-Batches
 */
async function runAiAnalysisBatched(
  sourceUser: ScanCandidate,
  candidates: ScanCandidate[],
  batchSize: number
): Promise<ScanCandidate[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('[SymmetricScan] No GOOGLE_API_KEY configured');
    // Fallback - מחזיר את ה-Soft Scores
    return candidates.map(c => ({
      ...c,
      aiScore: c.softScore,
      reasoning: 'AI unavailable - using soft score',
    }));
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });
  
  const results: ScanCandidate[] = [];
  
  // חלוקה ל-batches
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    
    try {
      const batchResults = await runAiBatchAnalysis(model, sourceUser, batch);
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
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * הרצת batch בודד של AI
 */
async function runAiBatchAnalysis(
  model: any,
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
  
  // תיקון ה-map וה-filter כדי לספק את TypeScript
  const processedResults = parsed.results.map(r => {
    const candidate = candidates.find(c => c.userId === r.userId);
    if (!candidate) return null;
    
    // יצירת אובייקט חדש התואם ל-ScanCandidate
    const updatedCandidate: ScanCandidate = {
      ...candidate,
      aiScore: Math.min(100, Math.max(0, r.score)),
      reasoning: r.reasoning || '',
    };
    
    return updatedCandidate;
  });

  // סינון ה-nulls והחזרת המערך הנקי
  return processedResults.filter((r): r is ScanCandidate => r !== null);
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
      // עדכון אם הציון השתנה משמעותית
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
    
    // יצירת רשומה חדשה
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

/**
 * סריקה למשתמש בודד (למשל כשנרשם משתמש חדש)
 */
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

// =============================================================================
// EXPORTS
// =============================================================================

const symmetricScanService = {
  runSymmetricScan,
  scanSingleUser,
  scanNewUsers,
  
  // Constants
  QUICK_FILTER,
  VECTOR_FILTER,
  SOFT_SCORING,
  AI_SCORING,
};

export default symmetricScanService;