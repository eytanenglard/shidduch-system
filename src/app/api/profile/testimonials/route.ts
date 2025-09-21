// src/app/api/profile/testimonials/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET - מאחזר המלצות.
 * לוגיקה זו משמשת לשני תרחישים:
 * 1. אם נשלח 'userId' בפרמטרים: אחזר המלצות *מאושרות* עבור פרופיל ציבורי.
 * 2. אם לא נשלח 'userId': אחזר את *כל* ההמלצות עבור המשתמש המחובר, כדי שיוכל לנהל אותן.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    // תרחיש 1: בקשה להצגת המלצות בפרופיל של משתמש ספציפי (לצפייה ציבורית)
    if (userId) {
      const testimonials = await prisma.friendTestimonial.findMany({
        where: {
          profile: {
            userId: userId,
          },
          // חשוב: החזר רק המלצות שאושרו לצפייה ציבורית
          status: 'APPROVED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json({ success: true, testimonials });
    }

    // תרחיש 2: בקשה לניהול המלצות של המשתמש המחובר (בתוך עמוד הפרופיל האישי)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const testimonials = await prisma.friendTestimonial.findMany({
      where: {
        profile: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error('Error in GET /api/profile/testimonials:', error);
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}

/**
 * POST - יוצר המלצה חדשה באמצעות טוקן חד-פעמי ומאובטח.
 * נקודת קצה זו משמשת את הטופס הציבורי שחברים ממלאים.
 * היא מבטיחה שכל קישור ישמש פעם אחת בלבד.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      authorName,
      relationship,
      content,
      authorPhone,
      isPhoneVisibleToMatch,
    } = body;

    // 1. ולידציה בסיסית של שדות החובה
    if (!token || !authorName || !relationship || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // 2. שימוש בטרנזקציה כדי להבטיח אטומיות.
    // שתי הפעולות (יצירת המלצה ועדכון הטוקן) חייבות להצליח יחד.
    const result = await prisma.$transaction(async (tx) => {
      // שלב א': חפש את בקשת הטוקן. היא חייבת להיות קיימת, בתוקף ובסטטוס PENDING.
      const request = await tx.testimonialRequest.findUnique({
        where: {
          token: token,
          status: 'PENDING',
          expiresAt: { gt: new Date() }, // ודא שהטוקן לא פג תוקף
        },
      });

      // אם לא נמצאה בקשה תקינה, זרוק שגיאה. זה יבטל את הטרנזקציה אוטומטית.
      if (!request) {
        throw new Error('Invalid, expired, or already used link.');
      }

      // שלב ב': צור את רשומת ההמלצה במסד הנתונים.
      const testimonial = await tx.friendTestimonial.create({
        data: {
          profileId: request.profileId,
          authorName,
          relationship,
          content,
          authorPhone: authorPhone || null,
          isPhoneVisibleToMatch: isPhoneVisibleToMatch || false,
          status: 'PENDING', // המלצה חדשה תמיד ממתינה לאישור המשתמש
          submittedBy: 'FRIEND', // סמן שההמלצה הגיעה מחבר
        },
      });

      // שלב ג': קריטי! שנה את סטטוס הטוקן ל-COMPLETED כדי למנוע שימוש חוזר.
      await tx.testimonialRequest.update({
        where: { id: request.id },
        data: { status: 'COMPLETED' },
      });

      return { success: true, testimonial };
    });

    // 3. אם הטרנזקציה הצליחה, החזר תשובת הצלחה.
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Thank you! Your testimonial has been submitted.',
      });
    } else {
      // מצב זה לא אמור לקרות אם לוגיקת הטרנזקציה נכונה
      throw new Error('Transaction failed unexpectedly.');
    }
  } catch (error) {
    console.error('Error in POST /api/profile/testimonials:', error);

    // 4. טיפול ייעודי בשגיאות ידועות
    if (
      error instanceof Error &&
      error.message.includes('Invalid, expired, or already used link')
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'This link is invalid, has expired, or has already been used.',
        },
        { status: 400 }
      );
    }

    // 5. טיפול בשגיאות לא צפויות אחרות
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}