// src/app/api/auth/complete-setup/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
// --- הוספה ---
import { VerificationType, VerificationStatus, UserStatus } from "@prisma/client";
// --- סוף הוספה ---
import { z } from "zod";

const completeSetupSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = completeSetupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Invalid data", details: validation.error.flatten() }, { status: 400 });
    }

    const { token, password } = validation.data;

    const verification = await prisma.verification.findFirst({
      where: {
        token,
        type: VerificationType.ACCOUNT_SETUP,
        status: VerificationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification || !verification.userId) {
      return NextResponse.json({ success: false, error: "קישור לא תקין או שפג תוקפו. אנא בקש מהשדכן לשלוח הזמנה חדשה." }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    // עדכון הסיסמה, סטטוס המשתמש, וסטטוס האימות בטרנזקציה אחת
    await prisma.$transaction(async (tx) => {
      // עדכון סיסמה, אימות מייל, וסטטוס המשתמש
      await tx.user.update({
        where: { id: verification.userId! },
        data: {
          password: hashedPassword,
          // --- הוספה ---
          isVerified: true, // המייל אומת מכיוון שהמשתמש הגיע מהקישור
          status: UserStatus.PENDING_PHONE_VERIFICATION, // העבר את המשתמש לשלב הבא
          // isProfileComplete נשאר false כי הוא עדיין צריך למלא פרטים
          // --- סוף הוספה ---
        },
      });

      // עדכון סטטוס האימות (הטוקן נוצל)
      await tx.verification.update({
        where: { id: verification.id },
        data: {
          status: VerificationStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true, message: "החשבון הוגדר בהצלחה! כעת ניתן להתחבר עם הסיסמה החדשה." });

  } catch (error) {
    console.error("Error completing account setup:", error);
    return NextResponse.json({ success: false, error: "אירעה שגיאה בהגדרת החשבון." }, { status: 500 });
  }
}