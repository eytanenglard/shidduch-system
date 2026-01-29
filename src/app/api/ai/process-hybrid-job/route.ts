// ===========================================
// src/app/api/ai/process-hybrid-job/route.ts
// ===========================================
// 🎯 Background Job Processor - Hybrid Matching
// משלב את היתרונות של:
// - scanSingleUserV2: יעילות SQL, metrics, vectors
// - matchingAlgorithmService: ניתוח רקע, AI עמוק
//
// 🆕 גרסה: 1.0

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hybridScan, saveScanResultsToPotentialMatch, type HybridScanOptions } from "@/lib/services/hybridMatchingService";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות

// ============================================================================
// POST - מעבד Job היברידי
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // אימות פנימי - רק קריאות מהשרת עצמו
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET || 'default-secret';
    
    if (internalSecret !== expectedSecret) {
      console.warn('[ProcessHybridJob] ⚠️ Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId, options = {} } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[ProcessHybridJob] 📥 Received job: ${jobId}`);
    console.log(`${'='.repeat(60)}\n`);

    // שליפת פרטי ה-Job
    const job = await prisma.matchingJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      console.error(`[ProcessHybridJob] ❌ Job not found: ${jobId}`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // בדיקה אם הג'וב כבר הסתיים
    if (job.status === 'completed' || job.status === 'failed') {
      console.log(`[ProcessHybridJob] ⏭️ Job ${jobId} already finished (status: ${job.status})`);
      return NextResponse.json({ 
        success: true, 
        message: "Job already finished",
        status: job.status 
      });
    }

    // עדכון סטטוס ל-processing
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: { 
        status: 'processing',
        progress: 5,
        progressMessage: 'מתחיל עיבוד היברידי...'
      }
    });

    // ==========================================================
    // 🔥 עיבוד ברקע (Fire and Forget)
    // ==========================================================
    
    processHybridJobInBackground(jobId, job.targetUserId, job.matchmakerId, options)
      .catch(err => {
        console.error(`[ProcessHybridJob] Background processing failed:`, err);
      });

    // מחזיר תשובה מיידית
    return NextResponse.json({ 
      success: true, 
      message: "Hybrid processing started",
      jobId 
    });

  } catch (error) {
    console.error('[ProcessHybridJob] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to start processing" 
    }, { status: 500 });
  }
}

// ============================================================================
// Background Processing Function
// ============================================================================

