// src/app/api/user/accept-terms/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // נסה לקרוא את הגוף למקרה שנשלחו גם הסכמות שיווקיות
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // הגוף ריק, זה בסדר
    }
    
    const { engagementEmailsConsent, promotionalEmailsConsent } = body as any;

    // בדוק מצב קיים
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { termsAndPrivacyAcceptedAt: true },
    });

    // --- התיקון: בדיקה שהמשתמש קיים ---
    if (!user) {
      console.error(`[accept-terms] User ID ${userId} from session not found in database.`);
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    // ----------------------------------

    // הכן אובייקט לעדכון
    const updateData: any = {};

    // עדכן תאריך רק אם טרם אושר
    if (!user.termsAndPrivacyAcceptedAt) {
      updateData.termsAndPrivacyAcceptedAt = new Date();
    }

    // עדכן הסכמות שיווקיות אם נשלחו בבקשה (גם אם המשתמש כבר אישר תנאים בעבר)
    if (typeof engagementEmailsConsent === 'boolean') {
      updateData.engagementEmailsConsent = engagementEmailsConsent;
    }
    if (typeof promotionalEmailsConsent === 'boolean') {
      updateData.promotionalEmailsConsent = promotionalEmailsConsent;
    }

    // בצע עדכון רק אם יש מה לעדכן
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      return NextResponse.json({ success: true, message: 'User terms/consents updated' });
    } else {
      return NextResponse.json({ success: true, message: 'No changes needed' });
    }

  } catch (error) {
    console.error('Error accepting terms:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}