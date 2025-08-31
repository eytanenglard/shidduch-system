// src/app/api/auth/resend-verification/route.ts

import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/email/emailService";
import { VerificationService } from "@/lib/services/verificationService";
import { VerificationType } from "@prisma/client";
import { applyRateLimit } from "@/lib/rate-limiter";

/**
 * מטפל בבקשות לשליחה חוזרת של קוד אימות למייל.
 * נקודת קצה זו נועדה למשתמשים שנרשמו אך לא קיבלו את קוד האימות הראשוני.
 */
export async function POST(req: NextRequest) {
  // 1. הגבלת קצב בקשות למניעת שימוש לרעה ושליחת ספאם
  const rateLimitResponse = await applyRateLimit(req, { requests: 5, window: '1 h' });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // 2. שליפת שפת הממשק מה-URL לצורך תרגום המייל
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    // 3. קריאת ואימות גוף הבקשה
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: "כתובת המייל היא שדה חובה." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // 4. איתור המשתמש במסד הנתונים
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // בדיקות קצה קריטיות
    if (!user) {
      return NextResponse.json(
        { success: false, error: "לא נמצא משתמש עם כתובת המייל הזו." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: "חשבון זה כבר מאומת. ניתן להתחבר." },
        { status: 400 }
      );
    }

    // 5. יצירת קוד אימות חדש באמצעות שירות האימות המרכזי
    // השירות ידאג לבטל תוקף של קודים קודמים שטרם נוצלו.
    const expiresInHours = 1; // תוקף לשעה
    const { otp: verificationCode } = await VerificationService.createVerification(
        user.id,
        VerificationType.EMAIL,
        user.email,
        expiresInHours
    );

    console.log(`[Resend Verification] New OTP generated for user: ${user.id}`);

    // 6. שליחת מייל אימות חדש עם הקוד שנוצר, בהתאם לשפה שנבחרה
    const expiresInText = locale === 'he' ? 'שעה אחת' : '1 hour';
    
    await emailService.sendVerificationEmail({
      locale, // העברת פרמטר השפה
      email: user.email,
      verificationCode: verificationCode,
      firstName: user.firstName,
      expiresIn: expiresInText
    });

    console.log(`[Resend Verification] Verification email sent successfully to ${user.email} in ${locale}`);

    // 7. החזרת תשובת הצלחה ללקוח
    return NextResponse.json({
      success: true,
      message: "מייל אימות חדש נשלח בהצלחה."
    });

  } catch (error: unknown) {
    // 8. טיפול בשגיאות לא צפויות
    console.error('[API Resend Verification] A critical error occurred:', error);
    
    const errorMessage = error instanceof Error ? error.message : "שגיאה לא צפויה בשליחת מייל האימות.";
    
    return NextResponse.json(
        { success: false, error: "אירעה שגיאה בתהליך, אנא נסה שנית מאוחר יותר.", details: errorMessage }, 
        { status: 500 }
    );
  }
}