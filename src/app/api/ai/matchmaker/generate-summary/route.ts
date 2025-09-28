// src/app/api/ai/matchmaker/generate-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import profileAiService from '@/lib/services/profileAiService';
import aiService from '@/lib/services/aiService';

export async function POST(req: NextRequest) {
  try {
    // 1. אימות והרשאות (שדכן או אדמין בלבד)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. קבלת ID המועמד מגוף הבקשה
    const body = await req.json();
const { userId, locale } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, message: 'Bad Request: userId is required.' }, { status: 400 });
    }

    // 3. יצירת פרופיל נרטיבי מקיף
    const narrativeProfile = await profileAiService.generateNarrativeProfile(userId);
    if (!narrativeProfile) {
      return NextResponse.json({ success: false, message: 'Could not generate user profile narrative.' }, { status: 500 });
    }

    // 4. שליחת הנרטיב ל-AI ליצירת הסיכום
const summaryResult = await aiService.generateNeshamaTechSummary(narrativeProfile, locale);
    if (!summaryResult || !summaryResult.summaryText) {
      return NextResponse.json({ success: false, message: 'AI service failed to produce a summary.' }, { status: 500 });
    }

    // 5. החזרת התוצאה המוצלחת
    return NextResponse.json({ success: true, summary: summaryResult.summaryText });

  } catch (error) {
    console.error('[API generate-summary] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ success: false, message: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}