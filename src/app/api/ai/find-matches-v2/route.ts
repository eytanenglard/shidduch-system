// ===========================================
// src/app/api/ai/find-matches-v2/route.ts
// ===========================================
// 🎯 API Route לאלגוריתם מציאת התאמות
// תומך בשתי שיטות: Vector Search ו-Algorithmic

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
import {
  findMatchesWithVector,
  loadSavedVectorMatches,
  deleteSavedVectorMatches,
} from "@/lib/services/vectorMatchingService";

// הגדרות
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // מאפשר עד 2 דקות

// ============================================================================
// TYPES
// ============================================================================

interface PostRequestBody {
  targetUserId: string;
  forceRefresh?: boolean;
  method?: 'algorithmic' | 'vector'; // ברירת מחדל: algorithmic
}

// ============================================================================
// POST - מריץ את האלגוריתם (לפי השיטה שנבחרה)
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
    const { targetUserId, forceRefresh = false, method = 'algorithmic' } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' (string) is required" 
      }, { status: 400 });
    }

    const matchmakerId = session.user.id;

    console.log(`\n========================================`);
    console.log(`[API find-matches] POST from ${session.user.email}`);
    console.log(`[API find-matches] Target: ${targetUserId}`);
    console.log(`[API find-matches] Method: ${method}, forceRefresh: ${forceRefresh}`);
    console.log(`========================================\n`);

    // 🚀 הרצת האלגוריתם לפי השיטה שנבחרה
    let result;

    if (method === 'vector') {
      // שיטת Vector Search
      result = await findMatchesWithVector(targetUserId, matchmakerId, {
        forceRefresh,
        autoSave: true,
      });
    } else {
      // שיטה אלגוריתמית (ברירת מחדל)
      result = await findMatchesForUser(targetUserId, matchmakerId, {
        forceRefresh,
        autoSave: true,
      });
    }

    const duration = Date.now() - startTime;
    
    console.log(`\n========================================`);
    console.log(`[API find-matches] ✅ Completed in ${duration}ms`);
    console.log(`[API find-matches] Method: ${method}`);
    console.log(`[API find-matches] Found ${result.matches.length} matches`);
    console.log(`[API find-matches] From cache: ${result.fromCache}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      matches: result.matches,
      fromCache: result.fromCache,
      method, // מחזיר את השיטה שבה השתמשנו
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
    console.error(`[API find-matches] ❌ Error after ${duration}ms:`, error);
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
// GET - טעינת תוצאות שמורות (לפי שיטה)
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
    const method = searchParams.get('method') || 'algorithmic';

    if (!targetUserId) {
      return NextResponse.json({
        name: "NeshamaTech Matching Algorithm",
        version: "3.2-dual-mode",
        description: "Smart matching algorithm - supports both Vector and Algorithmic methods",
        endpoints: {
          "POST /api/ai/find-matches-v2": "Run matching (method: 'algorithmic' | 'vector')",
          "GET /api/ai/find-matches-v2?targetUserId=...&method=...": "Load saved matches",
          "DELETE /api/ai/find-matches-v2?targetUserId=...&method=...": "Clear saved matches"
        }
      });
    }

    // טעינת תוצאות לפי השיטה
    let savedResults;
    if (method === 'vector') {
      savedResults = await loadSavedVectorMatches(targetUserId);
    } else {
      savedResults = await loadSavedMatches(targetUserId);
    }

    if (!savedResults) {
      return NextResponse.json({
        success: true,
        matches: [],
        fromCache: false,
        method,
        meta: { targetUserId, totalMatches: 0, message: 'No saved matches found.' }
      });
    }

    return NextResponse.json({
      success: true,
      matches: savedResults.matches,
      fromCache: true,
      method,
      meta: {
        targetUserId,
        totalMatches: savedResults.matches.length,
        totalCandidatesScanned: savedResults.meta.totalCandidatesScanned,
        algorithmVersion: savedResults.meta.algorithmVersion,
        savedAt: savedResults.meta.savedAt?.toISOString(),
        isStale: savedResults.meta.isStale,
      }
    });

  } catch (error) {
    console.error('[API find-matches] GET Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ============================================================================
// DELETE - מחיקת תוצאות שמורות (לפי שיטה)
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
    const method = searchParams.get('method') || 'both';

    if (!targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' required" 
      }, { status: 400 });
    }

    // מחיקה לפי השיטה
    if (method === 'vector' || method === 'both') {
      await deleteSavedVectorMatches(targetUserId);
    }
    if (method === 'algorithmic' || method === 'both') {
      await deleteSavedMatches(targetUserId);
    }

    return NextResponse.json({
      success: true,
      message: `Saved matches for ${targetUserId} deleted (method: ${method})`
    });

  } catch (error) {
    console.error('[API find-matches] DELETE Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}