// src/app/[locale]/questionnaire/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../i18n-config';
import QuestionnairePageClient from '@/components/questionnaire/QuestionnairePageClient'; // ייבוא רכיב הלקוח החדש

// רכיב זמני שיוצג בזמן שהשאלון נטען
function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      {/* הטקסט הזה יוחלף בטקסט מהמילון במידת הצורך ברכיב הלקוח */}
      <p className="ml-4 rtl:mr-4 text-lg text-gray-700">טוען שאלון...</p>
    </div>
  );
}

// הגדרת props עם פרמטר locale
export default async function Page({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // 1. טעינת המילון ברכיב השרת
  const dictionary = await getDictionary(locale);

  return (
    <Suspense fallback={<Loading />}>
      {/* 2. רינדור רכיב הלקוח והעברת המילון כ-prop */}
      <QuestionnairePageClient dict={dictionary.questionnaire} locale={locale}/>
    </Suspense>
  );
}
