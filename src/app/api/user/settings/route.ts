// src/app/api/user/settings/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Language } from '@prisma/client';

// סכמת ולידציה קפדנית לוודא שרק ערכים מותרים מתקבלים
const updateSettingsSchema = z.object({
  language: z.nativeEnum(Language, {
    errorMap: () => ({ message: "ערך השפה חייב להיות 'he' או 'en'." }),
  }),
});

export async function PUT(req: Request) {
  try {
    // 1. אימות המשתמש המחובר
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('[API Settings] Unauthorized access attempt');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. קריאה ואימות של גוף הבקשה
    const body = await req.json();
    console.log('[API Settings] Received language update request:', body);
    
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[API Settings] Validation failed:', validationResult.error.flatten());
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { language } = validationResult.data;
    console.log('[API Settings] Updating language to:', language, 'for user:', userId);

    // 3. עדכון רשומת המשתמש במסד הנתונים
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language,
      },
      select: {
        id: true,
        language: true,
        email: true,
      }
    });

    console.log('[API Settings] ✅ Language updated successfully in DB:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      newLanguage: updatedUser.language
    });

    // 4. החזרת תשובת הצלחה
    return NextResponse.json({ 
      success: true, 
      message: 'Language updated successfully.',
      language: updatedUser.language // ✅ מחזיר את השפה המעודכנת (לדיבוג)
    });

  } catch (error) {
    console.error('[API Settings] ❌ Error updating user settings:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, error: "Internal server error.", details: errorMessage },
      { status: 500 }
    );
  }
}