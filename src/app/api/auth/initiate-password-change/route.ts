// src/app/api/auth/initiate-password-change/route.ts
import { NextResponse, NextRequest } from "next/server"; // ייבוא NextRequest
import { db } from "@/lib/db";
import { emailService } from "@/lib/email/emailService";
import { VerificationService } from "@/lib/services/verificationService";
import { VerificationType } from "@prisma/client";
import { hash, compare } from "bcryptjs";

export async function POST(req: NextRequest) { // שינוי ל-NextRequest
  try {
    // ================ 1. שליפת ה-locale מה-URL ================
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';
    // ==========================================================

    const { userId, currentPassword, newPassword } = await req.json();

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "משתמש לא נמצא" },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "לא הוגדרה סיסמה לחשבון זה. ייתכן שנרשמת באמצעות שירות חיצוני." },
        { status: 400 }
      );
    }

    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "סיסמה נוכחית שגויה" },
        { status: 400 }
      );
    }

    const hashedNewPassword = await hash(newPassword, 12);

    // השירות יוצר OTP בן 6 ספרות
    const { verification } = await VerificationService.createVerification(
      user.id,
      VerificationType.PASSWORD_RESET,
      user.email,
      24 // Expires in 24 hours
    );

    // שמירת הסיסמה המוצפנת במטא-דאטה של האימות
    await db.verification.update({
      where: { id: verification.id },
      data: {
        metadata: { hashedNewPassword }
      }
    });

    // ================ 2. קריאה לפונקציה הנכונה עם הפרמטרים המעודכנים ================
    const otpCode = verification.token; // הטוקן שנוצר הוא ה-OTP
    const expiresInText = locale === 'he' ? '24 שעות' : '24 hours';

    await emailService.sendPasswordResetOtpEmail({
      locale,
      email: user.email,
      otp: otpCode,
      firstName: user.firstName,
      expiresIn: expiresInText,
    });
    // =================================================================================

    return NextResponse.json({ success: true, message: "קוד אימות לשינוי סיסמה נשלח למייל שלך." });

  } catch (error) {
    console.error("Initiate password change error:", error);
    return NextResponse.json(
      { error: "שגיאה בתהליך שינוי הסיסמה" },
      { status: 500 }
    );
  }
}