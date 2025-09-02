// src/app/[locale]/questionnaire/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../i18n-config';
import QuestionnairePageClient from '@/components/questionnaire/QuestionnairePageClient';

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      <p className="ml-4 rtl:mr-4 text-lg text-gray-700">טוען שאלון...</p>
    </div>
  );
}

export default async function Page({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const dictionary = await getDictionary(locale);

  // זה הלוג שאנחנו מחפשים בטרמינל
  console.log(
    `\n✅ [LOG | /questionnaire/page.tsx SERVER SIDE] Received searchParams:`,
    searchParams,
    `\n`
  );

  return (
    <Suspense fallback={<Loading />}>
      <QuestionnairePageClient
        dict={dictionary.questionnaire}
        locale={locale}
      />
    </Suspense>
  );
}
