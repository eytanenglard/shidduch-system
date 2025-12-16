// src/app/api/referral/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  getActiveCampaign, 
  createReferrer, 
  isValidCode,
  getReferrerByCode,
} from '@/lib/services/referralService';
import { z } from 'zod';

// Validation schema - מייל או טלפון נדרשים (לפחות אחד)
const registerSchema = z.object({
  campaignSlug: z.string().optional(),
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים').max(50),
  email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  preferredCode: z.string()
    .min(3, 'קוד חייב להכיל לפחות 3 תווים')
    .max(15, 'קוד יכול להכיל עד 15 תווים')
    .regex(/^[A-Za-z0-9]+$/, 'קוד יכול להכיל רק אותיות באנגלית ומספרים')
    .optional()
    .or(z.literal('')),
}).refine(
  // ולידציה מותאמת אישית: לפחות מייל או טלפון נדרשים
  (data) => {
    const hasEmail = data.email && data.email.trim().length > 0;
    const hasPhone = data.phone && data.phone.trim().length > 0;
    return hasEmail || hasPhone;
  },
  {
    message: 'נדרש לפחות אימייל או טלפון',
    path: ['contact'], // שדה וירטואלי לשגיאה
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      
      // בדיקה אם השגיאה היא על contact (מייל או טלפון)
      const contactError = validationResult.error.issues.find(
        issue => issue.path.includes('contact')
      );
      
      return NextResponse.json(
        { 
          success: false, 
          error: contactError ? 'EMAIL_OR_PHONE_REQUIRED' : 'VALIDATION_ERROR',
          details: errors.fieldErrors,
          message: contactError?.message,
        },
        { status: 400 }
      );
    }

    const { campaignSlug, name, email, phone, preferredCode } = validationResult.data;

    // מצא קמפיין פעיל
    const campaign = await getActiveCampaign(campaignSlug);
    
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'NO_ACTIVE_CAMPAIGN' },
        { status: 404 }
      );
    }

    // בדוק אם הקוד המועדף תפוס
    if (preferredCode) {
      const existing = await getReferrerByCode(preferredCode);
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'CODE_TAKEN' },
          { status: 409 }
        );
      }
      
      if (!isValidCode(preferredCode)) {
        return NextResponse.json(
          { success: false, error: 'INVALID_CODE_FORMAT' },
          { status: 400 }
        );
      }
    }

    // צור את המפנה
    const referrer = await createReferrer({
      campaignId: campaign.id,
      name,
      email: email || undefined,
      phone: phone || undefined,
      preferredCode: preferredCode || undefined,
      tier: 'COMMUNITY',
    });

    // בנה את ה-URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.neshamatech.com';
    const shareUrl = `${baseUrl}/r/${referrer.code}`;
    const dashboardUrl = `${baseUrl}/he/referral/dashboard?code=${referrer.code}`;

    return NextResponse.json({
      success: true,
      referrer: {
        code: referrer.code,
        shareUrl,
        dashboardUrl,
      },
    });

  } catch (error) {
    console.error('[Referral Register] Error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'CODE_TAKEN') {
        return NextResponse.json(
          { success: false, error: 'CODE_TAKEN' },
          { status: 409 }
        );
      }
      if (error.message === 'INVALID_CODE_FORMAT') {
        return NextResponse.json(
          { success: false, error: 'INVALID_CODE_FORMAT' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// בדיקת זמינות קוד
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Missing code parameter' },
        { status: 400 }
      );
    }

    if (!isValidCode(code)) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: 'INVALID_FORMAT',
      });
    }

    const existing = await getReferrerByCode(code);
    
    return NextResponse.json({
      success: true,
      available: !existing,
      reason: existing ? 'TAKEN' : null,
    });

  } catch (error) {
    console.error('[Referral Check Code] Error:', error);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}