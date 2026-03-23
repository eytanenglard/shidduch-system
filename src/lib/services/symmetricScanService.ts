// =============================================================================
// 📁 src/lib/services/symmetricScanService.ts
// =============================================================================
// 🎯 Symmetric Scan Service V4.0 - NeshamaTech
// 
// 🆕 עדכון: 28/01/2025
// - שימוש ב-scanSingleUserV2 לכל הסריקות
// - תמיכה במדדים החדשים (socioEconomic, jobSeniority, educationLevel)
// - תמיכה בערכים מוסקים (inferred values)
// - AI Deep Analysis עם סיכומי רקע מורחבים
// =============================================================================

import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus, UserStatus } from "@prisma/client";
import { scanSingleUserV2, saveScanResults, ScanResult, ScanOptions } from "./scanSingleUserV2";

// =============================================================================
// TYPES
// =============================================================================

// Progress callback type
export interface ScanProgress {
  phase: 'initializing' | 'loading_users' | 'scanning_user' | 'saving' | 'completed' | 'failed';
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
  maxCandidatesPerUser?: number;    // מקסימום מועמדים לכל משתמש
  minScore?: number;                // סף מינימלי לשמירה
  useVectors?: boolean;             // האם להשתמש בוקטורים
  useAIDeepAnalysis?: boolean;      // האם להשתמש בניתוח AI
  topForAI?: number;                // כמה מועמדים לשלוח ל-AI
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
  maxCandidatesPerUser: 100,
  minScore: 65,
  useVectors: true,
  useAIDeepAnalysis: true,
  topForAI: 30,
  incrementalOnly: false,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * מוצא משתמשים שהפרופיל שלהם השתנה מאז הסריקה האחרונה
 */
async function getChangedUsersSinceLastScan(): Promise<string[]> {
  const lastScan = await prisma.scanSession.findFirst({
    where: { status: 'COMPLETED' },
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

/**
 * שליפת משתמשים פעילים לסריקה
 */
async function fetchActiveUsers(specificUserIds?: string[]): Promise<{
  users: Array<{ userId: string; firstName: string; gender: Gender }>;
  malesCount: number;
  femalesCount: number;
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
      profile: {
        select: { gender: true }
      }
    },
  });
  
  let malesCount = 0;
  let femalesCount = 0;
  
  const result = users
    .filter(u => u.profile)
    .map(u => {
      if (u.profile!.gender === 'MALE') malesCount++;
      else femalesCount++;
      
      return {
        userId: u.id,
        firstName: u.firstName,
        gender: u.profile!.gender,
      };
    });
  
  return { users: result, malesCount, femalesCount };
}

/**
 * עדכון התקדמות
 */
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
// MAIN SCAN FUNCTION - V4.0 (Using scanSingleUserV2)
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
  console.log(`[SymmetricScan] 🔄 Starting Symmetric Scan V4.0 (Using scanSingleUserV2)`);
  console.log(`[SymmetricScan] Options: forceRefresh=${opts.forceRefresh}, incremental=${opts.incrementalOnly}`);
  console.log(`${'='.repeat(70)}\n`);

  let scanSessionId = opts.scanSessionId;
  
  // יצירת session חדש אם לא קיים
  if (!scanSessionId) {
    const scanSession = await prisma.scanSession.create({
      data: {
        scanType: opts.usersToScan?.length ? 'manual' : opts.incrementalOnly ? 'incremental' : 'nightly',
        status: 'IN_PROGRESS',
      },
    });
    scanSessionId = scanSession.id;
  }

  // סטטיסטיקות מצטברות
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

