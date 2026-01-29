// ===========================================
// src/app/api/ai/hybrid-scan/route.ts
// ===========================================
// 🎯 API Route לסריקה היברידית - משלב Metrics + Background + AI
// תומך ב-Background Jobs

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole, Gender } from "@prisma/client";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 דקות

// ============================================================================
// POST - התחלת סריקה היברידית
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

    const body = await req.json();
    const { 
      targetUserId, 
      forceRefresh = false,
      // אופציות סריקה
      options = {}
    } = body;

    const matchmakerId = session.user.id;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "targetUserId is required" 
      }, { status: 400 });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[HybridScan API] 🚀 New request from ${session.user.email}`);
    console.log(`[HybridScan API] Target: ${targetUserId}`);
    console.log(`[HybridScan API] ForceRefresh: ${forceRefresh}`);
    console.log(`${'='.repeat(60)}\n`);

    // בדיקה אם יש Job פעיל קיים
    const existingActiveJob = await prisma.matchingJob.findFirst({
      where: {
        targetUserId,
        method: 'hybrid',
        status: { in: ['pending', 'processing'] }
      }
    });

    if (existingActiveJob) {
      console.log(`[HybridScan API] ⏳ Found existing active job: ${existingActiveJob.id}`);
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
          method: 'hybrid',
          status: 'completed',
          completedAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 ימים
          }
        },
        orderBy: { completedAt: 'desc' }
      });

      if (recentCompletedJob && recentCompletedJob.result) {
        console.log(`[HybridScan API] ✅ Using cached results from ${recentCompletedJob.completedAt}`);
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
            totalCandidates: recentCompletedJob.totalCandidates,
            algorithmVersion: 'hybrid-v1'
          }
        });
      }
    }

    // יצירת Job חדש
    const newJob = await prisma.matchingJob.create({
      data: {
        targetUserId,
        matchmakerId,
        method: 'hybrid',
        status: 'pending',
        progress: 0,
        progressMessage: 'ממתין להתחלה...'
      }
    });

    console.log(`[HybridScan API] 🆕 Created new job: ${newJob.id}`);

    // הפעלת עיבוד ברקע
    triggerHybridProcessing(newJob.id, options).catch(err => {
      console.error(`[HybridScan API] Failed to trigger processing:`, err);
    });

    return NextResponse.json({
      success: true,
      jobId: newJob.id,
      status: 'pending',
      progress: 0,
      progressMessage: 'ממתין להתחלה...'
    });

  } catch (error) {
    console.error('[HybridScan API] POST Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
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

    if (!jobId && !targetUserId) {
      return NextResponse.json({
        name: "NeshamaTech Hybrid Matching API",
        version: "1.0",
        description: "משלב Metrics + Background Analysis + AI Deep Analysis",
        endpoints: {
          "POST": "Start a new hybrid scan job",
          "GET ?jobId=xxx": "Check job status",
          "GET ?targetUserId=xxx": "List hybrid jobs for user"
        }
      });
    }

    if (targetUserId && !jobId) {
      const jobs = await prisma.matchingJob.findMany({
        where: { 
          targetUserId,
          method: 'hybrid'
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          progress: true,
          matchesFound: true,
          createdAt: true,
          completedAt: true
        }
      });
      return NextResponse.json({ success: true, jobs });
    }

    const job = await prisma.matchingJob.findUnique({
      where: { id: jobId! }
    });

    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: "Job not found" 
      }, { status: 404 });
    }

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
    console.error('[HybridScan API] GET Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// ============================================================================
// Trigger Background Processing
// ============================================================================

async function triggerHybridProcessing(jobId: string, options: any = {}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log(`[HybridScan API] 🚀 Triggering hybrid processing for job: ${jobId}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/ai/process-hybrid-job`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_API_SECRET || 'default-secret'
      },
      body: JSON.stringify({ jobId, options })
    });
    
    console.log(`[HybridScan API] ✅ Background job triggered, status: ${response.status}`);
    
  } catch (err) {
    console.error(`[HybridScan API] ❌ Failed to trigger processing:`, err);
    
    await prisma.matchingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: `Failed to start: ${err instanceof Error ? err.message : 'Unknown error'}`,
        progressMessage: 'שגיאה בהפעלת הסריקה'
      }
    }).catch(() => {});
  }
}