// src/app/api/auth/initiate-password-change/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { emailService } from "@/lib/email/emailService";
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

    // בדיקת סיסמה נוכחית
    const isValidPassword = await compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "סיסמה נוכחית שגויה" },
        { status: 400 }
      );
    }

    // הצפנת הסיסמה החדשה
    const hashedNewPassword = await hash(newPassword, 12);

    // ביטול אימותים קודמים
    await db.verification.updateMany({
      where: {
        userId: user.id,
        type: VerificationType.PASSWORD_RESET,
        status: "PENDING"
      },
      data: {
        status: "EXPIRED"
      }
    });

    const token = await generateToken();

    // יצירת רשומת אימות חדשה
    await db.verification.create({
      data: {
        token,
        userId: user.id,
        type: VerificationType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 שעות
        status: "PENDING",
        metadata: { hashedNewPassword }
      }
    });

    // שליחת מייל עם קוד האימות
    await emailService.sendPasswordReset(user.email, token);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Initiate password change error:", error);
    return NextResponse.json(
      { error: "שגיאה בתהליך שינוי הסיסמה" },
      { status: 500 }
    );
  }
   }