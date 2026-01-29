// =============================================================================
// 📁 src/app/api/ai/batch-scan-all/route.ts
// =============================================================================
// 🎯 Batch Scan All - סריקה לילית V3.0 (Using scanSingleUserV2)
// 
// 🆕 עדכון: 28/01/2025
// - שימוש ב-scanSingleUserV2 לכל הסריקות
// - תמיכה במדדים החדשים (socioEconomic, jobSeniority, educationLevel)
// - סינון גיל דו-כיווני
// - AI Deep Analysis עם סיכומי רקע מורחבים
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AvailabilityStatus, UserStatus } from "@prisma/client";
import { scanSingleUserV2, saveScanResults, ScanResult } from "@/lib/services/scanSingleUserV2";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_SCORE_THRESHOLD = 65; // סף מינימלי לשמירה (תואם ל-scanSingleUserV2)
const PROGRESS_UPDATE_INTERVAL = 3; // עדכון progress כל X משתמשים

// =============================================================================
// TYPES
// =============================================================================

interface ScanStats {
  totalUsers: number;
  usersProcessed: number;
  malesProcessed: number;
  femalesProcessed: number;
  totalCandidatesScanned: number;
  passedDealBreakers: number;
  aiAnalyzed: number;
  matchesFound: number;
  newMatches: number;
  updatedMatches: number;
  startTime: number;
  errors: string[];
}

