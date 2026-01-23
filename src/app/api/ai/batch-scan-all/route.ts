// =============================================================================
// 📁 src/app/api/ai/batch-scan-all/route.ts
// =============================================================================
// 🎯 Batch Scan All - סריקה לילית חכמה V2.1
// 
// 🆕 שיפורים בגרסה זו:
// 1. ✅ סריקה דיפרנציאלית אמיתית - סורק רק זוגות שצריך!
// 2. ✅ Progress טוב יותר - כולל אחוז מדויק ואומדן זמן
// 3. ✅ לוגים מפורטים יותר
// 4. ✅ סטטיסטיקות מפורטות למעקב
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Gender, AvailabilityStatus } from "@prisma/client";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  getCompatibleReligiousLevels,
  calculateAge,
  calculateAgeScore,
  createBackgroundProfile,
  calculateBackgroundMatch,
  filterBlockedFemales,
  saveScannedPairsBatch,
  getActiveUsersWhereClause,
  type ScannedPairResult,
} from "@/lib/services/matchingAlgorithmService";
import profileAiService from "@/lib/services/profileAiService";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות

// =============================================================================
// CONSTANTS
// =============================================================================

const MIN_SCORE_THRESHOLD = 70;
const BATCH_SIZE = 15; // כמה בחורות לשלוח ל-AI בכל קריאה
const PROGRESS_UPDATE_INTERVAL = 5; // עדכון progress כל X גברים

// =============================================================================
// TYPES
// =============================================================================

interface ScanStats {
  totalMales: number;
  malesProcessed: number;
  totalPairsToScan: number;
  pairsScanned: number;
  pairsSkippedByHistory: number;
  pairsSkippedByNoChange: number;
  pairsSkippedByAgeGap: number;
  pairsSkippedByReligion: number;
  matchesFound: number;
  newMatches: number;
  updatedMatches: number;
  aiCallsCount: number;
  startTime: number;
}

