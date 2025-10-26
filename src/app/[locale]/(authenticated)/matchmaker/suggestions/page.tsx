// src/app/[locale]/matchmaker/suggestions/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import MatchmakerDashboardPageClient from './MatchmakerDashboardPageClient';
import type {
  MatchmakerPageDictionary,
  SuggestionsDictionary,
  ProfilePageDictionary,
} from '@/types/dictionary';

// זהו רכיב שרת (Server Component).
// ▼▼▼ CHANGE WAS MADE HERE ▼▼▼
export default async function SuggestionsPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params; // Destructure locale inside the function
  // 1. טוענים את המילון המלא כאן, בצד השרת.
  const dictionary = await getDictionary(locale);

  // ✅ 2. קוראים לרכיב הלקוח ומעבירים לו את המילונים כ-props נפרדים.
  return (
    <MatchmakerDashboardPageClient
      suggestionsDict={dictionary.suggestions as SuggestionsDictionary}
      matchmakerDict={dictionary.matchmakerPage as MatchmakerPageDictionary}
      profileDict={dictionary.profilePage as ProfilePageDictionary}
    />
  );
}