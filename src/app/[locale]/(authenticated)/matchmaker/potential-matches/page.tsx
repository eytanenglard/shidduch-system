// src/app/[locale]/(authenticated)/matchmaker/potential-matches/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import PotentialMatchesClient from './PotentialMatchesClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type PotentialMatchesPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PotentialMatchesPage({ params }: PotentialMatchesPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען התאמות פוטנציאליות..."
          subtext="מכינים את רשימת ההתאמות"
        />
      }
    >
      <PotentialMatchesClient
        matchmakerDict={dictionary.matchmakerPage}
        profileDict={dictionary.profilePage}
        locale={locale}
      />
    </Suspense>
  );
}