  // פונקציה לשליחת התקדמות
  const sendProgress = async (
    phase: ScanProgress['phase'], 
    userIndex: number, 
    totalUsers: number, 
    userName?: string, 
    message?: string
  ) => {
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
    // שלב 1: שליפת משתמשים לסריקה
    // ==========================================================================
    
    await sendProgress('initializing', 0, 0, undefined, 'טוען משתמשים...');
    
    let usersToScan = opts.usersToScan;
    
    // סריקה אינקרמנטלית - רק משתמשים שהשתנו
    if (opts.incrementalOnly && (!usersToScan || usersToScan.length === 0)) {
      usersToScan = await getChangedUsersSinceLastScan();
      
      if (usersToScan.length === 0) {
        console.log(`[SymmetricScan] ✅ No changes since last scan - nothing to do`);
        
        await prisma.scanSession.update({
          where: { id: scanSessionId },
          data: {
            status: 'COMPLETED',
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
    
    const { users, malesCount, femalesCount } = await fetchActiveUsers(usersToScan);
    
    stats.malesScanned = malesCount;
    stats.femalesScanned = femalesCount;
    stats.usersScanned = users.length;
    
    console.log(`[SymmetricScan] 📊 Users to scan: ${users.length} (${malesCount} M, ${femalesCount} F)`);

    if (users.length === 0) {
      throw new Error('No active users to scan');
    }

    await sendProgress('loading_users', 0, users.length, undefined, `נמצאו ${users.length} משתמשים לסריקה`);

    // ==========================================================================
    // שלב 2: לולאה על משתמשים - סריקה עם scanSingleUserV2
    // ==========================================================================
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      await sendProgress(
        'scanning_user', 
        i + 1, 
        users.length, 
        user.firstName,
        `סורק ${user.firstName} (${i + 1}/${users.length})`
      );
      
      console.log(`\n[SymmetricScan] 👤 Scanning user ${i + 1}/${users.length}: ${user.firstName}`);
      
      try {
        // 🆕 שימוש ב-scanSingleUserV2
        const scanResult: ScanResult = await scanSingleUserV2(user.userId, {
          useVectors: opts.useVectors,
          useAIDeepAnalysis: opts.useAIDeepAnalysis,
          maxCandidates: opts.maxCandidatesPerUser,
          topForAI: opts.topForAI,
          forceUpdateMetrics: opts.forceRefresh,
          skipCandidateMetricsUpdate: i > 0, // רק בסריקה הראשונה נעדכן מדדי מועמדים
        });
        
        // עדכון סטטיסטיקות מצטברות
        stats.pairsEvaluated += scanResult.stats.totalCandidates;
        stats.pairsPassedQuickFilter += scanResult.stats.passedDealBreakers;
        stats.pairsPassedVectorFilter += scanResult.stats.scoredCandidates;
        stats.pairsSentToAi += scanResult.stats.aiAnalyzed;
        stats.aiCallsCount += scanResult.stats.aiAnalyzed > 0 ? Math.ceil(scanResult.stats.aiAnalyzed / 5) : 0;
        
        // שמירת התוצאות ל-DB
        const savedCount = await saveScanResults(scanResult, scanSessionId);
        
        // עדכון מונים
        const matchesAboveThreshold = scanResult.matches.filter(m => m.symmetricScore >= opts.minScore).length;
        stats.matchesFound += matchesAboveThreshold;
        stats.newMatches += savedCount; // saveScanResults מחזיר כמות שנשמרו (חדשים + עדכונים)
        
        // הוספה ל-topMatches
        for (const match of scanResult.matches.slice(0, 3)) {
          if (match.symmetricScore >= 80) {
            const isMale = user.gender === 'MALE';
            topMatches.push({
              maleUserId: isMale ? user.userId : match.candidateUserId,
              maleName: isMale ? user.firstName : match.candidateName.split(' ')[0],
              femaleUserId: isMale ? match.candidateUserId : user.userId,
              femaleName: isMale ? match.candidateName.split(' ')[0] : user.firstName,
              finalScore: match.symmetricScore,
            });
          }
        }
        
        console.log(`[SymmetricScan] ✅ User ${user.firstName}: ${matchesAboveThreshold} matches found`);
        
      } catch (error) {
        console.error(`[SymmetricScan] ❌ Error scanning ${user.firstName}:`, error);
        // ממשיכים למשתמש הבא
      }
      
      // עדכון התקדמות אחרי כל משתמש
      await sendProgress(
        'scanning_user', 
        i + 1, 
        users.length, 
        user.firstName,
        `נמצאו ${stats.matchesFound} התאמות (${stats.newMatches} חדשות)`
      );
      
      // השהייה קטנה בין משתמשים למניעת עומס
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // ==========================================================================
    // שלב 3: סיום
    // ==========================================================================
    
    stats.durationMs = Date.now() - startTime;
    
    await sendProgress('completed', users.length, users.length, undefined, 
      `הושלם! נמצאו ${stats.matchesFound} התאמות (${stats.newMatches} חדשות)`);
    
    // שמירה ל-topMatches רק את הטובים ביותר
    topMatches.sort((a, b) => b.finalScore - a.finalScore);
    const finalTopMatches = topMatches.slice(0, 10);
    
    // עדכון session log
    await prisma.scanSession.update({
      where: { id: scanSessionId },
      data: {
        status: 'COMPLETED',
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
    console.log(`[SymmetricScan] ✅ Scan Completed!`);
    console.log(`[SymmetricScan] Duration: ${(stats.durationMs / 1000 / 60).toFixed(2)} minutes`);
    console.log(`[SymmetricScan] Users scanned: ${stats.usersScanned}`);
    console.log(`[SymmetricScan] Matches found: ${stats.matchesFound} (${stats.newMatches} new)`);
    console.log(`[SymmetricScan] AI calls: ${stats.aiCallsCount}`);
    console.log(`${'='.repeat(70)}\n`);
    
    return {
      success: true,
      scanSessionId,
      stats,
      topMatches: finalTopMatches,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SymmetricScan] ❌ Error:`, error);
    
    await sendProgress('failed', 0, 0, undefined, `שגיאה: ${errorMessage}`);
    
    await prisma.scanSession.update({
      where: { id: scanSessionId },
      data: {
        status: 'FAILED',
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
// SINGLE USER SCAN - 🆕 Using scanSingleUserV2
// =============================================================================

export async function scanSingleUser(userId: string): Promise<{
  matchesFound: number;
  newMatches: number;
}> {
  console.log(`[SymmetricScan] 🎯 Scanning single user: ${userId}`);
  
  try {
    // 🆕 שימוש ישיר ב-scanSingleUserV2
    const scanResult = await scanSingleUserV2(userId, {
      useVectors: true,
      useAIDeepAnalysis: true,
      maxCandidates: 100,
      topForAI: 30,
      forceUpdateMetrics: true,
    });
    
    // שמירת התוצאות
    const savedCount = await saveScanResults(scanResult);
    
    const matchesFound = scanResult.matches.filter(m => m.symmetricScore >= 65).length;
    
    console.log(`[SymmetricScan] ✅ Single user scan: ${matchesFound} matches, ${savedCount} saved`);
    
    return {
      matchesFound,
      newMatches: savedCount,
    };
    
  } catch (error) {
    console.error(`[SymmetricScan] ❌ Single user scan error:`, error);
    return {
      matchesFound: 0,
      newMatches: 0,
    };
  }
}

// =============================================================================
// SCAN NEW USERS - 🆕 Using scanSingleUserV2
// =============================================================================

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
// INCREMENTAL SCAN - 🆕 Using scanSingleUserV2
// =============================================================================

/**
 * סריקה אינקרמנטלית - רק משתמשים שהשתנו
 */
export async function runIncrementalScan(
  onProgress?: ProgressCallback
): Promise<SymmetricScanResult> {
  console.log(`[SymmetricScan] 🔄 Starting incremental scan (V4.0)`);
  
  return runSymmetricScan({
    incrementalOnly: true,
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
};

export default symmetricScanService;