// =============================================================================
// POST - התחלת סריקה לילית
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      method = 'algorithmic',
      forceRefresh = false,
    } = body;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] 🌙 Starting Nightly Differential Scan V2.1`);
    console.log(`[BatchScan] Method: ${method}`);
    console.log(`[BatchScan] Force Refresh: ${forceRefresh}`);
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
        method,
        minScoreThreshold: MIN_SCORE_THRESHOLD,
      }
    });

    console.log(`[BatchScan] Created scan log: ${scanLog.id}`);

    // הפעלת הסריקה ברקע
    runOptimizedDifferentialScan(scanLog.id, method, forceRefresh)
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
// GET - בדיקת סטטוס סריקה (משופר!)
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
          progress, // 🆕 אחוז התקדמות
          totalCandidates: scan.totalCandidates,
          candidatesScanned: scan.candidatesScanned,
          matchesFound: scan.matchesFound,
          newMatches: scan.newMatches,
          updatedMatches: scan.updatedMatches,
          durationMs: scan.durationMs,
          estimatedRemainingMinutes, // 🆕 אומדן זמן שנותר
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
// 🆕 Optimized Differential Scan - סריקה דיפרנציאלית אמיתית!
// =============================================================================

async function runOptimizedDifferentialScan(
  scanLogId: string,
  method: string,
  forceRefresh: boolean
): Promise<void> {
  const stats: ScanStats = {
    totalMales: 0,
    malesProcessed: 0,
    totalPairsToScan: 0,
    pairsScanned: 0,
    pairsSkippedByHistory: 0,
    pairsSkippedByNoChange: 0,
    pairsSkippedByAgeGap: 0,
    pairsSkippedByReligion: 0,
    matchesFound: 0,
    newMatches: 0,
    updatedMatches: 0,
    aiCallsCount: 0,
    startTime: Date.now(),
  };

  const scannedPairsToSave: ScannedPairResult[] = [];

  try {
    console.log(`\n[BatchScan] 🚀 Starting optimized differential scan...`);

    // ==========================================================================
    // שלב 1: שליפת כל הגברים והבחורות הפעילים
    // ==========================================================================
    
    const males = await fetchActiveMales();
    const allFemales = await fetchActiveFemales();
    
    stats.totalMales = males.length;
    
    console.log(`[BatchScan] Found ${males.length} active males`);
    console.log(`[BatchScan] Found ${allFemales.length} active females`);
    console.log(`[BatchScan] Maximum possible pairs: ${males.length * allFemales.length}`);

    // ==========================================================================
    // שלב 2: שליפת כל ה-ScannedPairs הקיימים בבת אחת (לחיסכון בשאילתות)
    // ==========================================================================

    const existingScannedPairs = await prisma.scannedPair.findMany({
      select: {
        maleUserId: true,
        femaleUserId: true,
        maleProfileUpdatedAt: true,
        femaleProfileUpdatedAt: true,
        passedThreshold: true,
        lastScannedAt: true,
      }
    });

    // יצירת מפה לגישה מהירה
    const scannedPairsMap = new Map<string, typeof existingScannedPairs[0]>();
    for (const pair of existingScannedPairs) {
      scannedPairsMap.set(`${pair.maleUserId}_${pair.femaleUserId}`, pair);
    }

    console.log(`[BatchScan] Loaded ${existingScannedPairs.length} existing scanned pairs`);

    // ==========================================================================
    // שלב 3: שליפת כל ההיסטוריה החוסמת בבת אחת
    // ==========================================================================

    const maleIds = males.map(m => m.id);
    const femaleIds = allFemales.map(f => f.id);

    const { blockedPairsSet } = await fetchAllBlockingHistory(maleIds, femaleIds);
    
    console.log(`[BatchScan] Found ${blockedPairsSet.size} blocked pairs from history`);

    // עדכון הלוג
    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: { totalCandidates: males.length }
    });

    // ==========================================================================
    // שלב 4: סריקה חכמה לכל גבר
    // ==========================================================================

    for (let maleIndex = 0; maleIndex < males.length; maleIndex++) {
      const male = males[maleIndex];
      
      if (!male.profile?.birthDate) {
        console.log(`[BatchScan] Skipping male ${male.firstName} - no birthDate`);
        continue;
      }

      const maleAge = calculateAge(male.profile.birthDate);
      const maleReligiousLevel = male.profile.religiousLevel;
      const maleProfileUpdatedAt = male.profile.updatedAt;
      const compatibleReligious = getCompatibleReligiousLevels(maleReligiousLevel);

      // מציאת בחורות שצריכות סריקה
      const femalesToScan: typeof allFemales = [];

      for (const female of allFemales) {
        if (!female.profile) continue;

        // 1. בדיקת היסטוריה חוסמת
        const pairKey = `${male.id}_${female.id}`;
        if (blockedPairsSet.has(pairKey)) {
          stats.pairsSkippedByHistory++;
          continue;
        }

        // 2. בדיקת רמה דתית
        if (female.profile.religiousLevel && 
            !compatibleReligious.includes(female.profile.religiousLevel)) {
          stats.pairsSkippedByReligion++;
          continue;
        }

        // 3. בדיקת גיל
        if (female.profile.birthDate) {
          const femaleAge = calculateAge(female.profile.birthDate);
          const ageScore = calculateAgeScore(maleAge, femaleAge);
          if (!ageScore.eligible) {
            stats.pairsSkippedByAgeGap++;
            continue;
          }
        }

        // 4. בדיקה דיפרנציאלית - האם צריך לסרוק מחדש?
        if (!forceRefresh) {
          const existingPair = scannedPairsMap.get(pairKey);
          if (existingPair) {
            const maleUpdated = maleProfileUpdatedAt > (existingPair.maleProfileUpdatedAt || new Date(0));
            const femaleUpdated = female.profile.updatedAt > (existingPair.femaleProfileUpdatedAt || new Date(0));
            
            if (!maleUpdated && !femaleUpdated) {
              stats.pairsSkippedByNoChange++;
              continue;
            }
          }
        }

        // עברה את כל הבדיקות - צריך לסרוק!
        femalesToScan.push(female);
      }

      stats.totalPairsToScan += femalesToScan.length;

      // לוג התקדמות
      if ((maleIndex + 1) % 10 === 0 || maleIndex === 0) {
        console.log(`\n[BatchScan] 📊 Progress Report:`);
        console.log(`  Males: ${maleIndex + 1}/${males.length} (${Math.round((maleIndex + 1) / males.length * 100)}%)`);
        console.log(`  Current: ${male.firstName} ${male.lastName} -> ${femalesToScan.length} females to scan`);
        console.log(`  Stats: skipped ${stats.pairsSkippedByHistory} history, ${stats.pairsSkippedByNoChange} unchanged, ${stats.pairsSkippedByAgeGap} age, ${stats.pairsSkippedByReligion} religion`);
        console.log(`  Matches found so far: ${stats.matchesFound}`);
      }

      if (femalesToScan.length === 0) {
        stats.malesProcessed++;
        continue;
      }

      // ==========================================================================
      // שלב 4.1: סריקת AI רק לזוגות שצריך!
      // ==========================================================================

      try {
        // הכנת פרופיל הגבר
        const maleNarrativeProfile = await buildNarrativeProfile(male);
        const maleBackgroundProfile = createBackgroundProfile(
          male.profile.nativeLanguage,
          male.profile.additionalLanguages || [],
          male.profile.aliyaCountry,
          male.profile.aliyaYear,
          male.profile.origin,
          male.profile.about,
          male.profile.matchingNotes
        );

        // סריקת בחורות ב-batches
        for (let i = 0; i < femalesToScan.length; i += BATCH_SIZE) {
          const batch = femalesToScan.slice(i, i + BATCH_SIZE);
          
          const batchResults = await scanBatchWithAI(
            male,
            maleNarrativeProfile,
            maleBackgroundProfile,
            maleAge,
            batch
          );

          stats.aiCallsCount++;
          stats.pairsScanned += batch.length;

          // עיבוד תוצאות
          for (const result of batchResults) {
            const passedThreshold = result.score >= MIN_SCORE_THRESHOLD;

            // שמירה ב-ScannedPair
            scannedPairsToSave.push({
              maleUserId: male.id,
              femaleUserId: result.femaleId,
              aiScore: result.score,
              passedThreshold,
              rejectionReason: passedThreshold ? null : 'low_ai_score',
              maleProfileUpdatedAt,
              femaleProfileUpdatedAt: result.femaleProfileUpdatedAt,
            });

            if (passedThreshold) {
              stats.matchesFound++;

              const saved = await saveToPotentialMatch(
                male.id,
                result.femaleId,
                result
              );

              if (saved === 'new') stats.newMatches++;
              if (saved === 'updated') stats.updatedMatches++;
            }
          }
        }

      } catch (error) {
        console.error(`[BatchScan] Error scanning male ${male.id}:`, error);
      }

      stats.malesProcessed++;

      // עדכון progress בDB
      if ((maleIndex + 1) % PROGRESS_UPDATE_INTERVAL === 0) {
        await prisma.nightlyScanLog.update({
          where: { id: scanLogId },
          data: {
            candidatesScanned: stats.malesProcessed,
            matchesFound: stats.matchesFound,
            newMatches: stats.newMatches,
            updatedMatches: stats.updatedMatches,
          }
        });
      }
    }

    // ==========================================================================
    // שלב 5: שמירת כל ה-ScannedPairs
    // ==========================================================================

    console.log(`\n[BatchScan] 💾 Saving ${scannedPairsToSave.length} scanned pairs...`);
    await saveScannedPairsBatch(scannedPairsToSave);

    // ==========================================================================
    // שלב 6: סיום וסיכום
    // ==========================================================================

    const duration = Date.now() - stats.startTime;

    await prisma.nightlyScanLog.update({
      where: { id: scanLogId },
      data: {
        status: 'completed',
        candidatesScanned: stats.malesProcessed,
        matchesFound: stats.matchesFound,
        newMatches: stats.newMatches,
        updatedMatches: stats.updatedMatches,
        durationMs: duration,
        completedAt: new Date(),
      }
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[BatchScan] ✅ Scan completed!`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n📊 Final Statistics:`);
    console.log(`  Duration: ${(duration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`  Males scanned: ${stats.malesProcessed}/${stats.totalMales}`);
    console.log(`  \n  Pairs breakdown:`);
    console.log(`    - Total potential: ${stats.totalMales * allFemales.length}`);
    console.log(`    - Skipped (history): ${stats.pairsSkippedByHistory}`);
    console.log(`    - Skipped (unchanged): ${stats.pairsSkippedByNoChange}`);
    console.log(`    - Skipped (age gap): ${stats.pairsSkippedByAgeGap}`);
    console.log(`    - Skipped (religion): ${stats.pairsSkippedByReligion}`);
    console.log(`    - Actually scanned: ${stats.pairsScanned}`);
    console.log(`  \n  Results:`);
    console.log(`    - AI calls made: ${stats.aiCallsCount}`);
    console.log(`    - Matches found (≥70): ${stats.matchesFound}`);
    console.log(`    - New matches: ${stats.newMatches}`);
    console.log(`    - Updated matches: ${stats.updatedMatches}`);
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

async function fetchActiveMales() {
  return prisma.user.findMany({
    where: {
      ...getActiveUsersWhereClause(),
      profile: {
        gender: 'MALE',
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
          nativeLanguage: true,
          additionalLanguages: true,
          aliyaCountry: true,
          aliyaYear: true,
          origin: true,
          about: true,
          matchingNotes: true,
          city: true,
          occupation: true,
          aiProfileSummary: true,
        }
      }
    }
  });
}