// =============================================================================
// POST - התחלת סריקה לילית
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      method = 'metrics_v2', // 🆕 ברירת מחדל: המתודה החדשה
      forceRefresh = false,
      userIds = [], // אפשרות לסרוק משתמשים ספציפיים
    } = body;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] 🌙 Starting Nightly Scan V3.0 (scanSingleUserV2)`);
    console.log(`[BatchScan] Method: ${method}`);
    console.log(`[BatchScan] Force Refresh: ${forceRefresh}`);
    if (userIds.length > 0) {
      console.log(`[BatchScan] Specific users: ${userIds.length}`);
    }
    console.log(`${'='.repeat(70)}\n`);

    // בדיקה אם יש סריקה רצה כבר
    const runningScan = await prisma.nightlyScanLog.findFirst({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' }
    });

    if (runningScan) {
      // בדיקה אם הסריקה תקועה (יותר משעה)
      const runningTime = Date.now() - runningScan.startedAt.getTime();
      if (runningTime > 60 * 60 * 1000) {
        console.log(`[BatchScan] ⚠️ Previous scan seems stuck, marking as failed`);
        await prisma.nightlyScanLog.update({
          where: { id: runningScan.id },
          data: {
            status: 'failed',
            error: 'Scan timed out after 1 hour',
            completedAt: new Date(),
          }
        });
      } else {
        console.log(`[BatchScan] ⚠️ Scan already running: ${runningScan.id}`);
        return NextResponse.json({
          success: false,
          status: 'already_running',
          scanId: runningScan.id,
          message: 'סריקה כבר רצה כרגע',
          runningFor: Math.round(runningTime / 1000 / 60) + ' minutes'
        });
      }
    }

    // יצירת רשומת לוג חדשה
    const scanLog = await prisma.nightlyScanLog.create({
      data: {
        status: 'running',
        totalCandidates: 0,
        candidatesScanned: 0,
        matchesFound: 0,
        newMatches: 0,
        updatedMatches: 0,
        startedAt: new Date(),
        method: 'metrics_v2', // 🆕 תמיד metrics_v2
        minScoreThreshold: MIN_SCORE_THRESHOLD,
      }
    });

    console.log(`[BatchScan] Created scan log: ${scanLog.id}`);

    // הפעלת הסריקה ברקע
    runScanWithV2(scanLog.id, forceRefresh, userIds)
      .catch(err => {
        console.error(`[BatchScan] Background scan failed:`, err);
      });

    return NextResponse.json({
      success: true,
      scanId: scanLog.id,
      message: 'הסריקה החלה (V3.0 - scanSingleUserV2)'
    });

  } catch (error) {
    console.error('[BatchScan] Error starting scan:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start scan'
    }, { status: 500 });
  }
}

// =============================================================================
// GET - בדיקת סטטוס סריקה
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');

    if (scanId) {
      const scan = await prisma.nightlyScanLog.findUnique({
        where: { id: scanId }
      });

      if (!scan) {
        return NextResponse.json({ 
          success: false, 
          error: 'Scan not found' 
        }, { status: 404 });
      }

      // חישוב אחוז התקדמות וזמן משוער
      const progress = scan.totalCandidates > 0 
        ? Math.round((scan.candidatesScanned / scan.totalCandidates) * 100)
        : 0;
      
      let estimatedRemainingMinutes: number | null = null;
      if (scan.status === 'running' && scan.candidatesScanned > 0) {
        const elapsedMs = Date.now() - scan.startedAt.getTime();
        const msPerCandidate = elapsedMs / scan.candidatesScanned;
        const remainingCandidates = scan.totalCandidates - scan.candidatesScanned;
        estimatedRemainingMinutes = Math.round(msPerCandidate * remainingCandidates / 1000 / 60);
      }

      return NextResponse.json({
        success: true,
        scan: {
          id: scan.id,
          status: scan.status,
          progress,
          totalCandidates: scan.totalCandidates,
          candidatesScanned: scan.candidatesScanned,
          matchesFound: scan.matchesFound,
          newMatches: scan.newMatches,
          updatedMatches: scan.updatedMatches,
          durationMs: scan.durationMs,
          estimatedRemainingMinutes,
          error: scan.error,
          startedAt: scan.startedAt,
          completedAt: scan.completedAt,
          method: scan.method,
        }
      });
    }

    // החזרת הסריקה האחרונה
    const lastScan = await prisma.nightlyScanLog.findFirst({
      orderBy: { startedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      lastScan: lastScan ? {
        id: lastScan.id,
        status: lastScan.status,
        matchesFound: lastScan.matchesFound,
        newMatches: lastScan.newMatches,
        durationMs: lastScan.durationMs,
        startedAt: lastScan.startedAt,
        completedAt: lastScan.completedAt,
        method: lastScan.method,
      } : null
    });

  } catch (error) {
    console.error('[BatchScan] Error getting status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get scan status'
    }, { status: 500 });
  }
}

// =============================================================================
// 🆕 Main Scan Function - Using scanSingleUserV2
// =============================================================================

async function runScanWithV2(
  scanLogId: string,
  forceRefresh: boolean,
  specificUserIds: string[] = []
): Promise<void> {
  const stats: ScanStats = {
    totalUsers: 0,
    usersProcessed: 0,
    malesProcessed: 0,
    femalesProcessed: 0,
    totalCandidatesScanned: 0,
    passedDealBreakers: 0,
    aiAnalyzed: 0,
    matchesFound: 0,
    newMatches: 0,
    updatedMatches: 0,
    startTime: Date.now(),
    errors: [],
  };

  try {
    console.log(`\n[BatchScan] 🚀 Starting scan with scanSingleUserV2...`);

    // ==========================================================================
    // שלב 1: שליפת כל המשתמשים הפעילים
    // ==========================================================================
    
    const users = await fetchActiveUsers(specificUserIds);
    stats.totalUsers = users.length;
    
    const males = users.filter(u => u.gender === 'MALE');
    const females = users.filter(u => u.gender === 'FEMALE');
    
    console.log(`[BatchScan] Found ${users.length} active users (${males.length} M, ${females.length} F)`);

    if (users.length === 0) {
      throw new Error('No active users to scan');
    }

    // עדכון הלוג
    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: { totalCandidates: users.length }
    });

    // ==========================================================================
    // שלב 2: סריקת כל משתמש עם scanSingleUserV2
    // ==========================================================================

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // לוג התקדמות
      if ((i + 1) % 10 === 0 || i === 0) {
        console.log(`\n[BatchScan] 📊 Progress: ${i + 1}/${users.length} (${Math.round((i + 1) / users.length * 100)}%)`);
        console.log(`  Current: ${user.firstName} ${user.lastName} (${user.gender})`);
        console.log(`  Matches found so far: ${stats.matchesFound}`);
      }

      try {
        // 🆕 שימוש ב-scanSingleUserV2
        const scanResult: ScanResult = await scanSingleUserV2(user.userId, {
          useVectors: true,
          useAIDeepAnalysis: true,
          maxCandidates: 100,
          forceUpdateMetrics: forceRefresh && i === 0, // עדכון מדדים רק בסריקה הראשונה
          skipCandidateMetricsUpdate: i > 0, // דילוג על עדכון מועמדים אחרי הראשון
        });
        
        // עדכון סטטיסטיקות
        stats.totalCandidatesScanned += scanResult.stats.totalCandidates;
        stats.passedDealBreakers += scanResult.stats.passedDealBreakers;
        stats.aiAnalyzed += scanResult.stats.aiAnalyzed;
        
        // שמירת התוצאות ל-DB
        const savedCount = await saveScanResults(scanResult);
        
        // עדכון מונים
const matchesAboveThreshold = scanResult.matches.filter(m => m.score >= MIN_SCORE_THRESHOLD).length;
        stats.matchesFound += matchesAboveThreshold;
        stats.newMatches += savedCount;
        
        if (user.gender === 'MALE') {
          stats.malesProcessed++;
        } else {
          stats.femalesProcessed++;
        }
        
        // הוספת שגיאות/אזהרות
        if (scanResult.errors.length > 0) {
          stats.errors.push(...scanResult.errors.map(e => `${user.firstName}: ${e}`));
        }
        
      } catch (error) {
        const errorMsg = `Error scanning ${user.firstName}: ${error}`;
        console.error(`[BatchScan] ❌ ${errorMsg}`);
        stats.errors.push(errorMsg);
      }

      stats.usersProcessed++;

      // עדכון progress בDB
      if ((i + 1) % PROGRESS_UPDATE_INTERVAL === 0) {
        await prisma.nightlyScanLog.update({
          where: { id: scanLogId },
          data: {
            candidatesScanned: stats.usersProcessed,
            matchesFound: stats.matchesFound,
            newMatches: stats.newMatches,
            updatedMatches: stats.updatedMatches,
          }
        });
      }

      // השהייה קטנה בין משתמשים למניעת עומס
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // ==========================================================================
    // שלב 3: סיום וסיכום
    // ==========================================================================

    const duration = Date.now() - stats.startTime;

    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: {
        status: 'completed',
        candidatesScanned: stats.usersProcessed,
        matchesFound: stats.matchesFound,
        newMatches: stats.newMatches,
        updatedMatches: stats.updatedMatches,
        durationMs: duration,
        completedAt: new Date(),
        error: stats.errors.length > 0 ? `${stats.errors.length} errors occurred` : null,
      }
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] ✅ Scan completed! (V3.0 - scanSingleUserV2)`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n📊 Final Statistics:`);
    console.log(`  Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  Users scanned: ${stats.usersProcessed}/${stats.totalUsers}`);
    console.log(`    - Males: ${stats.malesProcessed}`);
    console.log(`    - Females: ${stats.femalesProcessed}`);
    console.log(`  \n  Processing breakdown:`);
    console.log(`    - Total candidates evaluated: ${stats.totalCandidatesScanned}`);
    console.log(`    - Passed deal breakers: ${stats.passedDealBreakers}`);
    console.log(`    - AI analyzed: ${stats.aiAnalyzed}`);
    console.log(`  \n  Results:`);
    console.log(`    - Matches found (≥${MIN_SCORE_THRESHOLD}): ${stats.matchesFound}`);
    console.log(`    - New/Updated in DB: ${stats.newMatches}`);
    if (stats.errors.length > 0) {
      console.log(`  \n  ⚠️ Errors: ${stats.errors.length}`);
    }
    console.log(`\n${'='.repeat(70)}\n`);

  } catch (error) {
    console.error('[BatchScan] ❌ Scan failed:', error);

    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - stats.startTime,
        completedAt: new Date(),
      }
    });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

interface ActiveUser {
  userId: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
}

async function fetchActiveUsers(specificUserIds: string[] = []): Promise<ActiveUser[]> {
  const whereClause: any = {
    status: {
      in: [
        UserStatus.ACTIVE,
        UserStatus.PENDING_PHONE_VERIFICATION,
        UserStatus.PENDING_EMAIL_VERIFICATION,
      ]
    },
    profile: {
      availabilityStatus: {
        in: [AvailabilityStatus.AVAILABLE, AvailabilityStatus.PAUSED],
      },
      isProfileVisible: true,
    }
  };

  if (specificUserIds.length > 0) {
    whereClause.id = { in: specificUserIds };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profile: {
        select: {
          gender: true,
        }
      }
    }
  });

  return users
    .filter(u => u.profile?.gender)
    .map(u => ({
      userId: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      gender: u.profile!.gender as 'MALE' | 'FEMALE',
    }));
}