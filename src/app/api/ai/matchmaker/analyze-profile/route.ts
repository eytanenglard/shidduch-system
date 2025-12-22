// src/app/api/ai/matchmaker/analyze-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import profileAiService from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';
import prisma from '@/lib/prisma';
import { UserRole } from "@prisma/client";

/**
 * מטפל בבקשות POST ליצירת סיכום פרופיל (אישיות + מה מחפש) עבור שדכן.
 * בודק מטמון בדאטה בייס לפני פנייה ל-AI.
 */
export async function POST(req: NextRequest) {
  // הגבלת קצב בקשות
  const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { requests: 20, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // 1. אימות והרשאות (שדכן או אדמין בלבד)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      console.warn('[API matchmaker/analyze-profile] ניסיון גישה לא מורשה.');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. קבלת פרמטרים מגוף הבקשה
    const body = await req.json();
    const { userId, forceRefresh } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, message: 'Bad Request: userId is required.' }, { status: 400 });
    }

    // 3. שליפת הפרופיל והשדה החדש מהדאטה בייס לבדיקת מטמון
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { 
        aiProfileSummary: true, 
        needsAiProfileUpdate: true 
      }
    });

    if (!existingProfile) {
      return NextResponse.json({ success: false, message: 'Profile not found.' }, { status: 404 });
    }

    // 4. לוגיקת מטמון: אם יש סיכום שמור, הפרופיל לא השתנה, ולא ביקשנו רענון בכוח -> נחזיר את הקיים
    if (
      existingProfile.aiProfileSummary && 
      !existingProfile.needsAiProfileUpdate && 
      !forceRefresh
    ) {
      console.log(`[API analyze-profile] Returning cached summary for user: ${userId}`);
      return NextResponse.json({ success: true, data: existingProfile.aiProfileSummary });
    }

    console.log(`[API analyze-profile] Generating NEW summary for user: ${userId} (Force: ${forceRefresh})`);

    // 5. יצירת פרופיל נרטיבי מקיף (טקסט גולמי ל-AI)
    const narrativeProfile = await profileAiService.generateNarrativeProfile(userId);

    if (!narrativeProfile) {
      console.error(`[API matchmaker/analyze-profile] נכשל ביצירת פרופיל נרטיבי עבור: ${userId}`);
      return NextResponse.json({ success: false, message: 'Could not generate user profile narrative.' }, { status: 500 });
    }

    // 6. שליחת הנרטיב לניתוח AI (שימוש בפונקציה החדשה והממוקדת)
    const summaryResult = await aiService.generateProfileSummary(narrativeProfile);

    if (!summaryResult) {
      console.error(`[API matchmaker/analyze-profile] שירות ה-AI לא החזיר תוצאה עבור: ${userId}`);
      return NextResponse.json({ success: false, message: 'AI service failed to produce a summary.' }, { status: 500 });
    }

    // 7. שמירת התוצאה בדאטה בייס (בשדה החדש aiProfileSummary) ואיפוס הדגל needsAiProfileUpdate
    await prisma.profile.update({
      where: { userId },
      data: {
        aiProfileSummary: summaryResult as any, // המרה ל-Json של פריזמה
        needsAiProfileUpdate: false // הדוח מעודכן כעת
      }
    });

    // 8. החזרת התוצאה החדשה ללקוח
    return NextResponse.json({ success: true, data: summaryResult });

  } catch (error) {
    console.error('[API matchmaker/analyze-profile] שגיאה פטאלית ב-endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}