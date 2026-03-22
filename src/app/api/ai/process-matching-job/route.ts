// ===========================================
// src/app/api/ai/process-matching-job/route.ts
// ===========================================
// 🎯 Background Job Processor
// מעבד חיפושים רגילים (לא וירטואליים) ברקע
// 
// 📝 הערה: חיפושים וירטואליים מעובדים ישירות ב-find-matches-v2
// ולא עוברים דרך route זה יותר
//
// 🆕 עודכן: תמיכה ב-Metrics V2

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { findMatchesForUser } from "@/lib/services/matchingAlgorithmService";
import { findMatchesWithVector } from "@/lib/services/vectorMatchingService";
// 🆕 ייבוא השירות החדש
import { scanSingleUserV2, saveScanResults } from '@/lib/services/scanSingleUserV2';
import { hybridScan } from '@/lib/services/hybridMatchingService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות

// ============================================================================
// POST - מעבד Job רגיל (לא וירטואלי)
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  // const startTime = Date.now(); // (לא בשימוש כרגע)
  
  try {
    // אימות פנימי - רק קריאות מהשרת עצמו
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET || 'default-secret';
    
    if (internalSecret !== expectedSecret) {
      console.warn('[ProcessJob] ⚠️ Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[ProcessJob] 📥 Received job: ${jobId}`);
    console.log(`${'='.repeat(60)}\n`);

    // שליפת פרטי ה-Job
    const job = await prisma.matchingJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      console.error(`[ProcessJob] ❌ Job not found: ${jobId}`);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // בדיקה אם זה חיפוש וירטואלי - לא אמור להגיע לכאן יותר
    if (job.method?.includes('virtual')) {
      console.warn(`[ProcessJob] ⚠️ Virtual search job ${jobId} arrived at wrong endpoint`);
      console.warn(`[ProcessJob] Virtual searches should be processed directly in find-matches-v2`);
      
      // מעדכנים שגיאה
      await prisma.matchingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: 'Virtual search routed incorrectly - please retry',
          progressMessage: 'שגיאת ניתוב - נא לנסות שוב'
        }
      });
      
      return NextResponse.json({ 
        error: "Virtual searches should be processed directly",
        hint: "This is a routing error - virtual searches are now handled in find-matches-v2"
      }, { status: 400 });
    }

    // בדיקה אם הג'וב כבר הסתיים
    if (job.status === 'completed' || job.status === 'failed') {
      console.log(`[ProcessJob] ⏭️ Job ${jobId} already finished (status: ${job.status})`);
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
        progressMessage: 'מתחיל עיבוד...'
      }
    });

    // ==========================================================
    // 🔥 עיבוד ברקע (Fire and Forget)
    // ==========================================================
    
    processJobInBackground(jobId, job.method, job.targetUserId, job.matchmakerId)
      .catch(err => {
        console.error(`[ProcessJob] Background processing failed:`, err);
      });

    // מחזיר תשובה מיידית
    return NextResponse.json({ 
      success: true, 
      message: "Processing started",
      jobId 
    });

  } catch (error) {
    console.error('[ProcessJob] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to start processing" 
    }, { status: 500 });
  }
}

// ============================================================================
// Background Processing Function
// ============================================================================

