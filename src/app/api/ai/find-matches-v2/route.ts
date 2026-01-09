// src/app/api/ai/find-matches-v2/route.ts
// 🎯 API Route לאלגוריתם מציאת התאמות V3.0 - NeshamaTech
// תומך בסריקה מלאה + ניתוח מעמיק + שמירת תוצאות

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { 
  findMatchesForUser, 
  loadSavedMatches,
  deleteSavedMatches,
  MatchResult,
  SavedSearchResult 
} from "@/lib/services/matchingAlgorithmService";

// הגדרות תצורה ל-Next.js
export const maxDuration = 300; // 5 דקות - צריך יותר זמן לסריקה מלאה
export const dynamic = 'force-dynamic';

// ============================================================================
// TYPES
// ============================================================================

interface PostRequestBody {
  targetUserId: string;
  maxCandidates?: number;  // לא בשימוש ב-V3 אבל נשאר לתאימות אחורה
  forceRefresh?: boolean;
}

// 🆕 Response מעודכן עם כל השדות החדשים
interface SuccessResponse {
  success: true;
  matches: MatchResult[];
  fromCache: boolean;
  meta: {
    targetUserId: string;
    totalMatches: number;
    totalCandidatesScanned?: number;  // 🆕 כמה מועמדים נסרקו בסה"כ
    analyzedAt: string;
    algorithmVersion: string;
    savedAt?: string;
    isStale?: boolean;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// ============================================================================
// POST - חיפוש התאמות (עם אפשרות לרענון)
// ============================================================================

/**
 * POST /api/ai/find-matches-v2
 * 
 * מציאת התאמות עבור יוזר מסומן.
 * V3.0: סורק את כל המועמדים הרלוונטיים, מבצע ניתוח מעמיק ל-Top 15.
 * 
 * Body:
 * - targetUserId: string (required)
 * - forceRefresh: boolean (optional, default: false)
 */
export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // Rate Limiting - מספיק מרווח בגלל הזמן הארוך
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { 
    requests: 20, 
    window: '1 h' 
  });
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ErrorResponse>;
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
    const { 
      targetUserId, 
      forceRefresh = false 
    } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' (string) is required" 
      }, { status: 400 });
    }

    const matchmakerId = session.user.id;

    console.log(`[API find-matches V3] POST from ${session.user.email}`);
    console.log(`[API find-matches V3] Target: ${targetUserId}, forceRefresh: ${forceRefresh}`);

    // Run the Algorithm V3.0
    const startTime = Date.now();
    const result = await findMatchesForUser(targetUserId, matchmakerId, {
      forceRefresh,
      autoSave: true,
    });
    const duration = Date.now() - startTime;

    console.log(`[API find-matches V3] Completed in ${duration}ms, ${result.fromCache ? 'FROM CACHE' : 'NEW SEARCH'}`);
    if (result.meta.totalCandidatesScanned) {
      console.log(`[API find-matches V3] Total candidates scanned: ${result.meta.totalCandidatesScanned}`);
    }

    // Response
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
      }
    });

  } catch (error) {
    console.error('[API find-matches V3] Error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    if (errorMessage.includes('GOOGLE_API_KEY')) {
      return NextResponse.json({ 
        success: false, 
        error: "Server configuration error",
        details: "AI service is not properly configured"
      }, { status: 500 });
    }

    if (errorMessage.includes('not found')) {
      return NextResponse.json({ 
        success: false, 
        error: errorMessage 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: errorMessage
    }, { status: 500 });
  }
}

// ============================================================================
// GET - טעינת תוצאות שמורות בלבד (בלי חיפוש חדש)
// ============================================================================

/**
 * GET /api/ai/find-matches-v2?targetUserId=xyz
 * 
 * טוען תוצאות שמורות בלבד, בלי לבצע חיפוש חדש.
 */
export async function GET(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse | object>> {
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

    // Get targetUserId from query params
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    // אם אין targetUserId - החזר מידע על ה-API
    if (!targetUserId) {
      return NextResponse.json({
        name: "NeshamaTech Matching Algorithm V3.0",
        version: "3.0-full-scan",
        description: "Smart matching algorithm with full candidate scanning and deep analysis",
        features: [
          "Full scan of all relevant candidates",
          "Batched first-pass analysis",
          "Deep analysis of top 15 candidates",
          "6-category scoring system",
          "Detailed reasoning for each match"
        ],
        endpoints: {
          GET: {
            description: "Load saved matches without new search",
            params: { targetUserId: "string (required)" }
          },
          POST: {
            description: "Find matches (uses cache by default)",
            body: {
              targetUserId: "string (required)",
              forceRefresh: "boolean (optional, default: false)"
            }
          },
          DELETE: {
            description: "Clear saved matches",
            params: { targetUserId: "string (required)" }
          }
        },
        scoringSystem: {
          religious: "35 points - Religious and spiritual compatibility",
          careerFamily: "15 points - Career/family balance alignment",
          lifestyle: "15 points - Lifestyle preferences (nature, depth, leisure)",
          ambition: "12 points - Ambition level compatibility",
          communication: "12 points - Energy and communication style",
          values: "11 points - Core values alignment"
        }
      });
    }

    console.log(`[API find-matches V3] GET saved matches for: ${targetUserId}`);

    // Load saved matches
    const savedResults = await loadSavedMatches(targetUserId);

    if (!savedResults) {
      return NextResponse.json({
        success: true,
        matches: [],
        fromCache: false,
        meta: {
          targetUserId,
          totalMatches: 0,
          analyzedAt: new Date().toISOString(),
          algorithmVersion: 'none',
          message: 'No saved matches found. Use POST to run a new search.'
        }
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
        analyzedAt: new Date().toISOString(),
        algorithmVersion: savedResults.meta.algorithmVersion,
        savedAt: savedResults.meta.savedAt.toISOString(),
        isStale: savedResults.meta.isStale,
        validCount: savedResults.meta.validCandidatesCount,
      }
    });

  } catch (error) {
    console.error('[API find-matches V3] GET Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE - מחיקת תוצאות שמורות
// ============================================================================

/**
 * DELETE /api/ai/find-matches-v2?targetUserId=xyz
 * 
 * מוחק את התוצאות השמורות עבור יוזר מסוים.
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
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

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' query parameter is required" 
      }, { status: 400 });
    }

    console.log(`[API find-matches V3] DELETE saved matches for: ${targetUserId}`);

    await deleteSavedMatches(targetUserId);

    return NextResponse.json({
      success: true,
      message: `Saved matches for user ${targetUserId} have been deleted`
    });

  } catch (error) {
    console.error('[API find-matches V3] DELETE Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}