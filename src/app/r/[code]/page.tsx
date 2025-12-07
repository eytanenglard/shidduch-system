// src/app/r/[code]/page.tsx

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  getReferrerByCode,
  trackClick,
  createReferralCookieValue,
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_DAYS,
} from '@/lib/services/referralService';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

interface ReferralRedirectProps {
  // תיקון: ב-Next.js 15 הפרמטרים הם Promise
  params: Promise<{ code: string }>;
}

/**
 * דף זה מטפל בקישורים קצרים כמו neshamatech.com/r/DAVID
 * הוא רושם את הלחיצה ומפנה ישירות לדף ההרשמה
 */
export default async function ReferralRedirect({
  params,
}: ReferralRedirectProps) {
  // תיקון: חובה לעשות await ל-params
  const { code } = await params;
  const upperCode = code.toUpperCase();

  // בדוק אם הקוד קיים
  const referrer = await getReferrerByCode(upperCode);

  if (!referrer) {
    // קוד לא קיים - הפנה לעמוד הבית
    redirect('/');
  }

  // קבל מידע מהבקשה
  const headersList = await headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    'unknown';
  const userAgent = headersList.get('user-agent') || undefined;
  const acceptLanguage = headersList.get('accept-language') || '';

  // קבע locale
  const locale = acceptLanguage.startsWith('he') ? 'he' : 'en';

  // צור session ID
  const sessionId = uuidv4();

  // רשום את הלחיצה
  try {
    const result = await trackClick({
      code: upperCode,
      ipAddress,
      userAgent,
      sessionId,
    });

    // שמור cookie
    if (result.success && result.referralId) {
      const cookieStore = await cookies();
      const cookieValue = createReferralCookieValue(
        upperCode,
        result.referralId
      );

      cookieStore.set(REFERRAL_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60,
        path: '/',
      });
    }
  } catch (error) {
    console.error('[Referral Redirect] Error tracking click:', error);
    // ממשיכים גם אם יש שגיאה במעקב
  }

  // הפנה לדף ההרשמה עם פרמטר הרפרל
  redirect(`/${locale}/auth/register?ref=${upperCode}`);
}

// Metadata
export async function generateMetadata({ params }: ReferralRedirectProps) {
  // תיקון: גם כאן חובה לעשות await
  const { code } = await params;
  const referrer = await getReferrerByCode(code);

  if (!referrer) {
    return {
      title: 'NeshamaTech',
    };
  }

  return {
    title: `הצטרפו ל-NeshamaTech | הזמנה מ-${referrer.name}`,
    description:
      'הצטרפו למסע למציאת הזוגיות האמיתית שלכם. NeshamaTech - שידוכים שמתחילים מהנשמה.',
    openGraph: {
      title: `הצטרפו ל-NeshamaTech`,
      description: `${referrer.name} מזמין/ה אתכם להצטרף לקהילת NeshamaTech`,
      images: [
        'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1764757309/ChatGPT_Image_Dec_3_2025_12_21_36_PM_qk8mjz.png',
      ],
    },
  };
}
