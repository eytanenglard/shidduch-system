// src/app/api/auth/complete-password-change/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VerificationType, Prisma } from "@prisma/client";

// פונקציה שבודקת אם ה-metadata מכיל את הסיסמה המוצפנת
function hasValidPasswordMetadata(metadata: Prisma.JsonValue | null): boolean {
  return (
    typeof metadata === 'object' && 
    metadata !== null && 
    'hashedNewPassword' in metadata && 
    typeof (metadata as { hashedNewPassword: unknown }).hashedNewPassword === 'string'
  );
}

export async function POST(req: Request) {
  try {
    const { userId, token } = await req.json();

    // וידוא שהטוקן הוא מספרי בן 6 ספרות
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json(
        { error: "קוד אימות לא תקין. נדרש קוד בן 6 ספרות." },
        { status: 400 }
      );
    }

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

    // בדיקה שהמטא-דאטה תקין ומכיל את הסיסמה המוצפנת
    if (!hasValidPasswordMetadata(verification.metadata)) {
      return NextResponse.json(
        { error: "מידע אימות חסר או לא תקין, אנא התחל את התהליך מחדש" },
        { status: 400 }
      );
    }

    // כעת ניתן לגשת ל-hashedNewPassword בבטחה, המטא-דאטה אומת
    const metadata = verification.metadata as Prisma.JsonObject;
    const hashedNewPassword = metadata.hashedNewPassword as string;

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
        data: { 
          status: "COMPLETED",
          completedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ 
      success: true,
      message: "הסיסמה עודכנה בהצלחה"
    });

  } catch (error) {
    console.error("Complete password change error:", error);
    return NextResponse.json(
      { error: "שגיאה בהשלמת שינוי הסיסמה" },
      { status: 500 }
    );
  }
}