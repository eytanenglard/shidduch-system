// src/app/[locale]/questionnaire/complete/page.tsx
import QuestionnaireComplete from '@/components/questionnaire/QuestionnaireComplete';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n-config';

// ▼▼▼ כאן השינוי ▼▼▼
type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function Page({ params }: PageProps) {
  const { locale } = await params; // הוספת await ושינוי הגישה ל-locale
  const dictionary = await getDictionary(locale);

  return (
    <QuestionnaireComplete
      dict={dictionary.questionnaire.questionnaireCompletePage}
    />
  );
}