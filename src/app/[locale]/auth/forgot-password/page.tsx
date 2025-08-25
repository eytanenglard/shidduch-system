// src/app/[locale]/auth/forgot-password/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import ForgotPasswordClient from './ForgotPasswordClient';

export default async function ForgotPasswordPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <Link
        href="/"
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowLeft className="h-4 w-4 transform rtl:rotate-180" />
        {/* This text is outside the main component, so we either hardcode it or pass it from a shared dictionary part */}
        חזרה לדף הבית
      </Link>
      <ForgotPasswordClient dict={dictionary.auth.forgotPassword} />
    </div>
  );
}
