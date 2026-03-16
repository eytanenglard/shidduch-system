// src/app/[locale]/(authenticated)/matchmaker/candidate-file/page.tsx

import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import CandidateFileClient from './CandidateFileClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type CandidateFilePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function CandidateFilePage({ params }: CandidateFilePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען תיק מועמד..."
          subtext="מכינים את הממשק"
        />
      }
    >
      <CandidateFileClient
        matchmakerDict={dictionary.matchmakerPage}
        profileDict={dictionary.profilePage}
        locale={locale}
      />
    </Suspense>
  );
}
