// src/app/r/[code]/page.tsx

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getReferrerByCode } from '@/lib/services/referralService';

interface ReferralRedirectProps {
  // תיקון ל-Next.js 15: params הוא Promise
  params: Promise<{ code: string }>;
}

/**
 * דף זה מטפל בקישורים קצרים כמו neshamatech.com/r/DAVID
 * הוא מפנה ל-API route שמטפל במעקב ושמירת cookie
 */
export default async function ReferralRedirect({
  params,
}: ReferralRedirectProps) {
  // חובה לעשות await ל-params
  const { code } = await params;
  const upperCode = code.toUpperCase();

  // בדוק אם הקוד קיים
  const referrer = await getReferrerByCode(upperCode);

  if (!referrer) {
    // קוד לא קיים - הפנה לעמוד הבית
    redirect('/');
  }

  // קבל locale מה-headers
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  const locale = acceptLanguage.startsWith('he') ? 'he' : 'en';

  // הפנה ל-API route שיטפל במעקב ושמירת cookie
  // ה-API route יכול לשמור cookies ואז להפנות להרשמה
  redirect(`/api/referral/track/${upperCode}?locale=${locale}`);
}

// Metadata
export async function generateMetadata({ params }: ReferralRedirectProps) {
  // חובה לעשות await ל-params גם כאן
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
