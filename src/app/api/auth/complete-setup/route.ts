// src/app/api/auth/complete-setup/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { VerificationType, VerificationStatus } from "@prisma/client";
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

    // 1. Find the verification record
    const verification = await prisma.verification.findFirst({
      where: {
        token,
        type: VerificationType.ACCOUNT_SETUP,
        status: VerificationStatus.PENDING,
        expiresAt: {
          gt: new Date(), // Check if not expired
        },
      },
    });

    if (!verification || !verification.userId) {
      return NextResponse.json({ success: false, error: "קישור לא תקין או שפג תוקפו. אנא בקש מהשדכן לשלוח הזמנה חדשה." }, { status: 400 });
    }

    // 2. Hash the new password
    const hashedPassword = await hash(password, 12);

    // 3. Update user and verification record in a transaction
    await prisma.$transaction(async (tx) => {
      // Update the user's password
      await tx.user.update({
        where: { id: verification.userId! },
        data: {
          password: hashedPassword,
        },
      });

      // Mark the verification token as completed
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