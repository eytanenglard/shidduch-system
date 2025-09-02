// src/app/[locale]/auth/reset-password/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import ResetPasswordClient from './ResetPasswordClient';

/**
 * רכיב טעינה שיוצג בזמן שהמילון ורכיב הלקוח נטענים.
 */
function Loading() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-xl">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      <p className="mt-4 text-gray-600">טוען...</p>
    </div>
  );
}

/**
 * דף "איפוס סיסמה". זהו רכיב צד-שרת האחראי על טעינת התרגומים
 * והעברתם לרכיב הלקוח שיטפל בלוגיקה של הטופס.
 */
export default async function ResetPasswordPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // טעינת המילון המתאים לשפה מה-URL.
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

      {/* 
        השימוש ב-Suspense מבטיח שהמשתמש יראה אנימציית טעינה
        אם יש עיכוב כלשהו בטעינת רכיב הלקוח.
      */}
      <Suspense fallback={<Loading />}>
        <ResetPasswordClient
          dict={dictionary.auth.resetPassword}
          locale={locale} // <<<<<<<<<<<< העברת השפה לרכיב הלקוח
        />
      </Suspense>
    </div>
  );
}
