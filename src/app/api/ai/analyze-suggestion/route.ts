// src/app/api/ai/analyze-suggestion/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import profileAiService from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';
import prisma from '@/lib/prisma';

/**
 * מטפל בבקשות POST לניתוח הצעת שידוך עבור המשתמש המחובר.
 * הפונקציה מאמתת את המשתמש, מאחזרת את הפרופיל שלו ואת הפרופיל של המשתמש המוצע,
 * יוצרת פרופילים נרטיביים עבור שניהם, שולחת אותם לניתוח AI מותאם למשתמש,
 * ומחזירה את התוצאה המובנית.
 */
export async function POST(req: Request) {
  try {
    // 1. אימות וקבלת המשתמש הנוכחי
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn('[API analyze-suggestion] ניסיון גישה לא מורשה.');
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const currentUserId = session.user.id;

    // 2. קבלת ID של המשתמש המוצע מגוף הבקשה
    const body = await req.json();
    const { suggestedUserId } = body;

    if (!suggestedUserId || typeof suggestedUserId !== 'string') {
      console.error('[API analyze-suggestion] Invalid or missing suggestedUserId in request body.');
      return NextResponse.json({ success: false, message: 'Bad Request: suggestedUserId is required.' }, { status: 400 });
    }


    // 3. ודא ששני הפרופילים קיימים
    const profilesExist = await prisma.profile.findMany({
      where: {
        userId: { in: [currentUserId, suggestedUserId] }
      },
      select: { userId: true }
    });

    if (profilesExist.length !== 2) {
      console.error(`[API analyze-suggestion] אחד הפרופילים או שניהם לא נמצאו. נמצאו: ${profilesExist.map(p => p.userId).join(', ')}`);
      return NextResponse.json({ success: false, message: 'One or both user profiles could not be found.' }, { status: 404 });
    }

    // 4. יצירת פרופילים נרטיביים עבור שני המשתמשים במקביל
    const [currentUserNarrative, suggestedUserNarrative] = await Promise.all([
      profileAiService.generateNarrativeProfile(currentUserId),
      profileAiService.generateNarrativeProfile(suggestedUserId)
    ]);

    if (!currentUserNarrative || !suggestedUserNarrative) {
      console.error(`[API analyze-suggestion] נכשל ביצירת פרופיל נרטיבי עבור אחד המשתמשים.`);
      return NextResponse.json({ success: false, message: 'Could not generate user profile narratives.' }, { status: 500 });
    }

    // 5. שליחת הנרטיבים לניתוח AI מותאם למשתמש
    const analysisResult = await aiService.analyzeSuggestionForUser(
      currentUserNarrative,
      suggestedUserNarrative
    );

    if (!analysisResult) {
      console.error(`[API analyze-suggestion] שירות ה-AI לא החזיר תוצאת ניתוח הצעה.`);
      return NextResponse.json({ success: false, message: 'AI service failed to produce a suggestion analysis.' }, { status: 500 });
    }

    // 6. החזרת התוצאה ללקוח
    return NextResponse.json({ success: true, data: analysisResult });

  } catch (error) {
    console.error('[API analyze-suggestion] שגיאה פטאלית ב-endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}