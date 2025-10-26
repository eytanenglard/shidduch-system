// src/app/[locale]/questionnaire/restore/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n-config';
import QuestionnaireRestore from '@/components/questionnaire/QuestionnaireRestore';

function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
    </div>
  );
}

// ▼▼▼ כאן השינוי ▼▼▼
type RestorePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function RestorePage({ params }: RestorePageProps) {
  const { locale } = await params; // הוספת await
  const dictionary = await getDictionary(locale);

  return (
    <Suspense fallback={<Loading />}>
      <QuestionnaireRestore
        dict={dictionary.questionnaire.questionnaireRestore}
      />
    </Suspense>
  );
}