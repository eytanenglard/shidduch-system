// src/app/[locale]/auth/register/page.tsx

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import RegisterClient from './RegisterClient'; // רכיב הלקוח החדש

/**
 * רכיב טעינה שיוצג בזמן שהמילון והקומפוננטה נטענים.
 * זהו חלק ממנגנון ה-Suspense של React.
 */
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
    </div>
  );
}

/**
 * זהו רכיב צד-שרת (Server Component) שאחראי על:
 * 1. קבלת פרמטר השפה (locale) מה-URL.
 * 2. טעינת קובץ התרגומים (המילון) המתאים לשפה זו באופן אסינכרוני.
 * 3. העברת התרגומים והשפה לרכיב צד-לקוח (RegisterClient) שיטפל בלוגיקה ובאינטראקציה עם המשתמש.
 */
export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // שלב 1: טעינת המילון המתאים לשפה הנוכחית.
  // הפעולה הזו מתבצעת על השרת לפני שהדף נשלח לדפדפן.
  const dictionary = await getDictionary(locale);

  // שלב 2: רינדור רכיב הלקוח בתוך Suspense.
  // ה-Suspense יציג את רכיב ה-Loading עד שהכל יהיה מוכן.
  return (
    <Suspense fallback={<Loading />}>
      <RegisterClient
        // מעביר את החלק הספציפי של המילון שרלוונטי לדף ההרשמה.
        dict={dictionary.auth.register}
        // ============================ התיקון המרכזי ============================
        // מעביר את משתנה השפה (לדוגמה, 'he' או 'en') לרכיב הלקוח.
        // זה יאפשר לרכיב הלקוח לדעת באיזו שפה לשלוח את בקשות ה-API.
        locale={locale}
        // =====================================================================
      />
    </Suspense>
  );
}
