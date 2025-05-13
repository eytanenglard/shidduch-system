
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { emailService } from "@/lib/email/emailService";
import { VerificationType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: "חסרים פרטים נדרשים" },
        { status: 400 }
      );
    }

    // מציאת המשתמש
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: "לא נמצא משתמש עם כתובת האימייל הזו" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "המשתמש כבר מאומת" },
        { status: 400 }
      );
    }

    // יצירת טוקן אימות חדש
    const verification = await prisma.verification.create({
      data: {
        userId: user.id,
        type: type as VerificationType,
        token: randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // תוקף ל-24 שעות
        status: 'PENDING',
        attempts: 0
      }
    });

    // שליחת מייל אימות חדש
    // *** התיקון כאן: שימוש ב-verificationCode במקום verificationLink ***
    await emailService.sendVerificationEmail({
      email: user.email,
      verificationCode: verification.token, // שונה מ-verificationLink
      firstName: user.firstName,
      expiresIn: '24 שעות'
    });

    return NextResponse.json({
      success: true,
      message: "מייל אימות חדש נשלח בהצלחה"
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה בשליחת מייל האימות";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
