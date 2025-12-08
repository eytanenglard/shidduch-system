// src/app/[locale]/(authenticated)/matchmaker/clients/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import CandidatesManagerClient from './CandidatesManagerClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type ClientsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ClientsPage({ params }: ClientsPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען את מנהל המועמדים..."
          subtext="מכינים את רשימת הלקוחות והפרופילים"
        />
      }
    >
      <CandidatesManagerClient
        matchmakerDict={dictionary.matchmakerPage}
        profileDict={dictionary.profilePage}
        locale={locale}
      />
    </Suspense>
  );
}
