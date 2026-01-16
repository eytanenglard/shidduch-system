// =============================================================================
// src/app/api/ai/batch-scan-all/route.ts
// API לסריקה לילית של כל המועמדים
// מופעל ע"י Heroku Scheduler או באופן ידני
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, AvailabilityStatus, PotentialMatchStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { findMatchesForUser } from "@/lib/services/matchingAlgorithmService";

// הגדרות
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות מקסימום

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_SCORE_THRESHOLD = 70; // ציון מינימלי להתאמה פוטנציאלית
const BATCH_SIZE = 10; // כמה מועמדים לעבד בכל batch
const CACHE_DAYS = 7; // כמה ימים לשמור cache
const MAX_MATCHES_PER_CANDIDATE = 15; // מקסימום התאמות לשמור לכל מועמד

// סטטוסים שחוסמים הצעות חדשות
const BLOCKING_SUGGESTION_STATUSES = [
  'FIRST_PARTY_APPROVED',
  'SECOND_PARTY_APPROVED',
  'AWAITING_MATCHMAKER_APPROVAL',
  'CONTACT_DETAILS_SHARED',
  'AWAITING_FIRST_DATE_FEEDBACK',
  'THINKING_AFTER_DATE',
  'PROCEEDING_TO_SECOND_DATE',
  'MEETING_PENDING',
  'MEETING_SCHEDULED',
  'MATCH_APPROVED',
  'DATING',
  'ENGAGED',
  'MARRIED',
];

// =============================================================================
// TYPES
// =============================================================================

interface ScanResult {
  candidateId: string;
  matchesFound: number;
  newMatches: number;
  updatedMatches: number;
  error?: string;
}

