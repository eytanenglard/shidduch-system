// src/app/[locale]/(authenticated)/profile/page.tsx
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import ProfilePageClient from './ProfilePageClient';

// הגדרת ה-props הנכונה
type ProfilePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  // שימוש ב-await כדי לחלץ את המידע מה-Promise
  const { locale } = await params;
  console.log(
    `---[ SERVER LOG | page.tsx ]--- עמוד הפרופיל נטען עבור שפה: "${locale}".`
  );
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50">
          <div className="flex items-center gap-2 text-lg text-cyan-600">
            <Loader2 className="animate-spin h-6 w-6" />
            <span>{dictionary.profilePage.pageLoader}</span>
          </div>
        </div>
      }
    >
      <ProfilePageClient dict={dictionary.profilePage} locale={locale} />
    </Suspense>
  );
}