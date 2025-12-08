// src/app/[locale]/(authenticated)/profile/page.tsx
import React, { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import ProfilePageClient from './ProfilePageClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

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
        <StandardizedLoadingSpinner text={dictionary.profilePage.pageLoader} />
      }
    >
      <ProfilePageClient dict={dictionary.profilePage} locale={locale} />
    </Suspense>
  );
}