async function fetchActiveFemales() {
  return prisma.user.findMany({
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
          nativeLanguage: true,
          additionalLanguages: true,
          aliyaCountry: true,
          aliyaYear: true,
          origin: true,
          about: true,
          matchingNotes: true,
          city: true,
          occupation: true,
          aiProfileSummary: true,
        }
      }
    }
  });
}

async function fetchAllBlockingHistory(
  maleIds: string[],
  femaleIds: string[]
): Promise<{ blockedPairsSet: Set<string> }> {
  const blockedPairsSet = new Set<string>();

  // 1. MatchSuggestions שנכשלו
  const blockingSuggestions = await prisma.matchSuggestion.findMany({
    where: {
      status: { 
        in: [
          'ENDED_AFTER_FIRST_DATE',
          'MATCH_DECLINED',
          'FIRST_PARTY_DECLINED',
          'SECOND_PARTY_DECLINED',
          'CLOSED',
          'CANCELLED',
          'EXPIRED'
        ] 
      },
      OR: [
        { firstPartyId: { in: maleIds }, secondPartyId: { in: femaleIds } },
        { firstPartyId: { in: femaleIds }, secondPartyId: { in: maleIds } },
      ]
    },
    select: {
      firstPartyId: true,
      secondPartyId: true,
    }
  });

  for (const s of blockingSuggestions) {
    // מוסיף את שני הכיוונים
    blockedPairsSet.add(`${s.firstPartyId}_${s.secondPartyId}`);
    blockedPairsSet.add(`${s.secondPartyId}_${s.firstPartyId}`);
  }

  // 2. PotentialMatches שנדחו
  const dismissedMatches = await prisma.potentialMatch.findMany({
    where: {
      maleUserId: { in: maleIds },
      femaleUserId: { in: femaleIds },
      status: 'DISMISSED'
    },
    select: {
      maleUserId: true,
      femaleUserId: true,
    }
  });

  for (const m of dismissedMatches) {
    blockedPairsSet.add(`${m.maleUserId}_${m.femaleUserId}`);
  }

  return { blockedPairsSet };
}

