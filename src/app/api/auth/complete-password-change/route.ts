// src/app/api/auth/complete-password-change/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VerificationType, VerificationStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId, token } = await req.json();

    // מציאת הטוקן
    const verification = await db.verification.findFirst({
      where: {
        token,
        userId,
        type: VerificationType.PASSWORD_RESET,
        status: "PENDING",
        expiresAt: { gt: new Date() }
      }
    });

    if (!verification) {
      return NextResponse.json(
        { error: "קוד לא תקף או שפג תוקפו" },
        { status: 400 }
      );
    }

    const { hashedNewPassword } = verification.metadata as { hashedNewPassword: string };

    // עדכון הסיסמה והשלמת האימות
    await db.$transaction([
      // עדכון סיסמה
      db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      }),
      // עדכון סטטוס האימות
      db.verification.update({
        where: { id: verification.id },
        data: { status: "COMPLETED" }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Complete password change error:", error);
    return NextResponse.json(
      { error: "שגיאה בהשלמת שינוי הסיסמה" },
      { status: 500 }
    );
  }
}