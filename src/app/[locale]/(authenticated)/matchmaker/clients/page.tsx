import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import CandidatesManagerClient from './CandidatesManagerClient';

// This is a Server Component
export default async function ClientsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // Load the full dictionary on the server
  const dictionary = await getDictionary(locale);

  // Pass the required dictionary slices as props to the client component
  return (
    <CandidatesManagerClient
      matchmakerDict={dictionary.matchmakerPage}
      suggestionsDict={dictionary.suggestions}
      profileDict={dictionary.profilePage}
    />
  );
}