async function processHybridJobInBackground(
  jobId: string,
  targetUserId: string,
  matchmakerId: string,
  options: any = {}
): Promise<void> {
  const startTime = Date.now();

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[ProcessHybridJob] 🚀 Starting background processing`);
  console.log(`[ProcessHybridJob] Job ID: ${jobId}`);
  console.log(`[ProcessHybridJob] Target: ${targetUserId}`);
  console.log(`[ProcessHybridJob] Matchmaker: ${matchmakerId}`);
  console.log(`${'='.repeat(70)}\n`);

  try {
    // ==========================================================
    // שלב 1: טעינת פרופיל
    // ==========================================================
    await updateJobProgress(jobId, 10, 'טוען פרופיל יוזר...');

    // ==========================================================
    // שלב 2: הגדרת אופציות סריקה
    // ==========================================================
    const scanOptions: HybridScanOptions = {
      maxTier1Candidates: options.maxTier1Candidates || 300,
      maxTier2Candidates: options.maxTier2Candidates || 50,
      maxTier3Candidates: options.maxTier3Candidates || 20,
      topForDeepAnalysis: options.topForDeepAnalysis || 15,
      useVectors: options.useVectors !== false,
      useBackgroundAnalysis: options.useBackgroundAnalysis !== false,
      useAIFirstPass: options.useAIFirstPass !== false,
      useAIDeepAnalysis: options.useAIDeepAnalysis !== false,
      minScoreToSave: options.minScoreToSave || 65,
      minScoreForAI: options.minScoreForAI || 50,
      autoSave: false, // נשמור ידנית אחרי
    };

    console.log(`[ProcessHybridJob] 📋 Scan options:`, scanOptions);

    // ==========================================================
    // שלב 3: הרצת הסריקה עם עדכוני התקדמות
    // ==========================================================
    await updateJobProgress(jobId, 15, 'מריץ סינון SQL (Tier 1)...');

    // הרצת מעקב התקדמות במקביל
    let lastProgress = 15;
    const progressMessages = [
      { at: 20, msg: 'מסנן מועמדים לפי קריטריונים...' },
      { at: 30, msg: 'מחשב מדדי התאמה (Tier 2)...' },
      { at: 40, msg: 'מנתח רקע ושפה...' },
      { at: 50, msg: 'מחשב ציוני גיל...' },
      { at: 55, msg: 'מחשב דמיון וקטורי...' },
      { at: 60, msg: 'מריץ AI First Pass...' },
      { at: 70, msg: 'מנתח ב-batches...' },
      { at: 80, msg: 'מבצע ניתוח מעמיק (Tier 4)...' },
      { at: 90, msg: 'מעבד תוצאות סופיות...' },
    ];

    const progressInterval = setInterval(async () => {
      const nextProgress = progressMessages.find(p => p.at > lastProgress);
      if (nextProgress && lastProgress < 90) {
        lastProgress = nextProgress.at;
        await updateJobProgress(jobId, nextProgress.at, nextProgress.msg);
      }
    }, 2500);

    let scanResult;
    try {
      scanResult = await hybridScan(targetUserId, scanOptions);
      clearInterval(progressInterval);
    } catch (scanError) {
      clearInterval(progressInterval);
      throw scanError;
    }

    // ==========================================================
    // שלב 4: עיבוד התוצאות
    // ==========================================================
    await updateJobProgress(jobId, 92, `נמצאו ${scanResult.matches.length} התאמות, שומר...`);

    // המרה לפורמט AiMatch שה-frontend מצפה לו
    const matches = scanResult.matches.map((m, index) => ({
      userId: m.userId,
      firstName: m.firstName,
      lastName: m.lastName,
      
      // ציונים
      score: m.finalScore,
      finalScore: m.finalScore,
      firstPassScore: m.tier2Score,
      
      // דירוג והמלצה
      rank: m.rank || index + 1,
      recommendation: m.recommendation,
      
      // נימוקים
      reasoning: m.detailedReasoning || m.shortReasoning || '',
      shortReasoning: m.shortReasoning || '',
      detailedReasoning: m.detailedReasoning || '',
      
      // פירוט ציונים
      scoreBreakdown: m.scoreBreakdown,
      
      // ניתוח רקע
      backgroundMultiplier: m.backgroundMatch?.multiplier,
      backgroundCompatibility: m.backgroundMatch?.compatibility,
      
      // ציון גיל
      ageScore: m.ageScore?.score,
      ageDescription: m.ageScore?.description,
      
      // מידע נוסף מהסריקה
      metricsScore: m.metricsScore,
      vectorScore: m.vectorScore,
      tier2Score: m.tier2Score,
      tier3Score: m.tier3Score,
      
      // נתוני מועמד
      candidateAge: m.age,
      candidateCity: m.city,
    }));

    // ==========================================================
    // שלב 5: שמירה ב-PotentialMatch
    // ==========================================================
    await updateJobProgress(jobId, 95, 'שומר התאמות לדשבורד...');
    
    await saveToPotentialMatches(
      targetUserId, 
      matches, 
      scanOptions.minScoreToSave || 65
    );

    // ==========================================================
    // שלב 6: סיום והודעה
    // ==========================================================
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(1);
    const durationMinutes = (duration / 1000 / 60).toFixed(2);

    // שמירת התוצאות ב-MatchingJob
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        progressMessage: `הושלם! נמצאו ${matches.length} התאמות ב-${durationSeconds} שניות`,
        result: {
          matches,
          meta: {
            algorithmVersion: 'hybrid-v1',
            totalCandidatesScanned: scanResult.stats.totalCandidatesScanned,
            passedFilters: scanResult.stats.passedFilters,
            aiAnalyzed: scanResult.stats.aiAnalyzed,
            deepAnalyzed: scanResult.stats.deepAnalyzed,
            savedToDb: scanResult.stats.savedToDb,
            durationMs: scanResult.durationMs,
            tiers: scanResult.tiers,
          },
          fromCache: false,
        },
        matchesFound: matches.length,
        totalCandidates: scanResult.stats.totalCandidatesScanned,
        completedAt: new Date()
      }
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[ProcessHybridJob] ✅ Job ${jobId} completed successfully!`);
    console.log(`[ProcessHybridJob] ⏱️ Duration: ${durationMinutes} minutes (${durationSeconds}s)`);
    console.log(`[ProcessHybridJob] 📊 Matches found: ${matches.length}`);
    console.log(`[ProcessHybridJob] 📈 Tiers breakdown:`);
    console.log(`    - Tier 1 (SQL Filter): ${scanResult.tiers.tier1.output} candidates in ${scanResult.tiers.tier1.durationMs}ms`);
    console.log(`    - Tier 2 (Metrics+BG): ${scanResult.tiers.tier2.output} candidates in ${scanResult.tiers.tier2.durationMs}ms`);
    console.log(`    - Tier 3 (AI First):  ${scanResult.tiers.tier3.output} candidates in ${scanResult.tiers.tier3.durationMs}ms`);
    console.log(`    - Tier 4 (AI Deep):   ${scanResult.tiers.tier4.output} candidates in ${scanResult.tiers.tier4.durationMs}ms`);
    console.log(`${'='.repeat(70)}\n`);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`\n${'='.repeat(70)}`);
    console.error(`[ProcessHybridJob] ❌ Job ${jobId} FAILED after ${(duration/1000).toFixed(1)}s`);
    console.error(`[ProcessHybridJob] Error:`, error);
    console.error(`${'='.repeat(70)}\n`);

    // עדכון סטטוס לכישלון
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        progress: 0,
        progressMessage: 'הסריקה ההיברידית נכשלה',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }).catch(err => {
      console.error(`[ProcessHybridJob] Failed to update job status:`, err);
    });
  }
}

