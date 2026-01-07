// src/app/api/ai/find-matches-v2/route.ts
// 🎯 API Route לאלגוריתם מציאת התאמות V2 - NeshamaTech

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { findMatchesForUser, MatchResult } from "@/lib/services/matchingAlgorithmService";

// הגדרות תצורה ל-Next.js
export const maxDuration = 120; // עד 2 דקות לניתוח AI
export const dynamic = 'force-dynamic';

interface RequestBody {
  targetUserId: string;
  maxCandidates?: number;
}

interface SuccessResponse {
  success: true;
  matches: MatchResult[];
  meta: {
    targetUserId: string;
    totalMatches: number;
    analyzedAt: string;
    algorithmVersion: string;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

/**
 * POST /api/ai/find-matches-v2
 * 
 * מציאת התאמות עבור יוזר מסומן באמצעות האלגוריתם החדש:
 * 1. סינון חכם לפי גיל, מגדר, ורמה דתית
 * 2. ניתוח AI מעמיק של ההתאמות
 * 
 * Body:
 * - targetUserId: string (required) - מזהה היוזר המסומן
 * - maxCandidates: number (optional, default: 15) - מספר מועמדים מקסימלי לניתוח
 * 
 * Response:
 * - matches: Array<{ userId, score, reasoning, firstName, lastName }>
 * - meta: { targetUserId, totalMatches, analyzedAt, algorithmVersion }
 */
export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // Rate Limiting
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { 
    requests: 10, 
    window: '1 h' 
  });
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse<ErrorResponse>;
  }

  try {
    // 1. Authentication and Authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized: Please log in" 
      }, { status: 401 });
    }

    // רק שדכנים ואדמינים יכולים להשתמש בפיצ'ר זה
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Matchmaker or Admin access required" 
      }, { status: 403 });
    }

    // 2. Body Validation
    const body: RequestBody = await req.json();
    const { targetUserId, maxCandidates = 15 } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ 
        success: false, 
        error: "Bad Request: 'targetUserId' (string) is required" 
      }, { status: 400 });
    }

    // וידוא מספר מועמדים בטווח סביר
    const validatedMaxCandidates = Math.min(Math.max(5, maxCandidates), 30);

    console.log(`[API find-matches-v2] Request from ${session.user.email}`);
    console.log(`[API find-matches-v2] Target user: ${targetUserId}, Max candidates: ${validatedMaxCandidates}`);

    // 3. Run the Matching Algorithm
    const startTime = Date.now();
    const matches = await findMatchesForUser(targetUserId, validatedMaxCandidates);
    const duration = Date.now() - startTime;

    console.log(`[API find-matches-v2] Completed in ${duration}ms, found ${matches.length} matches`);

    // 4. Return Success Response
    return NextResponse.json({
      success: true,
      matches,
      meta: {
        targetUserId,
        totalMatches: matches.length,
        analyzedAt: new Date().toISOString(),
        algorithmVersion: 'v2.0-ai-enhanced',
      }
    });

  } catch (error) {
    console.error('[API find-matches-v2] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    // בדיקה אם זו שגיאת API key
    if (errorMessage.includes('GOOGLE_API_KEY')) {
      return NextResponse.json({ 
        success: false, 
        error: "Server configuration error",
        details: "AI service is not properly configured"
      }, { status: 500 });
    }

    // בדיקה אם היוזר לא נמצא
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

/**
 * GET /api/ai/find-matches-v2
 * 
 * מחזיר מידע על ה-API (לבדיקת תקינות)
 */
export async function GET() {
  return NextResponse.json({
    name: "NeshamaTech Matching Algorithm V2",
    version: "2.0-ai-enhanced",
    description: "Smart matching algorithm combining age/religious filtering with AI analysis",
    endpoints: {
      POST: {
        description: "Find matches for a target user",
        body: {
          targetUserId: "string (required)",
          maxCandidates: "number (optional, default: 15, max: 30)"
        },
        response: {
          matches: "Array of match results with scores and reasoning",
          meta: "Metadata about the analysis"
        }
      }
    },
    features: [
      "Age-based filtering (M: -7/+5, F: -5/+5)",
      "Religious level compatibility mapping",
      "AI-powered personality analysis",
      "Detailed reasoning for each match"
    ]
  });
}