async function buildNarrativeProfile(user: any): Promise<string> {
  const p = user.profile;
  if (!p) return '';

  // אם יש סיכום AI - נשתמש בו
  if (p.aiProfileSummary?.personalitySummary) {
    return `
שם: ${user.firstName} ${user.lastName}
גיל: ${p.birthDate ? calculateAge(p.birthDate) : 'לא ידוע'}
עיר: ${p.city || 'לא צוין'}
עיסוק: ${p.occupation || 'לא צוין'}
רמה דתית: ${p.religiousLevel || 'לא צוין'}

=== סיכום אישיות ===
${p.aiProfileSummary.personalitySummary}

=== מה מחפש/ת ===
${p.aiProfileSummary.lookingForSummary || 'לא צוין'}

=== על עצמי ===
${p.about || p.manualEntryText || 'לא צוין'}
    `.trim();
  }

  // אחרת - נבנה מהנתונים הקיימים
  return `
שם: ${user.firstName} ${user.lastName}
גיל: ${p.birthDate ? calculateAge(p.birthDate) : 'לא ידוע'}
עיר: ${p.city || 'לא צוין'}
עיסוק: ${p.occupation || 'לא צוין'}
רמה דתית: ${p.religiousLevel || 'לא צוין'}

=== על עצמי ===
${p.about || p.manualEntryText || 'לא צוין'}

=== הערות שדכן ===
${p.matchingNotes || 'אין'}
  `.trim();
}

interface BatchScanResult {
  femaleId: string;
  score: number;
  reasoning: string;
  femaleProfileUpdatedAt: Date;
}

