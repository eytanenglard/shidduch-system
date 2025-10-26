// src/app/[locale]/auth/forgot-password/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import ForgotPasswordClient from './ForgotPasswordClient';

// ▼▼▼ כאן השינוי ▼▼▼
type ForgotPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
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
      <ForgotPasswordClient
        dict={dictionary.auth.forgotPassword}
        locale={locale}
      />
    </div>
  );
}