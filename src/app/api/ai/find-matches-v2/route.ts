// src/app/api/ai/find-matches-v2/route.ts
// 🎯 API Route לאלגוריתם מציאת התאמות V3.1 - עם Background Jobs
// תומך בסריקה מלאה + ניתוח מעמיק + עבודות רקע

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { addMatchingJob } from "@/lib/queue/matchingQueue";
import { 
  loadSavedMatches,
  deleteSavedMatches,
} from "@/lib/services/matchingAlgorithmService";

// הגדרות - כבר לא צריך maxDuration ארוך כי העבודה רצה ברקע
export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface PostRequestBody {
  targetUserId: string;
  forceRefresh?: boolean;
}

// ============================================================================
// POST - התחלת עבודת חיפוש (מחזיר jobId מיד)
// ============================================================================

/**
 * POST /api/ai/find-matches-v2
 * 
 * מתחיל עבודת חיפוש ברקע.
 * - אם forceRefresh=false ויש cache תקין, מחזיר מהcache מיד
 * - אחרת, יוצר Job ומחזיר jobId לpolling
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate Limiting
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { 
    requests: 30, 
    window: '1 h' 
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized: Please log in" 
      }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Matchmaker or Admin access required" 
      }, { status: 403 });
    }

    // Body Validation
    const body: PostRequestBody = await req.json();
    const { targetUserId, forceRefresh = false } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' (string) is required" 
      }, { status: 400 });
    }

    const matchmakerId = session.user.id;

    console.log(`[API find-matches V3.1] POST from ${session.user.email}`);
    console.log(`[API find-matches V3.1] Target: ${targetUserId}, forceRefresh: ${forceRefresh}`);

    // אם לא מבקשים רענון, בדוק אם יש cache תקין
    if (!forceRefresh) {
      const cached = await loadSavedMatches(targetUserId);
      
      if (cached && !cached.meta.isStale) {
        console.log(`[API find-matches V3.1] Returning cached results (${cached.matches.length} matches)`);
        
        return NextResponse.json({
          success: true,
          matches: cached.matches,
          fromCache: true,
          meta: {
            targetUserId,
            totalMatches: cached.matches.length,
            totalCandidatesScanned: cached.meta.totalCandidatesScanned,
            analyzedAt: new Date().toISOString(),
            algorithmVersion: cached.meta.algorithmVersion,
            savedAt: cached.meta.savedAt?.toISOString(),
            isStale: false,
          }
        });
      }
    }

    // בדוק אם יש כבר עבודה רצה עבור המועמד הזה
    const existingJob = await prisma.matchingJob.findFirst({
      where: {
        targetUserId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingJob) {
      console.log(`[API find-matches V3.1] Found existing job: ${existingJob.id}`);
      return NextResponse.json({
        success: true,
        jobId: existingJob.id,
        status: existingJob.status.toLowerCase(),
        progress: existingJob.progress,
        stage: existingJob.stage,
        message: 'Job already in progress',
      });
    }

    // צור עבודה חדשה ב-DB
    const job = await prisma.matchingJob.create({
      data: {
        targetUserId,
        matchmakerId,
        status: 'PENDING',
        progress: 0,
        stage: 'queued',
      },
    });

    console.log(`[API find-matches V3.1] Created job: ${job.id}`);

    // הוסף לתור העבודות
    await addMatchingJob({
      jobId: job.id,
      targetUserId,
      matchmakerId,
      forceRefresh,
    });

    // החזר מיד את ה-jobId
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'pending',
      progress: 0,
      stage: 'queued',
      message: 'Job started. Poll /api/ai/find-matches-v2/status?jobId=... for updates',
    });

  } catch (error) {
    console.error('[API find-matches V3.1] Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: errorMessage
    }, { status: 500 });
  }
}

// ============================================================================
// GET - טעינת תוצאות שמורות בלבד
// ============================================================================

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({
        name: "NeshamaTech Matching Algorithm V3.1",
        version: "3.1-background-jobs",
        description: "Smart matching algorithm with background processing",
        endpoints: {
          "POST /api/ai/find-matches-v2": "Start matching job",
          "GET /api/ai/find-matches-v2?targetUserId=...": "Load saved matches",
          "GET /api/ai/find-matches-v2/status?jobId=...": "Check job status",
          "DELETE /api/ai/find-matches-v2?targetUserId=...": "Clear saved matches"
        }
      });
    }

    const savedResults = await loadSavedMatches(targetUserId);

    if (!savedResults) {
      return NextResponse.json({
        success: true,
        matches: [],
        fromCache: false,
        meta: { targetUserId, totalMatches: 0, message: 'No saved matches found.' }
      });
    }

    return NextResponse.json({
      success: true,
      matches: savedResults.matches,
      fromCache: true,
      meta: {
        targetUserId,
        totalMatches: savedResults.matches.length,
        totalCandidatesScanned: savedResults.meta.totalCandidatesScanned,
        algorithmVersion: savedResults.meta.algorithmVersion,
        savedAt: savedResults.meta.savedAt.toISOString(),
        isStale: savedResults.meta.isStale,
      }
    });

  } catch (error) {
    console.error('[API find-matches V3.1] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// DELETE - מחיקת תוצאות שמורות
// ============================================================================

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' required" 
      }, { status: 400 });
    }

    await deleteSavedMatches(targetUserId);

    return NextResponse.json({
      success: true,
      message: `Saved matches for ${targetUserId} deleted`
    });

  } catch (error) {
    console.error('[API find-matches V3.1] DELETE Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}