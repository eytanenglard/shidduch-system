// src/app/api/auth/initiate-password-change/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailService } from "@/lib/email/emailService";
import { VerificationService } from "@/lib/services/verificationService";
import { VerificationType } from "@prisma/client";
import { hash, compare } from "bcryptjs";

export async function POST(req: Request) {
  try {
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

    // הוספת בדיקה: אם למשתמש אין סיסמה (למשל, נרשם דרך OAuth)
    if (!user.password) {
      return NextResponse.json(
        { error: "לא הוגדרה סיסמה לחשבון זה. ייתכן שנרשמת באמצעות שירות חיצוני." },
        { status: 400 }
      );
    }

    // בדיקת סיסמה נוכחית
    // כעת, user.password מובטח להיות string
    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "סיסמה נוכחית שגויה" },
        { status: 400 }
      );
    }

    // הצפנת הסיסמה החדשה
    const hashedNewPassword = await hash(newPassword, 12);

    // יצירת קוד אימות בן 6 ספרות באמצעות שירות האימות
    const verification = await VerificationService.createVerificationToken(
      user.id,
      VerificationType.PASSWORD_RESET,
      24 // תקף ל-24 שעות
    );

    // שמירת הסיסמה המוצפנת במטא-דאטה של האימות
    await db.verification.update({
      where: { id: verification.id },
      data: {
        metadata: { hashedNewPassword }
      }
    });

    // שליחת מייל עם קוד האימות
    await emailService.sendPasswordReset(user.email, verification.token);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Initiate password change error:", error);
    return NextResponse.json(
      { error: "שגיאה בתהליך שינוי הסיסמה" },
      { status: 500 }
    );
  }
}