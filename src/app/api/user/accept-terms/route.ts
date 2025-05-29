// src/app/api/user/accept-terms/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // ודא שהנתיב ל-authOptions נכון
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // בדוק אם המשתמש כבר אישר את התנאים כדי למנוע עדכונים מיותרים
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { termsAndPrivacyAcceptedAt: true },
    });

    if (user?.termsAndPrivacyAcceptedAt) {
      return NextResponse.json({ success: true, message: 'Terms already accepted' });
    }

    // עדכן את המשתמש עם חתימת זמן ההסכמה
    await prisma.user.update({
      where: { id: userId },
      data: {
        termsAndPrivacyAcceptedAt: new Date(),
      },
    });

    // אין צורך להחזיר את הסשן המעודכן כאן, הלקוח ירענן אותו עם update()
    return NextResponse.json({ success: true, message: 'Terms accepted successfully' });

  } catch (error) {
    console.error('Error accepting terms:', error);
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}