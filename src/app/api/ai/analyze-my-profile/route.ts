// src/app/api/ai/analyze-my-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import profileAiService from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';
import prisma from '@/lib/prisma';

// -----------------------------------------------------------------------------
// הגדרות תצורה ל-Next.js כדי למנוע Timeout ו-Caching
// -----------------------------------------------------------------------------

// מאפשר לפונקציה לרוץ עד 300 שניות (במקום ברירת המחדל של 10-15 שניות).
// זה קריטי לקריאות AI שלוקחות זמן.
export const maxDuration = 300; 

// מוודא שהנתיב תמיד דינמי ולא נשמר ב-Cache של השרת
export const dynamic = 'force-dynamic';

/**
 * מטפל בבקשות POST לניתוח פרופיל המשתמש באמצעות AI.
 * הפונקציה מאמתת את המשתמש, יוצרת פרופיל נרטיבי מקיף,
 * שולחת אותו לניתוח AI, ומחזירה את התוצאה המובנית.
 */
export async function POST(req: NextRequest) {
  // בדיקת Rate Limit
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { requests: 15, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // שלב 1: אימות משתמש
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn('[API analyze-my-profile] ניסיון גישה לא מורשה.');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // שלב 2: ודא שהמשתמש והפרופיל קיימים לפני יצירת הנרטיב
    const userProfileExists = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!userProfileExists) {
        console.error(`[API analyze-my-profile] לא נמצא פרופיל עבור משתמש: ${userId}`);
        return NextResponse.json({ success: false, message: 'Profile not found.' }, { status: 404 });
    }

    // שלב 3: יצירת פרופיל נרטיבי מקיף
    // שימוש חוזר בלוגיקה הקיימת והמצוינת מ-profileAiService
    const narrativeProfile = await profileAiService.generateNarrativeProfile(userId);

    if (!narrativeProfile) {
      console.error(`[API analyze-my-profile] נכשל ביצירת פרופיל נרטיבי עבור: ${userId}`);
      return NextResponse.json({ success: false, message: 'Could not generate user profile narrative.' }, { status: 500 });
    }

    // שלב 4: שליחת הנרטיב לניתוח AI
    const analysisResult = await aiService.getProfileAnalysis(narrativeProfile);

    if (!analysisResult) {
      console.error(`[API analyze-my-profile] שירות ה-AI לא החזיר תוצאה עבור: ${userId}`);
      return NextResponse.json({ success: false, message: 'AI service failed to produce an analysis.' }, { status: 500 });
    }

    // שלב 5: החזרת התוצאה ללקוח
    return NextResponse.json({ success: true, data: analysisResult });

  } catch (error) {
    console.error('[API analyze-my-profile] שגיאה פטאלית ב-endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}