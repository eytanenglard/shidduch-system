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
 * POST - יוצר המלצה חדשה.
 * תומך בשני תרחישים:
 * 1. עם token - הוספה ציבורית דרך קישור (חבר ממליץ)
 * 2. בלי token - הוספה ידנית (המשתמש מוסיף המלצה על עצמו)
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

    // ולידציה בסיסית של שדות חובה (ללא token)
    if (!authorName || !relationship || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // ===== תרחיש 1: הוספה עם TOKEN (ציבורית) =====
    if (token) {
      const result = await prisma.$transaction(async (tx) => {
        // מצא את בקשת הטוקן
        const request = await tx.testimonialRequest.findUnique({
          where: {
            token: token,
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        });

        if (!request) {
          throw new Error('Invalid, expired, or already used link.');
        }

        // צור המלצה
        const testimonial = await tx.friendTestimonial.create({
          data: {
            profileId: request.profileId,
            authorName,
            relationship,
            content,
            authorPhone: authorPhone || null,
            isPhoneVisibleToMatch: isPhoneVisibleToMatch || false,
            status: 'PENDING',
            submittedBy: 'FRIEND',
          },
        });

        // סמן טוקן כ-COMPLETED
        await tx.testimonialRequest.update({
          where: { id: request.id },
          data: { status: 'COMPLETED' },
        });

        return { success: true, testimonial };
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Thank you! Your testimonial has been submitted.',
        });
      } else {
        throw new Error('Transaction failed unexpectedly.');
      }
    }

    // ===== תרחיש 2: הוספה ידנית ללא TOKEN =====
    // בדוק session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - no session' },
        { status: 401 }
      );
    }

    // מצא את ה-profile של המשתמש המחובר
    const userProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found for current user' },
        { status: 404 }
      );
    }

    // צור המלצה חדשה
    const testimonial = await prisma.friendTestimonial.create({
      data: {
        profileId: userProfile.id,
        authorName,
        relationship,
        content,
        authorPhone: authorPhone || null,
        isPhoneVisibleToMatch: isPhoneVisibleToMatch || false,
        status: 'PENDING',
submittedBy: 'FRIEND',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Testimonial added successfully.',
      testimonial,
    });

  } catch (error) {
    console.error('Error in POST /api/profile/testimonials:', error);

    // טיפול בשגיאת token לא תקין
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

    // שגיאות כלליות
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}