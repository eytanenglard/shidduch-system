import QuestionnaireComplete from '@/components/questionnaire/QuestionnaireComplete';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n-config';

// This is now an async Server Component
export default async function Page({ params }: { params: { locale: Locale } }) {
  // 1. We load the dictionary here
  const dictionary = await getDictionary(params.locale);

  // 2. We pass the relevant part of the dictionary as a prop
  return (
    <QuestionnaireComplete
      dict={dictionary.questionnaire.questionnaireCompletePage}
    />
  );
}
