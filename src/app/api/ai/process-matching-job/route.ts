// ===========================================
// src/app/api/ai/process-matching-job/route.ts
// ===========================================
// 🎯 Background Job Processor
// זה ה-route שבאמת מריץ את האלגוריתם הארוך

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { findMatchesForUser } from "@/lib/services/matchingAlgorithmService";
import { findMatchesWithVector } from "@/lib/services/vectorMatchingService";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות - לא יעזור ב-Heroku אבל לא מזיק

// ============================================================================
// POST - מעבד Job ברקע
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // אימות פנימי - רק קריאות מהשרת עצמו
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET || 'default-secret';
    
    if (internalSecret !== expectedSecret) {
      console.warn('[ProcessJob] ⚠️ Unauthorized access attempt');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    console.log(`[ProcessJob] 📥 Received job: ${jobId}`);

    // 🔥 מחזיר תשובה מיידית - העיבוד ממשיך ברקע!
    // זה ה-KEY: הבקשה הזו חוזרת תוך מילישניות
    processJobInBackground(jobId).catch(err => {
      console.error(`[ProcessJob] Background processing failed:`, err);
    });

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

async function processJobInBackground(jobId: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[ProcessJob] 🚀 Starting background processing for job: ${jobId}`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();

  try {
    // שליפת פרטי ה-Job
    const job = await prisma.matchingJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      console.error(`[ProcessJob] ❌ Job not found: ${jobId}`);
      return;
    }

    if (job.status !== 'pending') {
      console.log(`[ProcessJob] ⏭️ Job ${jobId} is not pending (status: ${job.status}), skipping`);
      return;
    }

    // עדכון סטטוס ל-processing
    await updateJobProgress(jobId, 5, 'processing', 'מתחיל עיבוד...');

    // פונקציית callback לעדכון progress
    const onProgress = async (progress: number, message: string) => {
      await updateJobProgress(jobId, progress, 'processing', message);
    };

    // הרצת האלגוריתם לפי השיטה
    let result;

    if (job.method === 'vector') {
      console.log(`[ProcessJob] 🔷 Running Vector Search method`);
      await onProgress(10, 'מפעיל חיפוש וקטורי...');
      
      result = await findMatchesWithVector(job.targetUserId, job.matchmakerId, {
        forceRefresh: true,
        autoSave: true,
      });
    } else {
      console.log(`[ProcessJob] 🧠 Running Algorithmic method`);
      await onProgress(10, 'טוען נתוני מועמד מטרה...');
      
      // הערה: צריך לעדכן את findMatchesForUser לתמוך ב-onProgress
      // בינתיים נדמה את ה-progress
      result = await findMatchesForUserWithProgress(
        job.targetUserId, 
        job.matchmakerId,
        onProgress
      );
    }

    // חישוב זמן ריצה
    const duration = Date.now() - startTime;
    const durationMinutes = (duration / 1000 / 60).toFixed(2);

    // שמירת התוצאות
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
        progressMessage: 'נכשל',
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
  status: string, 
  message: string
): Promise<void> {
  try {
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        progress: Math.min(99, progress), // מקסימום 99 עד שמסיים
        status,
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
  // כאן אנחנו עוטפים את הפונקציה הקיימת עם עדכוני progress
  // הרעיון: לעדכן את ה-progress בנקודות מפתח

  await onProgress(15, 'טוען נתוני מועמד מטרה...');
  
  // הערה: אם אתה רוצה progress יותר מדויק, צריך לשנות את הפונקציה המקורית
  // בינתיים, נריץ אותה כמו שהיא ונעדכן progress באופן כללי
  
  await onProgress(20, 'מחפש מועמדים מתאימים...');
  
  // שימוש בפונקציה המקורית
  const result = await findMatchesForUser(targetUserId, matchmakerId, {
    forceRefresh: true,
    autoSave: true,
  });

  await onProgress(95, 'מסיים ושומר תוצאות...');

  return result;
}

// ============================================================================
// Optional: GET endpoint for health check
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    service: "process-matching-job",
    timestamp: new Date().toISOString()
  });
}
