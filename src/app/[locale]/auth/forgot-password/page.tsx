// src/app/[locale]/auth/forgot-password/page.tsx

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import ForgotPasswordClient from './ForgotPasswordClient';

/**
 * דף "שכחתי סיסמה". זהו רכיב צד-שרת האחראי על טעינת התרגומים
 * והעברתם לרכיב הלקוח שיטפל בלוגיקה של הטופס.
 */
export default async function ForgotPasswordPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // טעינת המילון (קובץ התרגומים) בהתאם לשפה מה-URL.
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      {/* קישור לחזרה לדף הבית */}
      <Link
        href="/"
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowLeft className="h-4 w-4 transform rtl:rotate-180" />
        {/* טקסט זה יכול להגיע גם הוא מהמילון, אך לצורך הפשטות נשאיר אותו כאן */}
        חזרה לדף הבית
      </Link>

      {/* 
        רינדור רכיב הלקוח. 
        אנו מעבירים לו שני props חיוניים:
        1. dict: אובייקט התרגומים הספציפי לטופס זה.
        2. locale: משתנה השפה ('he' או 'en'), כדי שהלקוח ידע איזו שפה לשלוח ל-API.
      */}
      <ForgotPasswordClient
        dict={dictionary.auth.forgotPassword}
        locale={locale}
      />
    </div>
  );
}