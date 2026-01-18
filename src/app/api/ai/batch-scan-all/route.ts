// =============================================================================
// 📁 src/app/api/ai/batch-scan-all/route.ts
// =============================================================================
// 🎯 Batch Scan All - סריקה לילית חכמה
// 
// גרסה: 2.0 - סריקה דיפרנציאלית
// 
// שיפורים עיקריים:
// 1. סריקה דיפרנציאלית - לא סורקים זוגות שלא השתנו
// 2. פילטר היסטוריה - לא מציעים זוגות עם דייט כושל
// 3. שמירה ב-ScannedPair - לכל זוג שנסרק (גם אם לא עבר)
// 4. תמיכה מלאה ב-MANUAL_ENTRY
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus } from "@prisma/client";
import { 
  findMatchesForUser,
  getCompatibleReligiousLevels,
  calculateAge,
} from "@/lib/services/matchingAlgorithmService";

// ייבוא הפונקציות החדשות
import {
  filterBlockedFemales,
  getFemalesToScan,
  saveScannedPairsBatch,
  getActiveUsersWhereClause,
  type ScannedPairResult,
  type RejectionReason,
} from "@/lib/services/matchingAlgorithmService";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_SCORE_THRESHOLD = 70;

// =============================================================================
// POST - התחלת סריקה לילית
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // אימות (אופציונלי - להוסיף לפי הצורך)
    // const session = await getServerSession();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json().catch(() => ({}));
    const { 
      method = 'algorithmic',
      forceRefresh = false, // אם true - מתעלם מסריקות קודמות
    } = body;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] 🌙 Starting Nightly Differential Scan`);
    console.log(`[BatchScan] Method: ${method}`);
    console.log(`[BatchScan] Force Refresh: ${forceRefresh}`);
    console.log(`${'='.repeat(70)}\n`);

    // בדיקה אם יש סריקה רצה כבר
    const runningScan = await prisma.nightlyScanLog.findFirst({
      where: { status: 'running' },
      orderBy: { startedAt: 'desc' }
    });

    if (runningScan) {
      console.log(`[BatchScan] ⚠️ Scan already running: ${runningScan.id}`);
      return NextResponse.json({
        success: false,
        status: 'already_running',
        scanId: runningScan.id,
        message: 'סריקה כבר רצה כרגע'
      });
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
        method,
        minScoreThreshold: MIN_SCORE_THRESHOLD,
      }
    });

    console.log(`[BatchScan] Created scan log: ${scanLog.id}`);

    // הפעלת הסריקה ברקע
    runDifferentialScan(scanLog.id, method, forceRefresh)
      .catch(err => {
        console.error(`[BatchScan] Background scan failed:`, err);
      });

    return NextResponse.json({
      success: true,
      scanId: scanLog.id,
      message: 'הסריקה החלה'
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
      // החזרת סטטוס סריקה ספציפית
      const scan = await prisma.nightlyScanLog.findUnique({
        where: { id: scanId }
      });

      if (!scan) {
        return NextResponse.json({ 
          success: false, 
          error: 'Scan not found' 
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        scan: {
          id: scan.id,
          status: scan.status,
          totalCandidates: scan.totalCandidates,
          candidatesScanned: scan.candidatesScanned,
          matchesFound: scan.matchesFound,
          newMatches: scan.newMatches,
          updatedMatches: scan.updatedMatches,
          durationMs: scan.durationMs,
          error: scan.error,
          startedAt: scan.startedAt,
          completedAt: scan.completedAt,
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
        durationMs: lastScan.durationMs,
        startedAt: lastScan.startedAt,
        completedAt: lastScan.completedAt,
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
// Background Scan Function - סריקה דיפרנציאלית
// =============================================================================

async function runDifferentialScan(
  scanLogId: string,
  method: string,
  forceRefresh: boolean
): Promise<void> {
  const startTime = Date.now();
  
  let totalCandidatesScanned = 0;
  let matchesFound = 0;
  let newMatches = 0;
  let updatedMatches = 0;
  const scannedPairsToSave: ScannedPairResult[] = [];

  try {
    console.log(`\n[BatchScan] 🚀 Starting differential scan...`);

    // ==========================================================================
    // שלב 1: שליפת כל הגברים הפעילים (כולל MANUAL_ENTRY)
    // ==========================================================================
    
    const males = await prisma.user.findMany({
      where: {
        ...getActiveUsersWhereClause(),
        profile: {
          gender: 'MALE',
          availabilityStatus: AvailabilityStatus.AVAILABLE,
          isProfileVisible: true,
          // חייב להיות תוכן
          OR: [
            { about: { not: null } },
            { manualEntryText: { not: null } },
          ]
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
            updatedAt: true,
          }
        }
      }
    });

    console.log(`[BatchScan] Found ${males.length} active males`);

    // עדכון הלוג
    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: { totalCandidates: males.length }
    });

    // ==========================================================================
    // שלב 2: שליפת כל הבחורות הפעילות (כולל MANUAL_ENTRY)
    // ==========================================================================

    const allFemales = await prisma.user.findMany({
      where: {
        ...getActiveUsersWhereClause(),
        profile: {
          gender: 'FEMALE',
          availabilityStatus: AvailabilityStatus.AVAILABLE,
          isProfileVisible: true,
          OR: [
            { about: { not: null } },
            { manualEntryText: { not: null } },
          ]
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
            updatedAt: true,
          }
        }
      }
    });

    console.log(`[BatchScan] Found ${allFemales.length} active females`);

    // ==========================================================================
    // שלב 3: סריקה לכל גבר
    // ==========================================================================

    for (let i = 0; i < males.length; i++) {
      const male = males[i];
      
      console.log(`\n[BatchScan] Processing male ${i + 1}/${males.length}: ${male.firstName} ${male.lastName}`);

      if (!male.profile?.birthDate) {
        console.log(`[BatchScan] Skipping - no birthDate`);
        continue;
      }

      const maleAge = calculateAge(male.profile.birthDate);
      const maleReligiousLevel = male.profile.religiousLevel;
      const maleProfileUpdatedAt = male.profile.updatedAt;

      // סינון ראשוני של בחורות לפי גיל ורמה דתית
      const compatibleReligious = getCompatibleReligiousLevels(maleReligiousLevel);
      
      const relevantFemales = allFemales.filter(female => {
        if (!female.profile) return false;
        
        // סינון רמה דתית (סלחני - אם אין, מכליל)
        if (female.profile.religiousLevel && 
            !compatibleReligious.includes(female.profile.religiousLevel)) {
          return false;
        }

        // סינון גיל (סלחני - אם אין, מכליל)
        if (female.profile.birthDate) {
          const femaleAge = calculateAge(female.profile.birthDate);
          const minAge = maleAge - 7;
          const maxAge = maleAge + 4;
          if (femaleAge < minAge || femaleAge > maxAge) {
            return false;
          }
        }

        return true;
      }).map(f => ({
        id: f.id,
        profileUpdatedAt: f.profile!.updatedAt,
      }));

      console.log(`[BatchScan] Relevant females after basic filter: ${relevantFemales.length}`);

      // ==========================================================================
      // שלב 3.1: סריקה דיפרנציאלית - מי באמת צריך סריקה?
      // ==========================================================================

      const scanResult = forceRefresh 
        ? {
            femalesToScan: relevantFemales.map(f => f.id),
            skippedByHistory: 0,
            skippedByNoChange: 0,
            stats: { total: relevantFemales.length, newPairs: relevantFemales.length, maleUpdated: 0, femaleUpdated: 0, bothUpdated: 0 }
          }
        : await getFemalesToScan(
            male.id,
            maleProfileUpdatedAt,
            relevantFemales
          );

      if (scanResult.femalesToScan.length === 0) {
        console.log(`[BatchScan] No females to scan for this male`);
        continue;
      }

      // ==========================================================================
      // שלב 3.2: הפעלת האלגוריתם עבור הבחורות שצריך לסרוק
      // ==========================================================================

      try {
        // TODO: כאן צריך לשנות את findMatchesForUser לקבל רשימת מועמדות ספציפית
        // בינתיים נשתמש בפונקציה הקיימת
        const result = await findMatchesForUser(male.id, 'system-scan', {
          forceRefresh: true,
          autoSave: false, // לא לשמור ב-SavedMatchSearch
        });

        totalCandidatesScanned += scanResult.femalesToScan.length;

        // עיבוד התוצאות
        for (const match of result.matches) {
          const score = match.finalScore || 0;
          const passedThreshold = score >= MIN_SCORE_THRESHOLD;

          // הכנת נתונים לשמירה ב-ScannedPair
          const femaleData = relevantFemales.find(f => f.id === match.userId);
          if (femaleData) {
            scannedPairsToSave.push({
              maleUserId: male.id,
              femaleUserId: match.userId,
              aiScore: score,
              passedThreshold,
              rejectionReason: passedThreshold ? null : 'low_ai_score',
              maleProfileUpdatedAt,
              femaleProfileUpdatedAt: femaleData.profileUpdatedAt,
            });
          }

          if (passedThreshold) {
            matchesFound++;

            // שמירה ב-PotentialMatch
            const saved = await saveToPotentialMatch(
              male.id,
              match.userId,
              match
            );

            if (saved === 'new') newMatches++;
            if (saved === 'updated') updatedMatches++;
          }
        }

        // שמירת בחורות שנסרקו אבל לא היו ב-matches (נפסלו לפני AI)
        for (const femaleId of scanResult.femalesToScan) {
          const alreadySaved = scannedPairsToSave.some(
            p => p.maleUserId === male.id && p.femaleUserId === femaleId
          );
          
          if (!alreadySaved) {
            const femaleData = relevantFemales.find(f => f.id === femaleId);
            if (femaleData) {
              scannedPairsToSave.push({
                maleUserId: male.id,
                femaleUserId: femaleId,
                aiScore: null,
                passedThreshold: false,
                rejectionReason: 'low_ai_score', // או סיבה אחרת
                maleProfileUpdatedAt,
                femaleProfileUpdatedAt: femaleData.profileUpdatedAt,
              });
            }
          }
        }

      } catch (error) {
        console.error(`[BatchScan] Error scanning male ${male.id}:`, error);
      }

      // עדכון progress
      await prisma.nightlyScanLog.update({
        where: { id: scanLogId },
        data: {
          candidatesScanned: i + 1,
          matchesFound,
          newMatches,
          updatedMatches,
        }
      });
    }

    // ==========================================================================
    // שלב 4: שמירת כל ה-ScannedPairs
    // ==========================================================================

    console.log(`\n[BatchScan] Saving ${scannedPairsToSave.length} scanned pairs...`);
    await saveScannedPairsBatch(scannedPairsToSave);

    // ==========================================================================
    // שלב 5: סיום
    // ==========================================================================

    const duration = Date.now() - startTime;

    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: {
        status: 'completed',
        candidatesScanned: males.length,
        matchesFound,
        newMatches,
        updatedMatches,
        durationMs: duration,
        completedAt: new Date(),
      }
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] ✅ Scan completed!`);
    console.log(`[BatchScan] Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`[BatchScan] Males scanned: ${males.length}`);
    console.log(`[BatchScan] Pairs scanned: ${totalCandidatesScanned}`);
    console.log(`[BatchScan] Matches found: ${matchesFound}`);
    console.log(`[BatchScan] New matches: ${newMatches}`);
    console.log(`[BatchScan] Updated matches: ${updatedMatches}`);
    console.log(`${'='.repeat(70)}\n`);

  } catch (error) {
    console.error('[BatchScan] ❌ Scan failed:', error);

    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      }
    });
  }
}

// =============================================================================
// Helper: שמירה ב-PotentialMatch
// =============================================================================

async function saveToPotentialMatch(
  maleUserId: string,
  femaleUserId: string,
  match: any
): Promise<'new' | 'updated' | 'unchanged'> {
  const score = match.finalScore || match.score || 0;

  try {
    const existing = await prisma.potentialMatch.findUnique({
      where: {
        maleUserId_femaleUserId: { maleUserId, femaleUserId }
      }
    });

    if (existing) {
      // עדכון אם הציון השתנה או שהסטטוס הוא EXPIRED
      if (Math.abs(existing.aiScore - score) > 2 || existing.status === 'EXPIRED') {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            aiScore: score,
            firstPassScore: match.firstPassScore || null,
            scoreBreakdown: match.scoreBreakdown || null,
            shortReasoning: match.shortReasoning || match.reasoning || null,
            detailedReasoning: match.detailedReasoning || null,
            backgroundCompatibility: match.backgroundCompatibility || null,
            backgroundMultiplier: match.backgroundMultiplier || null,
            scannedAt: new Date(),
            status: existing.status === 'EXPIRED' ? 'PENDING' : existing.status,
          }
        });
        return 'updated';
      }
      return 'unchanged';
    }

    // יצירת התאמה חדשה
    await prisma.potentialMatch.create({
      data: {
        maleUserId,
        femaleUserId,
        aiScore: score,
        firstPassScore: match.firstPassScore || null,
        scoreBreakdown: match.scoreBreakdown || null,
        shortReasoning: match.shortReasoning || match.reasoning || null,
        detailedReasoning: match.detailedReasoning || null,
        backgroundCompatibility: match.backgroundCompatibility || null,
        backgroundMultiplier: match.backgroundMultiplier || null,
        status: 'PENDING',
        scannedAt: new Date(),
      }
    });
    return 'new';

  } catch (error) {
    console.warn(`[BatchScan] Could not save PotentialMatch:`, error);
    return 'unchanged';
  }
}