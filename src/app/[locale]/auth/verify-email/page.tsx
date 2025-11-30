// src/app/[locale]/auth/verify-email/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import VerifyEmailClient from './VerifyEmailClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

// עדכון רכיב הטעינה
function Loading() {
  return <StandardizedLoadingSpinner />;
}

type VerifyEmailPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function VerifyEmailPage({
  params,
}: VerifyEmailPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    // הסרתי את ה-bg-gray-50 הישן כי הספינר החדש כבר כולל רקע יפה
    <div className="flex items-center justify-center min-h-screen">
      <Suspense fallback={<Loading />}>
        <VerifyEmailClient dict={dictionary.auth.verifyEmail} locale={locale} />
      </Suspense>
    </div>
  );
}