// =============================================================================
// POST - התחלת סריקה לילית
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  let scanLogId: string | null = null;

  try {
    // 1. אימות - או Cron Secret או Session של Admin/Matchmaker
    const cronSecret = req.headers.get('x-cron-secret');
    const internalSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_SECRET;
    
    let isAuthorized = false;
    let triggeredBy = 'system';

    if (cronSecret && internalSecret && cronSecret === internalSecret) {
      isAuthorized = true;
      triggeredBy = 'cron';
      console.log('[BatchScan] ✅ Authorized via Cron Secret');
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user?.id && 
          (session.user.role === UserRole.ADMIN || session.user.role === UserRole.MATCHMAKER)) {
        isAuthorized = true;
        triggeredBy = session.user.email || session.user.id;
        console.log(`[BatchScan] ✅ Authorized via Session: ${triggeredBy}`);
      }
    }

    if (!isAuthorized) {
      console.warn('[BatchScan] ❌ Unauthorized access attempt');
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // 2. פרסור הבקשה
    let body: {
      method?: string;
      minScoreThreshold?: number;
      maxCandidates?: number;
      forceRefresh?: boolean;
    } = {};
    
    try {
      body = await req.json();
    } catch {
      // אם אין body, נשתמש בברירות מחדל
    }

    const {
      method = 'algorithmic',
      minScoreThreshold = MIN_SCORE_THRESHOLD,
      maxCandidates,
      forceRefresh = false,
    } = body;

    // 3. בדיקה אם יש סריקה פעילה
    const activeScan = await prisma.nightlyScanLog.findFirst({
      where: {
        status: 'running',
        startedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // שעה אחרונה
        }
      }
    });

    if (activeScan) {
      console.log(`[BatchScan] ⚠️ Scan already running: ${activeScan.id}`);
      return NextResponse.json({
        success: false,
        status: 'already_running',
        scanId: activeScan.id,
        message: 'סריקה כבר רצה כרגע. נסה שוב מאוחר יותר.'
      });
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] 🌙 Starting Nightly Batch Scan`);
    console.log(`[BatchScan] Triggered by: ${triggeredBy}`);
    console.log(`[BatchScan] Method: ${method}, Min Score: ${minScoreThreshold}`);
    console.log(`${'='.repeat(70)}\n`);

    // 4. שליפת כל המועמדים הפעילים
    // ✅ תוקן: הסרת isNot: null מתוך profile ושימוש ישיר בסינון availabilityStatus
    const candidates = await prisma.user.findMany({
      where: {
        role: UserRole.CANDIDATE,
        status: { notIn: ['BLOCKED', 'INACTIVE'] },
        profile: {
          availabilityStatus: { in: [AvailabilityStatus.AVAILABLE] }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profile: {
          select: {
            gender: true,
            religiousLevel: true,
          }
        }
      },
      take: maxCandidates, // אם הוגדר הגבלה
    });

    if (candidates.length === 0) {
      console.log('[BatchScan] ⚠️ No candidates found');
      return NextResponse.json({
        success: true,
        status: 'completed',
        message: 'לא נמצאו מועמדים לסריקה',
        stats: { total: 0, scanned: 0, matchesFound: 0 }
      });
    }

    console.log(`[BatchScan] 📊 Found ${candidates.length} candidates to scan`);

    // 5. יצירת לוג סריקה
    const scanLog = await prisma.nightlyScanLog.create({
      data: {
        totalCandidates: candidates.length,
        candidatesScanned: 0,
        matchesFound: 0,
        newMatches: 0,
        updatedMatches: 0,
        startedAt: new Date(),
        status: 'running',
        method,
        minScoreThreshold,
      }
    });
    scanLogId = scanLog.id;

    console.log(`[BatchScan] 📝 Created scan log: ${scanLogId}`);

    // 6. שליפת הצעות פעילות (לסימון אזהרות)
    const activeSuggestions = await prisma.matchSuggestion.findMany({
      where: {
        status: { in: BLOCKING_SUGGESTION_STATUSES as any }
      },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: { select: { firstName: true, lastName: true } },
        secondParty: { select: { firstName: true, lastName: true } },
        createdAt: true,
      }
    });

    // יצירת מפה של הצעות פעילות לפי userId
    const activeSuggestionMap = new Map<string, {
      suggestionId: string;
      status: string;
      withCandidateName: string;
      withCandidateId: string;
      createdAt: Date;
    }>();

    for (const suggestion of activeSuggestions) {
      activeSuggestionMap.set(suggestion.firstPartyId, {
        suggestionId: suggestion.id,
        status: suggestion.status,
        withCandidateName: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`,
        withCandidateId: suggestion.secondPartyId,
        createdAt: suggestion.createdAt,
      });
      activeSuggestionMap.set(suggestion.secondPartyId, {
        suggestionId: suggestion.id,
        status: suggestion.status,
        withCandidateName: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`,
        withCandidateId: suggestion.firstPartyId,
        createdAt: suggestion.createdAt,
      });
    }

    console.log(`[BatchScan] 🚨 Found ${activeSuggestionMap.size} users with active suggestions`);

    // 7. עיבוד המועמדים ב-batches
    let totalMatchesFound = 0;
    let totalNewMatches = 0;
    let totalUpdatedMatches = 0;
    let candidatesScanned = 0;
    const errors: string[] = [];

    // נעבד רק גברים (כי כל גבר ייסרק מול כל הנשים)
    // כעת, כשהשאילתה למעלה תקינה, TypeScript יזהה שיש שדה profile
    const maleCandidates = candidates.filter(c => c.profile?.gender === 'MALE');
    console.log(`[BatchScan] 👨 Processing ${maleCandidates.length} male candidates`);

    for (let i = 0; i < maleCandidates.length; i += BATCH_SIZE) {
      const batch = maleCandidates.slice(i, i + BATCH_SIZE);
      
      console.log(`\n[BatchScan] 📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(maleCandidates.length / BATCH_SIZE)}`);

      for (const candidate of batch) {
        try {
          const result = await processCandidate(
            candidate.id,
            candidate.firstName,
            candidate.lastName,
            minScoreThreshold,
            forceRefresh,
            activeSuggestionMap
          );

          totalMatchesFound += result.matchesFound;
          totalNewMatches += result.newMatches;
          totalUpdatedMatches += result.updatedMatches;
          candidatesScanned++;

          if (result.error) {
            errors.push(`${candidate.firstName} ${candidate.lastName}: ${result.error}`);
          }

          console.log(`[BatchScan] ✓ ${candidate.firstName} ${candidate.lastName}: ${result.matchesFound} matches (${result.newMatches} new)`);

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${candidate.firstName} ${candidate.lastName}: ${errorMsg}`);
          console.error(`[BatchScan] ✗ Error processing ${candidate.firstName} ${candidate.lastName}:`, error);
        }
      }

      // עדכון התקדמות בלוג
      await prisma.nightlyScanLog.update({
        where: { id: scanLogId },
        data: {
          candidatesScanned,
          matchesFound: totalMatchesFound,
          newMatches: totalNewMatches,
          updatedMatches: totalUpdatedMatches,
        }
      });

      // המתנה קצרה בין batches למניעת עומס
      if (i + BATCH_SIZE < maleCandidates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 8. סימון התאמות ישנות כפגי תוקף
    const expiredCount = await markExpiredMatches();
    console.log(`[BatchScan] ⏰ Marked ${expiredCount} old matches as expired`);

    // 9. סיום הסריקה
    const duration = Date.now() - startTime;
    const status = errors.length === 0 ? 'completed' : (errors.length < candidatesScanned ? 'partial' : 'failed');

    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: {
        status,
        completedAt: new Date(),
        durationMs: duration,
        candidatesScanned,
        matchesFound: totalMatchesFound,
        newMatches: totalNewMatches,
        updatedMatches: totalUpdatedMatches,
        error: errors.length > 0 ? errors.join('\n') : null,
      }
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] 🏁 Scan Completed!`);
    console.log(`[BatchScan] Status: ${status}`);
    console.log(`[BatchScan] Candidates scanned: ${candidatesScanned}/${maleCandidates.length}`);
    console.log(`[BatchScan] Matches found: ${totalMatchesFound}`);
    console.log(`[BatchScan] New matches: ${totalNewMatches}`);
    console.log(`[BatchScan] Updated matches: ${totalUpdatedMatches}`);
    console.log(`[BatchScan] Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    if (errors.length > 0) {
      console.log(`[BatchScan] Errors: ${errors.length}`);
    }
    console.log(`${'='.repeat(70)}\n`);

    return NextResponse.json({
      success: true,
      status,
      scanId: scanLogId,
      stats: {
        totalCandidates: maleCandidates.length,
        candidatesScanned,
        matchesFound: totalMatchesFound,
        newMatches: totalNewMatches,
        updatedMatches: totalUpdatedMatches,
        expiredMatches: expiredCount,
        durationMs: duration,
        durationMinutes: (duration / 1000 / 60).toFixed(2),
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[BatchScan] ❌ Critical Error:', error);

    // עדכון לוג עם השגיאה
    if (scanLogId) {
      await prisma.nightlyScanLog.update({
        where: { id: scanLogId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }).catch(e => console.error('[BatchScan] Failed to update scan log:', e));
    }

    return NextResponse.json({
      success: false,
      status: 'failed',
      scanId: scanLogId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// =============================================================================
// GET - בדיקת סטטוס סריקה / סריקות אחרונות
// =============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // אימות
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.MATCHMAKER) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('scanId');

    // אם יש scanId - החזר סטטוס ספציפי
    if (scanId) {
      const scanLog = await prisma.nightlyScanLog.findUnique({
        where: { id: scanId }
      });

      if (!scanLog) {
        return NextResponse.json({ success: false, error: "Scan not found" }, { status: 404 });
      }

      const progress = scanLog.totalCandidates > 0 
        ? Math.round((scanLog.candidatesScanned / scanLog.totalCandidates) * 100)
        : 0;

      return NextResponse.json({
        success: true,
        scan: {
          id: scanLog.id,
          status: scanLog.status,
          progress,
          totalCandidates: scanLog.totalCandidates,
          candidatesScanned: scanLog.candidatesScanned,
          matchesFound: scanLog.matchesFound,
          newMatches: scanLog.newMatches,
          startedAt: scanLog.startedAt,
          completedAt: scanLog.completedAt,
          durationMs: scanLog.durationMs,
          error: scanLog.error,
        }
      });
    }

    // אחרת - החזר סיכום סריקות אחרונות
    const recentScans = await prisma.nightlyScanLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        totalCandidates: true,
        candidatesScanned: true,
        matchesFound: true,
        newMatches: true,
        startedAt: true,
        completedAt: true,
        durationMs: true,
      }
    });

    // סטטיסטיקות התאמות פוטנציאליות
    const matchStats = await prisma.potentialMatch.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const stats = {
      pending: 0,
      reviewed: 0,
      sent: 0,
      dismissed: 0,
      expired: 0,
    };

    for (const stat of matchStats) {
      const status = stat.status.toLowerCase() as keyof typeof stats;
      if (status in stats) {
        stats[status] = stat._count.id;
      }
    }

    return NextResponse.json({
      success: true,
      recentScans,
      stats: {
        ...stats,
        total: Object.values(stats).reduce((a, b) => a + b, 0),
      }
    });

  } catch (error) {
    console.error('[BatchScan] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * מעבד מועמד בודד - מריץ את האלגוריתם ושומר התאמות
 */
async function processCandidate(
  candidateId: string,
  firstName: string,
  lastName: string,
  minScoreThreshold: number,
  forceRefresh: boolean,
  activeSuggestionMap: Map<string, any>
): Promise<ScanResult> {
  
  // 1. בדיקת cache
  if (!forceRefresh) {
    const recentJob = await prisma.matchingJob.findFirst({
      where: {
        targetUserId: candidateId,
        method: 'algorithmic',
        status: 'completed',
        completedAt: {
          gte: new Date(Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    if (recentJob && recentJob.result) {
      // יש cache - נעדכן את טבלת PotentialMatch בלבד
      const matches = recentJob.result as any[];
      return await savePotentialMatches(
        candidateId,
        matches,
        minScoreThreshold,
        activeSuggestionMap,
        true // fromCache
      );
    }
  }

  // 2. הרצת האלגוריתם
  const result = await findMatchesForUser(
    candidateId,
    'SYSTEM', // matchmakerId
    { forceRefresh: false, autoSave: false }
  );

  if (!result || !result.matches || result.matches.length === 0) {
    return { candidateId, matchesFound: 0, newMatches: 0, updatedMatches: 0 };
  }

  // 3. שמירה ב-MatchingJob (לשמור תאימות עם המערכת הקיימת)
  await prisma.matchingJob.create({
    data: {
      targetUserId: candidateId,
      matchmakerId: 'SYSTEM',
      method: 'nightly-scan',
      status: 'completed',
      progress: 100,
      progressMessage: `נמצאו ${result.matches.length} התאמות`,
      result: result.matches as any,
      matchesFound: result.matches.length,
      totalCandidates: result.meta?.totalCandidatesScanned || 0,
      completedAt: new Date(),
    }
  });

  // 4. שמירה ב-PotentialMatch
  return await savePotentialMatches(
    candidateId,
    result.matches,
    minScoreThreshold,
    activeSuggestionMap,
    false // fromCache
  );
}

/**
 * שומר התאמות פוטנציאליות בטבלה
 */
async function savePotentialMatches(
  maleUserId: string,
  matches: any[],
  minScoreThreshold: number,
  activeSuggestionMap: Map<string, any>,
  fromCache: boolean
): Promise<ScanResult> {
  
  let newMatches = 0;
  let updatedMatches = 0;

  // סינון לפי ציון מינימלי
  const qualifiedMatches = matches
    .filter(m => (m.finalScore || m.score || 0) >= minScoreThreshold)
    .slice(0, MAX_MATCHES_PER_CANDIDATE);

  for (const match of qualifiedMatches) {
    const femaleUserId = match.userId;
    const aiScore = match.finalScore || match.score || 0;

    try {
      // בדיקה אם כבר קיימת התאמה
      const existing = await prisma.potentialMatch.findUnique({
        where: {
          maleUserId_femaleUserId: { maleUserId, femaleUserId }
        }
      });

      if (existing) {
        // עדכון התאמה קיימת (רק אם הציון השתנה משמעותית)
        if (Math.abs(existing.aiScore - aiScore) > 2 || existing.status === PotentialMatchStatus.EXPIRED) {
          await prisma.potentialMatch.update({
            where: { id: existing.id },
            data: {
              aiScore,
              firstPassScore: match.firstPassScore,
              scoreBreakdown: match.scoreBreakdown as any,
              shortReasoning: match.shortReasoning,
              detailedReasoning: match.detailedReasoning,
              backgroundCompatibility: match.backgroundCompatibility,
              backgroundMultiplier: match.backgroundMultiplier,
              scannedAt: new Date(),
              status: existing.status === PotentialMatchStatus.EXPIRED ? PotentialMatchStatus.PENDING : existing.status,
            }
          });
          updatedMatches++;
        }
      } else {
        // יצירת התאמה חדשה
        await prisma.potentialMatch.create({
          data: {
            maleUserId,
            femaleUserId,
            aiScore,
            firstPassScore: match.firstPassScore,
            scoreBreakdown: match.scoreBreakdown as any,
            shortReasoning: match.shortReasoning,
            detailedReasoning: match.detailedReasoning,
            backgroundCompatibility: match.backgroundCompatibility,
            backgroundMultiplier: match.backgroundMultiplier,
            status: PotentialMatchStatus.PENDING,
            scannedAt: new Date(),
          }
        });
        newMatches++;
      }
    } catch (error) {
      // התעלם משגיאות יחידות (ייתכן שהמשתמש נמחק)
      console.warn(`[BatchScan] Could not save match ${maleUserId} -> ${femaleUserId}:`, error);
    }
  }

  return {
    candidateId: maleUserId,
    matchesFound: qualifiedMatches.length,
    newMatches,
    updatedMatches,
  };
}

/**
 * סימון התאמות ישנות כפגי תוקף
 */
async function markExpiredMatches(): Promise<number> {
  const expireDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 ימים

  const result = await prisma.potentialMatch.updateMany({
    where: {
      status: PotentialMatchStatus.PENDING,
      scannedAt: { lt: expireDate }
    },
    data: {
      status: PotentialMatchStatus.EXPIRED
    }
  });

  return result.count;
}