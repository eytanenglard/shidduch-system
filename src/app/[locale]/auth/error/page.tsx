// src/app/[locale]/auth/error/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import AuthErrorClient from './AuthErrorClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

function Loading() {
  return <StandardizedLoadingSpinner />;
}

type ErrorPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ErrorPage({ params }: ErrorPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    // הוסר bg-gray-50
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<Loading />}>
        <AuthErrorClient dict={dictionary.auth.errorPage} />
      </Suspense>
    </div>
  );
}