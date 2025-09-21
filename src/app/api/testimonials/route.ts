// src/app/api/profile/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// הגדרת טיפוס עבור המידע המפוענח מהטוקן
interface TestimonialTokenPayload {
  profileId: string;
  userId: string;
}

/**
 * GET - מאחזר המלצות.
 * - אם קיים userId ב-query, מחזיר המלצות עבור אותו משתמש (לצפייה ציבורית/שדכנים).
 * - אם לא, מחזיר את כל ההמלצות (כולל ממתינות) עבור המשתמש המחובר (לצורך ניהול).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  try {
    // מקרה 1: בקשה להמלצות של משתמש ספציפי (עבור ProfileCard)
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

    // מקרה 2: בקשה לניהול המלצות של המשתמש המחובר (עבור ProfileSection)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    const testimonials = await prisma.friendTestimonial.findMany({
        where: {
            profile: {
                userId: session.user.id
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return NextResponse.json({ success: true, testimonials });

  } catch (error) {
    console.error('Error in GET /api/profile/testimonials:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}


/**
 * POST - מקבל בקשה עם טוקן ותוכן המלצה, ומייצר רשומה חדשה.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, authorName, relationship, content } = body;

    // 1. ולידציה של הקלט
    if (!token || !authorName || !relationship || !content) {
      return NextResponse.json({ success: false, error: 'Missing required fields (token, authorName, relationship, content).' }, { status: 400 });
    }

    // 2. אימות ופענוח הטוקן
    const decoded = jwt.verify(process.env.NEXTAUTH_SECRET!, token) as TestimonialTokenPayload;
    if (!decoded || !decoded.profileId) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token.' }, { status: 401 });
    }

    // 3. שמירה ב-Prisma
    await prisma.friendTestimonial.create({
      data: {
        profileId: decoded.profileId,
        authorName: authorName,
        relationship: relationship,
        content: content,
        status: 'PENDING', // ברירת מחדל - ממתין לאישור
      },
    });

    // 4. החזרת תשובת הצלחה
    return NextResponse.json({ success: true, message: 'Thank you! Your testimonial has been submitted.' });
  } catch (error) {
    console.error('Error in POST /api/profile/testimonials:', error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link. Please ask for a new one.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}