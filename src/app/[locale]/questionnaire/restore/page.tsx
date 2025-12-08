// src/app/[locale]/questionnaire/restore/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n-config';
import QuestionnaireRestore from '@/components/questionnaire/QuestionnaireRestore';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

function Loading() {
  return (
    <StandardizedLoadingSpinner
      text="משחזר שאלון..."
      subtext="אנא המתן בזמן שאנו טוענים את הנתונים שלך"
    />
  );
}

type RestorePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function RestorePage({ params }: RestorePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense fallback={<Loading />}>
      <QuestionnaireRestore
        dict={dictionary.questionnaire.questionnaireRestore}
      />
    </Suspense>
  );
}
