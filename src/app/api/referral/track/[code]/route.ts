// src/app/api/referral/track/[code]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { 
  trackClick, 
  getReferrerByCode,
  createReferralCookieValue,
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_DAYS,
} from '@/lib/services/referralService';
import { v4 as uuidv4 } from 'uuid';

/**
 * פונקציה לקבלת ה-Base URL הנכון
 * ב-Heroku, request.url יכול להחזיר URL פנימי לא נכון
 */
function getBaseUrl(request: NextRequest): string {
  // נסה לקבל את ה-host מה-headers
  const host = request.headers.get('x-forwarded-host') || 
               request.headers.get('host') ||
               'localhost:3000';
  
  // בדוק אם זה HTTPS (ב-production)
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  
  return `${protocol}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // תיקון ל-Next.js 15: חובה לעשות await ל-params
    const { code } = await params;
    
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Missing code' },
        { status: 400 }
      );
    }

    // קבל את ה-Base URL הנכון
    const baseUrl = getBaseUrl(request);
    console.log('[Referral Track] Base URL:', baseUrl);

    // בדוק אם המפנה קיים ופעיל
    const referrer = await getReferrerByCode(code);
    
    if (!referrer) {
      // קוד לא קיים - הפנה לעמוד הבית
      return NextResponse.redirect(new URL('/', baseUrl));
    }

    // חלץ מידע מהבקשה
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // צור session ID ייחודי
    const sessionId = uuidv4();

    // רשום את הלחיצה
    const result = await trackClick({
      code: code.toUpperCase(),
      ipAddress,
      userAgent,
      sessionId,
    });

    // הכן את ה-redirect URL
    const { searchParams } = new URL(request.url);
    const localeParam = searchParams.get('locale');
    const acceptLanguage = request.headers.get('accept-language') || '';
    const locale = localeParam || (acceptLanguage.startsWith('he') ? 'he' : 'en');
const redirectUrl = new URL(`/${locale}`, baseUrl);    
    // הוסף פרמטר לזיהוי שזה רפרל
    redirectUrl.searchParams.set('ref', code.toUpperCase());

    // צור response עם redirect
    const response = NextResponse.redirect(redirectUrl);

    // הגדר cookie לשמירת הרפרל
    if (result.success && result.referralId) {
      const cookieValue = createReferralCookieValue(code.toUpperCase(), result.referralId);
      
      response.cookies.set(REFERRAL_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60, // 30 ימים בשניות
        path: '/',
      });

      // גם session ID ל-localStorage (דרך query param)
      redirectUrl.searchParams.set('sid', sessionId);
    }

    console.log('[Referral Track] Redirecting to:', redirectUrl.toString());
    return response;

  } catch (error) {
    console.error('[Referral Track] Error:', error);
    
    // במקרה של שגיאה - הפנה לעמוד הבית
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(new URL('/', baseUrl));
  }
}