async function processJobInBackground(
  jobId: string,
  method: string,
  targetUserId: string,
  matchmakerId: string
): Promise<void> {
  const startTime = Date.now();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[ProcessJob] 🚀 Starting background processing`);
  console.log(`[ProcessJob] Job ID: ${jobId}`);
  console.log(`[ProcessJob] Method: ${method}`);
  console.log(`[ProcessJob] Target: ${targetUserId}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // פונקציית callback לעדכון progress
    const onProgress = async (progress: number, message: string) => {
      await updateJobProgress(jobId, progress, message);
    };

    // ==========================================================
    // 🆕 Metrics V2 Search (New Algorithm)
    // ==========================================================
    if (method === 'metrics_v2') {
      console.log('[ProcessJob] 🆕 Running Metrics V2 scan');
      
      // עדכון progress
      await onProgress(20, 'מריץ סריקת מדדים V2...');
      
      try {
        // הרצת הסריקה החדשה
        // שימוש ב-targetUserId שהתקבל כפרמטר לפונקציה
        const scanResult = await scanSingleUserV2(targetUserId, {
          useVectors: true,
          useAIDeepAnalysis: true,
          maxCandidates: 100,
          topForAI: 30,
          forceUpdateMetrics: false,
            skipCandidateMetricsUpdate: true,  // 🆕 הוסף את זה!

        });
        
        await onProgress(70, `נמצאו ${scanResult.matches.length} התאמות, שומר...`);
        
        // שמירה ל-DB
        await saveScanResults(scanResult);
        
        await onProgress(90, 'מעבד תוצאות...');
        
        // המרה לפורמט AiMatch שה-frontend מצפה לו
       // process-matching-job/route.ts - בתוך הטיפול ב-metrics_v2

// המרה לפורמט AiMatch שה-frontend מצפה לו
const matches = scanResult.matches.map((m, index) => {
  // 🆕 יצירת scoreBreakdown מהנתונים שיש לנו
  const generatedBreakdown = {
    religious: Math.round((m.metricsScore || 70) * 0.25),
    ageCompatibility: 8,
    careerFamily: Math.round((m.metricsScore || 70) * 0.15),
    lifestyle: Math.round((m.metricsScore || 70) * 0.10),
    socioEconomic: m.candidateBackground?.socioEconomicLevel 
      ? Math.round(m.candidateBackground.socioEconomicLevel) 
      : 5,
    education: m.candidateBackground?.educationLevelScore 
      ? Math.round(m.candidateBackground.educationLevelScore) 
      : 5,
    background: 5,
    values: Math.round((m.metricsScore || 70) * 0.10),
  };

  return {
    userId: m.candidateUserId,
    firstName: m.candidateName.split(' ')[0],
    lastName: m.candidateName.split(' ').slice(1).join(' '),
    score: m.symmetricScore,
    finalScore: m.symmetricScore,
    firstPassScore: m.metricsScore,
    rank: index + 1,
    reasoning: m.aiAnalysis?.reasoning || '',
    shortReasoning: m.aiAnalysis?.reasoning || '',
    detailedReasoning: m.aiAnalysis?.reasoning || '',
    strengths: m.aiAnalysis?.strengths || [],
    concerns: m.aiAnalysis?.concerns || [],
    scoreBreakdown: generatedBreakdown,  // 🆕 הוספנו
  };
});
        
        // סיום מוצלח - Metrics V2
        await prisma.matchingJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            progress: 100,
            progressMessage: `נמצאו ${matches.length} התאמות (Metrics V2)`,
            result: {
              matches,
              meta: {
                algorithmVersion: 'metrics-v2',
                totalCandidatesScanned: scanResult.stats.totalCandidates,
                passedDealBreakers: scanResult.stats.passedDealBreakers,
                aiAnalyzed: scanResult.stats.aiAnalyzed,
                durationMs: scanResult.durationMs,
              },
            },
            matchesFound: matches.length,
            totalCandidates: scanResult.stats.totalCandidates,
            completedAt: new Date(),
          },
        });
        
        console.log(`[ProcessJob] ✅ Metrics V2 completed: ${matches.length} matches`);
        
        // יציאה מהפונקציה כדי למנוע הרצת קוד ישן בהמשך
        return;
        
      } catch (error) {
        console.error('[ProcessJob] ❌ Metrics V2 failed:', error);
        await prisma.matchingJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: String(error),
            completedAt: new Date(),
          },
        });
        return;
      }
    }

    // ==========================================================
    // 🆕 V3: Hybrid Scan (Soul Fingerprint-Driven)
    // ==========================================================
    if (method === 'hybrid') {
      console.log('[ProcessJob] 🔥 Running Hybrid V3 scan');

      await onProgress(10, 'מפעיל סריקה היברידית V3...');

      try {
        const scanResult = await hybridScan(targetUserId, {
          maxTier1Candidates: 300,
          maxTier2Candidates: 50,
          maxTier3Candidates: 20,
          topForDeepAnalysis: 15,
          useVectors: true,
          useBackgroundAnalysis: true,
          useAIFirstPass: true,
          useAIDeepAnalysis: true,
          minScoreToSave: 65,
        });

        await onProgress(90, `נמצאו ${scanResult.matches.length} התאמות, מעבד...`);

        // Map to frontend AiMatch format
        const matches = scanResult.matches.map((m, index) => ({
          userId: m.userId,
          firstName: m.firstName,
          lastName: m.lastName,
          score: m.finalScore,
          finalScore: m.finalScore,
          firstPassScore: m.tier3Score || m.tier2Score,
          rank: m.rank || index + 1,
          reasoning: m.detailedReasoning || '',
          shortReasoning: m.detailedReasoning?.slice(0, 200) || '',
          detailedReasoning: m.detailedReasoning || '',
          strengths: m.strengths || [],
          concerns: m.concerns || [],
          scoreAtoB: m.scoreAtoB,
          scoreBtoA: m.scoreBtoA,
          reasoningAtoB: m.reasoningAtoB,
          reasoningBtoA: m.reasoningBtoA,
          scoreBreakdown: {
            religious: Math.round((m.tier2Score || 70) * 0.25),
            ageCompatibility: 8,
            careerFamily: Math.round((m.tier2Score || 70) * 0.15),
            lifestyle: Math.round((m.tier2Score || 70) * 0.10),
            socioEconomic: 5,
            education: 5,
            background: 5,
            values: Math.round((m.tier2Score || 70) * 0.10),
          },
        }));

        await prisma.matchingJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            progress: 100,
            progressMessage: `הושלם! נמצאו ${matches.length} התאמות (היברידי V3)`,
            result: {
              matches,
              meta: {
                algorithmVersion: 'hybrid-v3',
                totalCandidatesScanned: scanResult.stats.totalCandidatesScanned,
                passedFilters: scanResult.stats.passedFilters,
                aiAnalyzed: scanResult.stats.aiAnalyzed,
                deepAnalyzed: scanResult.stats.deepAnalyzed,
                savedToDb: scanResult.stats.savedToDb,
                durationMs: scanResult.durationMs,
                tagFilteredOut: scanResult.stats.tagFilteredOut,
              },
            },
            matchesFound: matches.length,
            totalCandidates: scanResult.stats.totalCandidatesScanned,
            completedAt: new Date(),
          },
        });

        console.log(`[ProcessJob] ✅ Hybrid V3 completed: ${matches.length} matches in ${(scanResult.durationMs / 1000).toFixed(1)}s`);
        return;

      } catch (error) {
        console.error('[ProcessJob] ❌ Hybrid V3 failed:', error);
        await prisma.matchingJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: String(error),
            progressMessage: 'שגיאה בסריקה היברידית',
            completedAt: new Date(),
          },
        });
        return;
      }
    }

    // ==========================================================
    // 🔽 LEGACY / STANDARD METHODS (Vector & Algorithmic V1)
    // ==========================================================

    let result;

    // 🔷 Vector Search
    if (method === 'vector') {
      console.log(`[ProcessJob] 🔷 Running Vector Search method`);
      await onProgress(10, 'מפעיל חיפוש וקטורי...');
      
      result = await findMatchesWithVector(targetUserId, matchmakerId, {
        forceRefresh: true,
        autoSave: true,
      });
    } 
    // 🧠 Algorithmic Search (Legacy V1)
    else {
      console.log(`[ProcessJob] 🧠 Running Algorithmic method`);
      await onProgress(10, 'טוען נתוני מועמד מטרה...');
      
      result = await findMatchesForUserWithProgress(
        targetUserId, 
        matchmakerId,
        onProgress
      );
    }

    // חישוב זמן ריצה
    const duration = Date.now() - startTime;
    const durationMinutes = (duration / 1000 / 60).toFixed(2);

    // שמירת התוצאות ב-MatchingJob
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        progressMessage: `הושלם! נמצאו ${result.matches.length} התאמות`,
        result: {
          matches: result.matches,
          meta: result.meta,
          fromCache: result.fromCache
        },
        matchesFound: result.matches.length,
        totalCandidates: result.meta?.totalCandidatesScanned || 0,
        completedAt: new Date()
      }
    });

    // ==========================================================
    // 🆕 שמירה גם ב-PotentialMatch לתצוגה בדשבורד (Legacy Support)
    // ==========================================================
    await saveToPotentialMatches(targetUserId, result.matches, 70);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[ProcessJob] ✅ Job ${jobId} completed successfully!`);
    console.log(`[ProcessJob] ⏱️ Duration: ${durationMinutes} minutes`);
    console.log(`[ProcessJob] 📊 Matches found: ${result.matches.length}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`\n${'='.repeat(60)}`);
    console.error(`[ProcessJob] ❌ Job ${jobId} FAILED after ${(duration/1000).toFixed(1)}s`);
    console.error(`[ProcessJob] Error:`, error);
    console.error(`${'='.repeat(60)}\n`);

    // עדכון סטטוס לכישלון
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        progress: 0,
        progressMessage: 'החיפוש נכשל',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }).catch(err => {
      console.error(`[ProcessJob] Failed to update job status:`, err);
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
    console.log(`[ProcessJob] 📊 Progress: ${progress}% - ${message}`);
  } catch (error) {
    console.error(`[ProcessJob] Failed to update progress:`, error);
  }
}

