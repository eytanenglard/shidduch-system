// src/app/[locale]/questionnaire/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../i18n-config';
import QuestionnairePageClient from '@/components/questionnaire/QuestionnairePageClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

function Loading() {
  return (
    <StandardizedLoadingSpinner
      text="טוען את השאלון..."
      subtext="מכינים את השאלות עבורך"
    />
  );
}

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const dictionary = await getDictionary(locale);

  console.log(
    `\n✅ [LOG | /questionnaire/page.tsx SERVER SIDE] Received searchParams:`,
    resolvedSearchParams,
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
