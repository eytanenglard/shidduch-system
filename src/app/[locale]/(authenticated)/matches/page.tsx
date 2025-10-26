// src/app/[locale]/matches/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import MatchesClientPage from './MatchesClientPage';

// ▼▼▼ CHANGE WAS MADE HERE ▼▼▼
export default async function MatchesPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params; // Destructure locale inside the function
  const dictionary = await getDictionary(locale);

  // ✅ חילוץ החלקים הרלוונטיים מהמילון המלא
  return (
    <MatchesClientPage
      suggestionsDict={dictionary.suggestions}
      profileCardDict={dictionary.profilePage.profileCard} // <--- prop נפרד, בדיוק כמו ב-HomePage
    />
  );
}