// ============================================================================
// Wrapper: findMatchesForUser with Progress Updates
// ============================================================================

async function findMatchesForUserWithProgress(
  targetUserId: string,
  matchmakerId: string,
  onProgress: (progress: number, message: string) => Promise<void>
): Promise<{
  matches: any[];
  fromCache: boolean;
  meta: any;
}> {
  await onProgress(15, 'טוען נתוני מועמד מטרה...');
  await onProgress(20, 'מחפש מועמדים מתאימים...');
  await onProgress(30, 'מסנן לפי קריטריונים...');
  
  // שימוש בפונקציה המקורית
  const result = await findMatchesForUser(targetUserId, matchmakerId, {
    forceRefresh: true,
    autoSave: true,
  });

  await onProgress(95, 'מסיים ושומר תוצאות...');

  return result;
}

// ============================================================================
// 🆕 שמירה ב-PotentialMatch (לתצוגה בדשבורד) - Legacy Logic
// ============================================================================

async function saveToPotentialMatches(
  targetUserId: string,
  matches: any[],
  minScoreThreshold: number = 70
): Promise<void> {
  console.log(`[ProcessJob] 💾 Saving ${matches.length} matches to PotentialMatch...`);
  
  // קבלת המגדר של היוזר
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { profile: { select: { gender: true } } }
  });

  if (!targetUser?.profile?.gender) {
    console.log(`[ProcessJob] ⚠️ Could not determine gender for ${targetUserId}`);
    return;
  }

  const isMale = targetUser.profile.gender === 'MALE';
  let saved = 0;
  let updated = 0;

  for (const match of matches) {
    const score = match.finalScore || match.score || 0;
    if (score < minScoreThreshold) continue;

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
          updated++;
        }
      } else {
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
        saved++;
      }
    } catch (err) {
      // התעלם משגיאות יחידות (משתמש נמחק וכו')
      console.warn(`[ProcessJob] Could not save match:`, err);
    }
  }

  console.log(`[ProcessJob] 💾 PotentialMatch: ${saved} new, ${updated} updated`);
}

// ============================================================================
// GET - Health Check
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    service: "process-matching-job",
    version: "4.3", // 🆕 עודכן
    features: [
      "Background job processing",
      "Saves to PotentialMatch for dashboard display",
      "Metrics V2 Support" // 🆕
    ],
    note: "Virtual searches are now processed directly in find-matches-v2",
    timestamp: new Date().toISOString()
  });
}