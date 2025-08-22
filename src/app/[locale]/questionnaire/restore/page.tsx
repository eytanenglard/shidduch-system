// src/app/[locale]/questionnaire/restore/page.tsx

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n-config';
import QuestionnaireRestore from '@/components/questionnaire/QuestionnaireRestore';

// רכיב טעינה פשוט
function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
    </div>
  );
}

// רכיב הדף (Page) הוא רכיב צד-שרת
export default async function RestorePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // 1. טעינת המילון המלא בצד השרת
  const dictionary = await getDictionary(locale);

  // 2. רינדור רכיב הלקוח והעברת החלק הספציפי מהמילון כ-prop
  return (
    <Suspense fallback={<Loading />}>
      <QuestionnaireRestore
        dict={dictionary.questionnaire.questionnaireRestore}
      />
    </Suspense>
  );
}