async function scanBatchWithAI(
  male: any,
  maleNarrativeProfile: string,
  maleBackgroundProfile: any,
  maleAge: number,
  females: any[]
): Promise<BatchScanResult[]> {
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

  // בניית פרופילים של הבחורות
  const candidatesText = females.map((female, index) => {
    const femaleAge = female.profile?.birthDate 
      ? calculateAge(female.profile.birthDate) 
      : null;
    
    const femaleBackgroundProfile = createBackgroundProfile(
      female.profile?.nativeLanguage,
      female.profile?.additionalLanguages || [],
      female.profile?.aliyaCountry,
      female.profile?.aliyaYear,
      female.profile?.origin,
      female.profile?.about,
      female.profile?.matchingNotes
    );

    const bgMatch = calculateBackgroundMatch(maleBackgroundProfile, femaleBackgroundProfile);

    return `
[מועמדת ${index + 1}]
שם: ${female.firstName} ${female.lastName}
גיל: ${femaleAge ?? 'לא ידוע'}
רמה דתית: ${female.profile?.religiousLevel || 'לא צוין'}
עיר: ${female.profile?.city || 'לא צוין'}
עיסוק: ${female.profile?.occupation || 'לא צוין'}
התאמת רקע: ${bgMatch.compatibility}

${female.profile?.aiProfileSummary?.personalitySummary || female.profile?.about || female.profile?.manualEntryText || 'אין מידע'}
---`;
  }).join('\n\n');

  const prompt = `אתה שדכן AI מומחה במערכת NeshamaTech.

=== פרופיל הגבר ===
${maleNarrativeProfile}

=== ${females.length} מועמדות לבדיקה ===
${candidatesText}

=== המשימה ===
דרג כל מועמדת מ-0 עד 100 לפי התאמה לגבר.

קריטריונים עיקריים:
1. התאמה דתית והשקפתית (30 נקודות)
2. התאמת גיל (10 נקודות)
3. איזון קריירה-משפחה (15 נקודות)
4. סגנון חיים (13 נקודות)
5. שאפתנות ומוטיבציה (11 נקודות)
6. סגנון תקשורת (11 נקודות)
7. ערכים (10 נקודות)

=== פורמט התשובה (JSON בלבד) ===
{
  "results": [
    { "index": 1, "score": 85, "reasoning": "נימוק קצר" },
    { "index": 2, "score": 72, "reasoning": "נימוק קצר" }
  ]
}

התשובה חייבת להיות JSON תקין בלבד.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let jsonString = response.text();
    
    // ניקוי אם יש markdown
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim();
    }

    const parsed = JSON.parse(jsonString) as {
      results: Array<{ index: number; score: number; reasoning: string }>;
    };

    return parsed.results.map(r => {
      const female = females[r.index - 1];
      return {
        femaleId: female.id,
        score: Math.min(100, Math.max(0, r.score)),
        reasoning: r.reasoning || '',
        femaleProfileUpdatedAt: female.profile?.updatedAt || new Date(),
      };
    });

  } catch (error) {
    console.error(`[BatchScan] AI error:`, error);
    // במקרה של שגיאה, נחזיר ציון 0 לכל הבחורות
    return females.map(f => ({
      femaleId: f.id,
      score: 0,
      reasoning: 'AI error',
      femaleProfileUpdatedAt: f.profile?.updatedAt || new Date(),
    }));
  }
}

async function saveToPotentialMatch(
  maleUserId: string,
  femaleUserId: string,
  result: BatchScanResult
): Promise<'new' | 'updated' | 'unchanged'> {
  try {
    const existing = await prisma.potentialMatch.findUnique({
      where: {
        maleUserId_femaleUserId: { maleUserId, femaleUserId }
      }
    });

    if (existing) {
      if (Math.abs(existing.aiScore - result.score) > 2 || existing.status === 'EXPIRED') {
        await prisma.potentialMatch.update({
          where: { id: existing.id },
          data: {
            aiScore: result.score,
            shortReasoning: result.reasoning,
            scannedAt: new Date(),
            status: existing.status === 'EXPIRED' ? 'PENDING' : existing.status,
          }
        });
        return 'updated';
      }
      return 'unchanged';
    }

    await prisma.potentialMatch.create({
      data: {
        maleUserId,
        femaleUserId,
        aiScore: result.score,
        shortReasoning: result.reasoning,
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