import { NextResponse } from "next/server";
import { VerificationService } from "@/lib/services/verificationService";
import prisma from "@/lib/prisma";
import { UserStatus, VerificationType } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { token, type } = await req.json();

    // ולידציה של הקלט
    if (!token || !type) {
      return NextResponse.json(
        { error: "חסרים פרטים נדרשים" },
        { status: 400 }
      );
    }

    if (!Object.values(VerificationType).includes(type)) {
      return NextResponse.json(
        { error: "סוג אימות לא חוקי" },
        { status: 400 }
      );
    }

    // אימות הטוקן ועדכון סטטוס המשתמש
    const verification = await VerificationService.verifyToken(token, type);

    // עדכון סטטוס המשתמש ל-ACTIVE
    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        status: UserStatus.ACTIVE,
        isVerified: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "האימות הושלם בהצלחה",
      user: {
        id: verification.userId,
        isVerified: true,
        status: UserStatus.ACTIVE
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה באימות";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}