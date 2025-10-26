// File: src/app/[locale]/(authenticated)/matchmaker/clients/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import CandidatesManagerClient from './CandidatesManagerClient';

// This is a Server Component
// ▼▼▼ CHANGE WAS MADE HERE ▼▼▼
export default async function ClientsPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params; // Destructure locale inside the function
  // Load the full dictionary on the server
  const dictionary = await getDictionary(locale);

  // Pass the required dictionary slices as props to the client component
  return (
    <CandidatesManagerClient
      matchmakerDict={dictionary.matchmakerPage}
      profileDict={dictionary.profilePage}
      locale={locale}
    />
  );
}
