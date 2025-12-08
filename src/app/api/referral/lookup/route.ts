// src/app/api/referral/lookup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// טיפוס התוצאה
type ReferrerResult = {
  code: string;
  name: string;
} | null;

/**
 * חיפוש מפנה לפי קוד, אימייל, או טלפון
 * מאפשר למפנים קיימים למצוא את הדשבורד שלהם
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    // חייב לפחות פרמטר אחד
    if (!code && !email && !phone) {
      return NextResponse.json(
        { success: false, error: 'MISSING_SEARCH_PARAM' },
        { status: 400 }
      );
    }

    // בניית שאילתת חיפוש
    let referrer: ReferrerResult = null;

    if (code) {
      // חיפוש לפי קוד (הכי מדויק)
      referrer = await prisma.referrer.findFirst({
        where: { 
          code: code.toUpperCase(),
        },
        select: {
          code: true,
          name: true,
        },
      });
    } else if (email) {
      // חיפוש לפי אימייל
      referrer = await prisma.referrer.findFirst({
        where: { 
          email: email.toLowerCase(),
        },
        select: {
          code: true,
          name: true,
        },
      });
    } else if (phone) {
      // חיפוש לפי טלפון - נרמול מספר הטלפון
      const normalizedPhone = phone.replace(/[^0-9]/g, '');
      
      referrer = await prisma.referrer.findFirst({
        where: { 
          OR: [
            { phone: phone },
            { phone: normalizedPhone },
            { phone: { contains: normalizedPhone.slice(-9) } }, // 9 ספרות אחרונות
          ],
        },
        select: {
          code: true,
          name: true,
        },
      });
    }

    if (!referrer) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
      });
    }

    return NextResponse.json({
      success: true,
      code: referrer.code,
      name: referrer.name,
    });

  } catch (error) {
    console.error('[Referral Lookup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}