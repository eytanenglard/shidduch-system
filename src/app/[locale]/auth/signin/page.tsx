// src/app/[locale]/auth/signin/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SignInClient from './SignInClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

// עדכון רכיב הטעינה
function Loading() {
  return <StandardizedLoadingSpinner />;
}

type SignInPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
      <Suspense fallback={<Loading />}>
        <SignInClient dict={dictionary.auth.signIn} locale={locale} />
      </Suspense>
    </div>
  );
}