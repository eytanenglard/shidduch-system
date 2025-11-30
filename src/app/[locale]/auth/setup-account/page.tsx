// src/app/[locale]/auth/setup-account/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SetupAccountClient from './SetupAccountClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

function Loading() {
  return <StandardizedLoadingSpinner />;
}

type SetupAccountPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function SetupAccountPage({ params }: SetupAccountPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    // הסרתי את bg-gray-100 לטובת הגרדיאנט המובנה או נקי
    <div className="flex items-center justify-center min-h-screen p-4">
      <Suspense fallback={<Loading />}>
        <SetupAccountClient dict={dictionary.auth.setupAccount} />
      </Suspense>
    </div>
  );
}