// src/app/[locale]/matches/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import MatchesClientPage from './MatchesClientPage';

export default async function MatchesPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  // ✅ חילוץ החלקים הרלוונטיים מהמילון המלא
  return (
    <MatchesClientPage
      suggestionsDict={dictionary.suggestions}
      profileCardDict={dictionary.profilePage.profileCard} // <--- prop נפרד, בדיוק כמו ב-HomePage
    />
  );
}
