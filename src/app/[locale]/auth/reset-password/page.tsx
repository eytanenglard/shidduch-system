// src/app/[locale]/auth/reset-password/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import ResetPasswordClient from './ResetPasswordClient';

// A loader for the Suspense boundary
function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-xl">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      <p className="mt-4 text-gray-600">טוען...</p>
    </div>
  );
}

export default async function ResetPasswordPage({
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
        {/* This text is common and could come from a shared/main dictionary part in a real scenario */}
        חזרה לדף הבית
      </Link>
      <Suspense fallback={<Loading />}>
        <ResetPasswordClient dict={dictionary.auth.resetPassword} />
      </Suspense>
    </div>
  );
}
