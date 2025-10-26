// src/app/[locale]/(authenticated)/matchmaker/suggestions/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import MatchmakerDashboardPageClient from './MatchmakerDashboardPageClient';
import type {
  MatchmakerPageDictionary,
  SuggestionsDictionary,
  ProfilePageDictionary,
} from '@/types/dictionary';

// הגדרת ה-props הנכונה
type SuggestionsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function SuggestionsPage({ params }: SuggestionsPageProps) {
  // שימוש ב-await כדי לחלץ את המידע מה-Promise
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <MatchmakerDashboardPageClient
      suggestionsDict={dictionary.suggestions as SuggestionsDictionary}
      matchmakerDict={dictionary.matchmakerPage as MatchmakerPageDictionary}
      profileDict={dictionary.profilePage as ProfilePageDictionary}
    />
  );
}