// ============================================================================
// Helper: Update Job Progress
// ============================================================================

async function updateJobProgress(
  jobId: string, 
  progress: number, 
  message: string
): Promise<void> {
  try {
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        progress: Math.min(99, progress), // מקסימום 99 עד שמסיים
        progressMessage: message
      }
    });
    console.log(`[ProcessHybridJob] 📊 Progress: ${progress}% - ${message}`);
  } catch (error) {
    console.error(`[ProcessHybridJob] Failed to update progress:`, error);
  }
}

// ============================================================================
// Helper: Save to PotentialMatch (לתצוגה בדשבורד)
// ============================================================================

async function saveToPotentialMatches(
  targetUserId: string,
  matches: any[],
  minScoreThreshold: number = 65
): Promise<void> {
  console.log(`[ProcessHybridJob] 💾 Saving ${matches.length} matches to PotentialMatch...`);
  
  // קבלת המגדר של היוזר
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { profile: { select: { gender: true } } }
  });

  if (!targetUser?.profile?.gender) {
    console.log(`[ProcessHybridJob] ⚠️ Could not determine gender for ${targetUserId}`);
    return;
  }

  const isMale = targetUser.profile.gender === 'MALE';
  let saved = 0;
  let updated = 0;
  let skipped = 0;

  for (const match of matches) {
    const score = match.finalScore || match.score || 0;
    
    if (score < minScoreThreshold) {
      skipped++;
      continue;
    }

    const maleUserId = isMale ? targetUserId : match.userId;
    const femaleUserId = isMale ? match.userId : targetUserId;

    try {
      const existing = await prisma.potentialMatch.findUnique({
        where: {
          maleUserId_femaleUserId: { maleUserId, femaleUserId }
        }
      });

      if (existing) {
        // עדכון אם הציון השתנה או שפג תוקף
        if (Math.abs(existing.aiScore - score) > 2 || existing.status === 'EXPIRED') {
          await prisma.potentialMatch.update({
            where: { id: existing.id },
            data: {
              aiScore: score,
              firstPassScore: match.firstPassScore || match.tier2Score || null,
              scoreBreakdown: match.scoreBreakdown || null,
              shortReasoning: match.shortReasoning || match.reasoning || null,
              detailedReasoning: match.detailedReasoning || null,
              backgroundCompatibility: match.backgroundCompatibility || null,
              backgroundMultiplier: match.backgroundMultiplier || null,
              scannedAt: new Date(),
              status: existing.status === 'EXPIRED' ? 'PENDING' : existing.status,
              // 🆕 שדות נוספים מההיברידי
              scoreForMale: isMale ? score : match.tier3Score || score,
              scoreForFemale: isMale ? match.tier3Score || score : score,
              asymmetryGap: Math.abs(score - (match.tier3Score || score)),
            }
          });
          updated++;
        }
      } else {
        // יצירת התאמה חדשה
        await prisma.potentialMatch.create({
          data: {
            maleUserId,
            femaleUserId,
            aiScore: score,
            firstPassScore: match.firstPassScore || match.tier2Score || null,
            scoreBreakdown: match.scoreBreakdown || null,
            shortReasoning: match.shortReasoning || match.reasoning || null,
            detailedReasoning: match.detailedReasoning || null,
            backgroundCompatibility: match.backgroundCompatibility || null,
            backgroundMultiplier: match.backgroundMultiplier || null,
            status: 'PENDING',
            scannedAt: new Date(),
            // 🆕 שדות נוספים מההיברידי
            scoreForMale: isMale ? score : match.tier3Score || score,
            scoreForFemale: isMale ? match.tier3Score || score : score,
            asymmetryGap: Math.abs(score - (match.tier3Score || score)),
          }
        });
        saved++;
      }
    } catch (err) {
      // התעלם משגיאות יחידות (משתמש נמחק וכו')
      console.warn(`[ProcessHybridJob] Could not save match for ${match.firstName}:`, err);
    }
  }

  console.log(`[ProcessHybridJob] 💾 PotentialMatch: ${saved} new, ${updated} updated, ${skipped} skipped (below ${minScoreThreshold})`);
}

// ============================================================================
// GET - Health Check
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  // מידע על Jobs פעילים
  const activeJobs = await prisma.matchingJob.count({
    where: {
      method: 'hybrid',
      status: { in: ['pending', 'processing'] }
    }
  });

  const completedToday = await prisma.matchingJob.count({
    where: {
      method: 'hybrid',
      status: 'completed',
      completedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  return NextResponse.json({
    status: "healthy",
    service: "process-hybrid-job",
    version: "1.0",
    description: "Hybrid Matching - combines Metrics + Background Analysis + AI",
    features: [
      "4-tier scoring system",
      "Background/language analysis",
      "Age compatibility scoring",
      "Vector similarity (optional)",
      "AI First Pass (batches)",
      "AI Deep Analysis (top candidates)",
      "Saves to PotentialMatch for dashboard",
    ],
    architecture: {
      tier1: "SQL Filtering (gender, age, religious, history)",
      tier2: "Metrics + Background + Age Scoring",
      tier3: "AI First Pass (batch analysis)",
      tier4: "AI Deep Analysis (detailed comparison)",
    },
    stats: {
      activeJobs,
      completedToday,
    },
    timestamp: new Date().toISOString()
  });
}