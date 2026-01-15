// ===========================================
// src/app/api/ai/find-matches-v2/route.ts
// ===========================================
// 🎯 API Route עם תמיכה ב-Background Jobs
// פותר את בעיית ה-30 שניות timeout של Heroku
// 🔧 תיקון: חיפוש וירטואלי מעובד ישירות (לא fire-and-forget)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, Gender } from "@prisma/client";
import prisma from "@/lib/prisma";
import { findMatchesForVirtualUser } from '@/lib/services/matchingAlgorithmService';
import { findMatchesForVirtualUserVector } from '@/lib/services/vectorMatchingService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות לחיפושים ארוכים

// ============================================================================
// TYPES
// ============================================================================

interface VirtualProcessingParams {
  virtualProfileId: string;
  virtualProfile: any;
  gender: string;
  religiousLevel: string;
  editedSummary?: string;
  method: string;
  matchmakerId: string;
}

// ============================================================================
// POST - התחלת Job חדש (מחזיר מיד!)
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden" 
      }, { status: 403 });
    }

    // Parse body
    const body = await req.json();
    const { 
      targetUserId, 
      forceRefresh = false, 
      method = 'algorithmic',
      // 🆕 פרמטרים לחיפוש וירטואלי
      isVirtualSearch = false,
      virtualProfileId,
      virtualProfile,
      gender,
      religiousLevel,
      editedSummary,
    } = body;

    const matchmakerId = session.user.id;

    // ================================================================
    // 🔮 חיפוש וירטואלי - מעובד ישירות (לא fire-and-forget)
    // ================================================================
    if (isVirtualSearch) {
      if (!virtualProfileId || !virtualProfile || !gender || !religiousLevel) {
        return NextResponse.json({ 
          success: false, 
          error: "Missing required virtual profile parameters" 
        }, { status: 400 });
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`[MatchingJob] 🔮 Virtual search request from ${session.user.email}`);
      console.log(`[MatchingJob] Virtual Profile: ${virtualProfileId}, Method: ${method}`);
      console.log(`${'='.repeat(60)}\n`);

      // יצירת Job חדש לחיפוש וירטואלי
      const newJob = await prisma.matchingJob.create({
        data: {
          targetUserId: virtualProfileId,
          matchmakerId,
          method: `${method}-virtual`,
          status: 'processing', // מתחיל ישר ב-processing
          progress: 5,
          progressMessage: 'מתחיל חיפוש וירטואלי...'
        }
      });

      console.log(`[MatchingJob] 🆕 Created virtual job: ${newJob.id}`);

      // 🔥 הפעלת עיבוד ישיר (לא fire-and-forget!)
      // משתמשים ב-Promise שלא מחכים לו, אבל מעבדים ישירות
      processVirtualSearchDirectly(newJob.id, {
        virtualProfileId,
        virtualProfile,
        gender,
        religiousLevel,
        editedSummary,
        method,
        matchmakerId,
      }).catch(err => {
        console.error(`[MatchingJob] ❌ Virtual search processing error:`, err);
      });

      // מחזירים תשובה מיידית עם ה-jobId
      return NextResponse.json({
        success: true,
        jobId: newJob.id,
        status: 'processing',
        progress: 5,
        progressMessage: 'מתחיל חיפוש וירטואלי...',
        isVirtualSearch: true,
      });
    }

    // ================================================================
    // 👤 חיפוש רגיל - ממשיך כרגיל
    // ================================================================
    
    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "targetUserId is required" 
      }, { status: 400 });
    }

    console.log(`[MatchingJob] 📋 New request from ${session.user.email}`);
    console.log(`[MatchingJob] Target: ${targetUserId}, Method: ${method}`);

    // בדיקה אם יש Job פעיל קיים לאותו משתמש
    const existingActiveJob = await prisma.matchingJob.findFirst({
      where: {
        targetUserId,
        method,
        status: { in: ['pending', 'processing'] }
      }
    });

    if (existingActiveJob) {
      console.log(`[MatchingJob] ⏳ Found existing active job: ${existingActiveJob.id}`);
      return NextResponse.json({
        success: true,
        jobId: existingActiveJob.id,
        status: existingActiveJob.status,
        progress: existingActiveJob.progress,
        progressMessage: existingActiveJob.progressMessage,
        isExisting: true
      });
    }

    // בדיקת Cache
    if (!forceRefresh) {
      const recentCompletedJob = await prisma.matchingJob.findFirst({
        where: {
          targetUserId,
          method,
          status: 'completed',
          completedAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      if (recentCompletedJob && recentCompletedJob.result) {
        console.log(`[MatchingJob] ✅ Using cached results from ${recentCompletedJob.completedAt}`);
        return NextResponse.json({
          success: true,
          jobId: recentCompletedJob.id,
          status: 'completed',
          progress: 100,
          fromCache: true,
          result: recentCompletedJob.result,
          meta: {
            completedAt: recentCompletedJob.completedAt,
            matchesFound: recentCompletedJob.matchesFound,
            totalCandidates: recentCompletedJob.totalCandidates
          }
        });
      }
    }

    // יצירת Job חדש
    const newJob = await prisma.matchingJob.create({
      data: {
        targetUserId,
        matchmakerId,
        method,
        status: 'pending',
        progress: 0,
        progressMessage: 'ממתין להתחלה...'
      }
    });

    console.log(`[MatchingJob] 🆕 Created new job: ${newJob.id}`);

    // הפעלת עיבוד ברקע (לחיפוש רגיל)
    triggerBackgroundProcessing(newJob.id).catch(err => {
      console.error(`[MatchingJob] Failed to trigger background processing:`, err);
    });

    return NextResponse.json({
      success: true,
      jobId: newJob.id,
      status: 'pending',
      progress: 0,
      progressMessage: 'ממתין להתחלה...'
    });

  } catch (error) {
    console.error('[MatchingJob] POST Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// ============================================================================
// 🔮 עיבוד ישיר של חיפוש וירטואלי (לא fire-and-forget!)
// ============================================================================

async function processVirtualSearchDirectly(
  jobId: string,
  params: VirtualProcessingParams
): Promise<void> {
  const startTime = Date.now();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[VirtualSearch] 🚀 Starting direct processing for job: ${jobId}`);
  console.log(`[VirtualSearch] Method: ${params.method}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // עדכון התקדמות
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        progress: 10,
        progressMessage: 'טוען פרופיל וירטואלי...'
      }
    });

    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        progress: 20,
        progressMessage: 'מחפש התאמות...'
      }
    });

    let result;

    // בחירת שיטת חיפוש
    if (params.method === 'vector' || params.method === 'vector-virtual') {
      console.log(`[VirtualSearch] 🔷 Using Vector Search`);
      
      await prisma.matchingJob.update({
        where: { id: jobId },
        data: {
          progress: 40,
          progressMessage: 'מבצע חיפוש וקטורי...'
        }
      });

      result = await findMatchesForVirtualUserVector(
        params.virtualProfileId,
        params.virtualProfile,
        params.gender as Gender,
        params.religiousLevel,
        params.matchmakerId,
        params.editedSummary
      );

    } else {
      console.log(`[VirtualSearch] 🧠 Using Algorithmic Search`);
      
      await prisma.matchingJob.update({
        where: { id: jobId },
        data: {
          progress: 40,
          progressMessage: 'מנתח מועמדים פוטנציאליים...'
        }
      });

      result = await findMatchesForVirtualUser(
        params.virtualProfileId,
        null, // name - לא נדרש
        params.virtualProfile,
        params.gender as Gender,
        params.religiousLevel,
        params.matchmakerId,
        params.editedSummary
      );
    }

    // חישוב זמן ריצה
    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(1);

    // שמירת התוצאות
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        progressMessage: `הושלם! נמצאו ${result.matches.length} התאמות`,
        result: result.matches as any,
        matchesFound: result.matches.length,
        totalCandidates: result.meta?.totalCandidatesScanned || 0,
        completedAt: new Date()
      }
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[VirtualSearch] ✅ Job ${jobId} completed successfully!`);
    console.log(`[VirtualSearch] ⏱️ Duration: ${durationSeconds} seconds`);
    console.log(`[VirtualSearch] 📊 Matches found: ${result.matches.length}`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`\n${'='.repeat(60)}`);
    console.error(`[VirtualSearch] ❌ Job ${jobId} FAILED after ${(duration/1000).toFixed(1)}s`);
    console.error(`[VirtualSearch] Error:`, error);
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
      console.error(`[VirtualSearch] Failed to update job status:`, err);
    });
  }
}

// ============================================================================
// GET - בדיקת סטטוס Job
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const targetUserId = searchParams.get('targetUserId');

    // אם אין jobId - מחזיר רשימת jobs או מידע על ה-API
    if (!jobId) {
      // אם יש targetUserId - מחזיר את ה-jobs שלו
      if (targetUserId) {
        const jobs = await prisma.matchingJob.findMany({
          where: { targetUserId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            progress: true,
            method: true,
            matchesFound: true,
            createdAt: true,
            completedAt: true
          }
        });
        return NextResponse.json({ success: true, jobs });
      }

      // אחרת - מחזיר מידע על ה-API
      return NextResponse.json({
        name: "NeshamaTech Matching API with Background Jobs",
        version: "4.1",
        endpoints: {
          "POST": "Start a new matching job",
          "GET ?jobId=xxx": "Check job status",
          "GET ?targetUserId=xxx": "List jobs for user",
          "DELETE ?jobId=xxx": "Cancel/delete a job"
        }
      });
    }

    // שליפת Job ספציפי
    const job = await prisma.matchingJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: "Job not found" 
      }, { status: 404 });
    }

    // מחזיר את הסטטוס
    return NextResponse.json({
      success: true,
      jobId: job.id,
      targetUserId: job.targetUserId,
      method: job.method,
      status: job.status,
      progress: job.progress,
      progressMessage: job.progressMessage,
      result: job.status === 'completed' ? job.result : null,
      error: job.error,
      meta: {
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        matchesFound: job.matchesFound,
        totalCandidates: job.totalCandidates
      }
    });

  } catch (error) {
    console.error('[MatchingJob] GET Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - ביטול/מחיקת Job
// ============================================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: "jobId is required" 
      }, { status: 400 });
    }

    // מוחק או מסמן כ-cancelled
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: { 
        status: 'failed',
        error: 'Cancelled by user'
      }
    });

    return NextResponse.json({
      success: true,
      message: "Job cancelled"
    });

  } catch (error) {
    console.error('[MatchingJob] DELETE Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// ============================================================================
// Background Processing Trigger (לחיפוש רגיל בלבד)
// ============================================================================

async function triggerBackgroundProcessing(jobId: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log(`[MatchingJob] 🚀 Triggering background processing for job: ${jobId}`);
  console.log(`[MatchingJob] 🌐 Base URL: ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/ai/process-matching-job`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || 'default-secret'
      },
      body: JSON.stringify({ jobId })
    });
    
    console.log(`[MatchingJob] ✅ Background job triggered, status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[MatchingJob] ⚠️ Background trigger returned error:`, errorText);
    }
    
  } catch (err) {
    // אם הקריאה נכשלה, מעדכנים את ה-Job עם שגיאה
    console.error(`[MatchingJob] ❌ Failed to trigger background processing:`, err);
    
    // עדכון Job לסטטוס שגיאה
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: `Failed to start background processing: ${err instanceof Error ? err.message : 'Unknown error'}`,
        progressMessage: 'שגיאה בהפעלת החיפוש'
      }
    }).catch(updateErr => {
      console.error(`[MatchingJob] Failed to update job status:`, updateErr);
    });
  }
}