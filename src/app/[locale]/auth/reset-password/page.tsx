// src/app/[locale]/auth/reset-password/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import ResetPasswordClient from './ResetPasswordClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

// עדכון רכיב הטעינה
function Loading() {
  return <StandardizedLoadingSpinner />;
}

type ResetPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <Link
        href="/"
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowLeft
          className={`h-4 w-4 ${locale === 'he' ? 'transform rotate-180' : ''}`}
        />{' '}
        חזרה לדף הבית
      </Link>
      <Suspense fallback={<Loading />}>
        <ResetPasswordClient
          dict={dictionary.auth.resetPassword}
          locale={locale}
        />
      </Suspense>
    </div>
  );
}