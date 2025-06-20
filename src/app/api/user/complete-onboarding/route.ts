// src/app/api/user/complete-onboarding/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // ודא שהנתיב נכון לקובץ ה-auth שלך
import prisma from "@/lib/prisma"; // ודא שהנתיב נכון לקובץ ה-prisma client שלך

export async function POST(req: Request) {
  try {
    // 1. אימות הסשן של המשתמש בצד השרת
    const session = await getServerSession(authOptions);

    // 2. בדיקה אם המשתמש מחובר
    if (!session || !session.user || !session.user.id) {
      console.warn("[API/complete-onboarding] Unauthorized attempt: No session found.");
      return NextResponse.json(
        { success: false, error: "Unauthorized: User not authenticated." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`[API/complete-onboarding] Received request for user ID: ${userId}`);

    // 3. עדכון מסד הנתונים
    // אנו בודקים אם המשתמש כבר השלים את הסיור כדי למנוע כתיבות מיותרות ל-DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasCompletedOnboarding: true }
    });

    if (user?.hasCompletedOnboarding) {
      console.log(`[API/complete-onboarding] User ${userId} has already completed onboarding. No update needed.`);
      return NextResponse.json(
        { success: true, message: "Onboarding was already completed." },
        { status: 200 }
      );
    }
    
    // אם לא הושלם, עדכן את הדגל ל-true
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hasCompletedOnboarding: true,
      },
    });

    console.log(`[API/complete-onboarding] Successfully updated hasCompletedOnboarding for user ID: ${userId}`);

    // 4. החזרת תגובת הצלחה
    return NextResponse.json(
      { success: true, message: "Onboarding status updated successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[API/complete-onboarding] Error:", error);

    // טיפול בשגיאות כלליות
    let errorMessage = "An internal server error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}