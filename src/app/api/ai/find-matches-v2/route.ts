// src/app/api/ai/find-matches-v2/route.ts
// 🎯 API Route לאלגוריתם מציאת התאמות - גרסה פשוטה (Inline)
// מריץ את האלגוריתם ישירות בתוך ה-Request - בלי Jobs!

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { 
  findMatchesForUser,
  loadSavedMatches,
  deleteSavedMatches,
} from "@/lib/services/matchingAlgorithmService";

// הגדרות
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Heroku timeout - 30 שניות default, אפשר עד 60

// ============================================================================
// TYPES
// ============================================================================

interface PostRequestBody {
  targetUserId: string;
  forceRefresh?: boolean;
}

// ============================================================================
// POST - מריץ את האלגוריתם ישירות ומחזיר תוצאות
// ============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
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

    console.log(`\n========================================`);
    console.log(`[API find-matches SIMPLE] POST from ${session.user.email}`);
    console.log(`[API find-matches SIMPLE] Target: ${targetUserId}, forceRefresh: ${forceRefresh}`);
    console.log(`========================================\n`);

    // 🚀 הרצת האלגוריתם ישירות!
    const result = await findMatchesForUser(targetUserId, matchmakerId, {
      forceRefresh,
      autoSave: true,
    });

    const duration = Date.now() - startTime;
    
    console.log(`\n========================================`);
    console.log(`[API find-matches SIMPLE] ✅ Completed in ${duration}ms`);
    console.log(`[API find-matches SIMPLE] Found ${result.matches.length} matches`);
    console.log(`[API find-matches SIMPLE] From cache: ${result.fromCache}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      matches: result.matches,
      fromCache: result.fromCache,
      meta: {
        targetUserId,
        totalMatches: result.matches.length,
        totalCandidatesScanned: result.meta.totalCandidatesScanned,
        analyzedAt: new Date().toISOString(),
        algorithmVersion: result.meta.algorithmVersion,
        savedAt: result.meta.savedAt?.toISOString(),
        isStale: result.meta.isStale,
        durationMs: duration,
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[API find-matches SIMPLE] ❌ Error after ${duration}ms:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: errorMessage,
      durationMs: duration,
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
        name: "NeshamaTech Matching Algorithm",
        version: "3.2-simple",
        description: "Smart matching algorithm - inline execution",
        endpoints: {
          "POST /api/ai/find-matches-v2": "Run matching algorithm (inline)",
          "GET /api/ai/find-matches-v2?targetUserId=...": "Load saved matches",
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
    console.error('[API find-matches SIMPLE] GET Error:', error);
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
    console.error('[API find-matches SIMPLE] DELETE Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}