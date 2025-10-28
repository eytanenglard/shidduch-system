// src/app/api/user/consent-settings/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// סכמת ולידציה קפדנית לבקשה
const updateConsentSchema = z.object({
  consentType: z.enum(['engagement', 'promotional'], {
    required_error: "Consent type is required ('engagement' or 'promotional').",
  }),
  consentValue: z.boolean({
    required_error: 'Consent value (true/false) is required.',
  }),
});

export async function PUT(req: Request) {
  try {
    // 1. אימות המשתמש
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. קריאה וולידציה של גוף הבקשה
    const body = await req.json();
    const validationResult = updateConsentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { consentType, consentValue } = validationResult.data;

    // 3. הכנת הנתונים לעדכון
    let dataToUpdate = {};
    if (consentType === 'engagement') {
      dataToUpdate = { engagementEmailsConsent: consentValue };
    } else { // consentType === 'promotional'
      dataToUpdate = { promotionalEmailsConsent: consentValue };
    }

    // 4. עדכון מסד הנתונים
    await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    // 5. החזרת תשובת הצלחה
    return NextResponse.json({ success: true, message: 'Consent preferences updated successfully.' });

  } catch (error) {
    console.error('Error updating consent settings:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, error: "Internal server error.", details: errorMessage },
      { status: 500 }
    );
  }
}