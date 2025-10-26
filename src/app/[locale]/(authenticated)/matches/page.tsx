// src/app/[locale]/(authenticated)/matches/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import MatchesClientPage from './MatchesClientPage';

// הגדרת ה-props הנכונה
type MatchesPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function MatchesPage({ params }: MatchesPageProps) {
  // שימוש ב-await כדי לחלץ את המידע מה-Promise
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <MatchesClientPage
      suggestionsDict={dictionary.suggestions}
      profileCardDict={dictionary.profilePage.profileCard}
    />
  );
}