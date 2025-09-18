// src/app/api/ai/matchmaker/analyze-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import profileAiService from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';
import prisma from '@/lib/prisma';
import { UserRole } from "@prisma/client";

/**
 * מטפל בבקשות POST לניתוח פרופיל של משתמש ספציפי על ידי שדכן.
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = await applyRateLimit(req, { requests: 20, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // שלב 1: אימות והרשאות (שדכן או אדמין בלבד)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      console.warn('[API matchmaker/analyze-profile] ניסיון גישה לא מורשה.');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // שלב 2: קבלת ID המועמד לניתוח מגוף הבקשה
    const body = await req.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
        console.error('[API matchmaker/analyze-profile] userId חסר או לא תקין בבקשה.');
        return NextResponse.json({ success: false, message: 'Bad Request: userId is required.' }, { status: 400 });
    }

    // שלב 3: יצירת פרופיל נרטיבי עבור המשתמש המבוקש
    const narrativeProfile = await profileAiService.generateNarrativeProfile(userId);

    if (!narrativeProfile) {
      console.error(`[API matchmaker/analyze-profile] נכשל ביצירת פרופיל נרטיבי עבור: ${userId}`);
      return NextResponse.json({ success: false, message: 'Could not generate user profile narrative.' }, { status: 500 });
    }

    // שלב 4: שליחת הנרטיב לניתוח AI
    const analysisResult = await aiService.getProfileAnalysis(narrativeProfile);

    if (!analysisResult) {
      console.error(`[API matchmaker/analyze-profile] שירות ה-AI לא החזיר תוצאה עבור: ${userId}`);
      return NextResponse.json({ success: false, message: 'AI service failed to produce an analysis.' }, { status: 500 });
    }

    // שלב 5: החזרת התוצאה המוצלחת
    return NextResponse.json({ success: true, data: analysisResult });

  } catch (error) {
    console.error('[API matchmaker/analyze-profile] שגיאה פטאלית ב-endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}