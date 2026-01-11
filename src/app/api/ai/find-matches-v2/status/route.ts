// src/app/api/ai/find-matches-v2/status/route.ts
// 🎯 API Route לבדיקת סטטוס עבודת חיפוש

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { loadSavedMatches } from "@/lib/services/matchingAlgorithmService";

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/find-matches-v2/status?jobId=xyz
 * 
 * בודק סטטוס של עבודת חיפוש.
 * אם העבודה הסתיימה - מחזיר גם את התוצאות.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
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

    // Get jobId from query params
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'jobId' query parameter is required" 
      }, { status: 400 });
    }

    // מצא את העבודה
    const job = await prisma.matchingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: "Job not found" 
      }, { status: 404 });
    }

    // אם העבודה עדיין רצה - החזר סטטוס
    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: job.status.toLowerCase(),
        progress: job.progress,
        stage: job.stage,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString(),
      });
    }

    // אם העבודה נכשלה
    if (job.status === 'FAILED') {
      return NextResponse.json({
        success: false,
        jobId: job.id,
        status: 'failed',
        error: job.error || 'Unknown error',
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
      });
    }

    // אם העבודה הסתיימה בהצלחה - החזר גם את התוצאות
    if (job.status === 'COMPLETED') {
      // טען את התוצאות מה-SavedMatchSearch
      const savedResults = await loadSavedMatches(job.targetUserId);

      if (!savedResults) {
        return NextResponse.json({
          success: true,
          jobId: job.id,
          status: 'completed',
          matches: [],
          meta: {
            targetUserId: job.targetUserId,
            totalMatches: 0,
            completedAt: job.completedAt?.toISOString(),
            message: 'Job completed but no results saved',
          }
        });
      }

      return NextResponse.json({
        success: true,
        jobId: job.id,
        status: 'completed',
        matches: savedResults.matches,
        fromCache: false, // תוצאות חדשות, לא מcache
        meta: {
          targetUserId: job.targetUserId,
          totalMatches: savedResults.matches.length,
          totalCandidatesScanned: savedResults.meta.totalCandidatesScanned,
          algorithmVersion: savedResults.meta.algorithmVersion,
          savedAt: savedResults.meta.savedAt.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          duration: job.completedAt && job.startedAt 
            ? Math.round((job.completedAt.getTime() - job.startedAt.getTime()) / 1000)
            : null,
        }
      });
    }

    // Fallback
  return NextResponse.json({
      success: true,
      jobId: job.id,
      // 👇 הוספת "as string" פותרת את הבעיה
      status: (job.status as string).toLowerCase(),
      progress: job.progress,
    });

  } catch (error) {
    console.error('[API find-matches status] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}