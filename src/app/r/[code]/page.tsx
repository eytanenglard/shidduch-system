// src/app/r/[code]/page.tsx

import { redirect } from 'next/navigation';
import { getReferrerByCode } from '@/lib/services/referralService';

interface ReferralRedirectProps {
  params: { code: string };
}

/**
 * דף זה מטפל בקישורים קצרים כמו neshamatech.com/r/DAVID
 * הוא מפנה ל-API route שמטפל במעקב ואז מפנה להרשמה
 */
export default async function ReferralRedirect({ params }: ReferralRedirectProps) {
  const { code } = params;

  // בדוק אם הקוד קיים
  const referrer = await getReferrerByCode(code);

  if (!referrer) {
    // קוד לא קיים - הפנה לעמוד הבית
    redirect('/');
  }

  // הפנה ל-API route שיטפל במעקב
  redirect(`/api/referral/track/${code.toUpperCase()}`);
}

// Metadata
export async function generateMetadata({ params }: ReferralRedirectProps) {
  const referrer = await getReferrerByCode(params.code);

  if (!referrer) {
    return {
      title: 'NeshamaTech',
    };
  }

  return {
    title: `הצטרפו ל-NeshamaTech | הזמנה מ-${referrer.name}`,
    description: 'הצטרפו למסע למציאת הזוגיות האמיתית שלכם. NeshamaTech - שידוכים שמתחילים מהנשמה.',
    openGraph: {
      title: `הצטרפו ל-NeshamaTech`,
      description: `${referrer.name} מזמין/ה אתכם להצטרף לקהילת NeshamaTech`,
      images: ['https://res.cloudinary.com/dmfxoi6g0/image/upload/v1764757309/ChatGPT_Image_Dec_3_2025_12_21_36_PM_qk8mjz.png'],
    },
  };
}