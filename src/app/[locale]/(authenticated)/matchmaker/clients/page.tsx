// src/app/[locale]/(authenticated)/matchmaker/clients/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import CandidatesManagerClient from './CandidatesManagerClient';

// הגדרת ה-props הנכונה
type ClientsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ClientsPage({ params }: ClientsPageProps) {
  // שימוש ב-await כדי לחלץ את המידע מה-Promise
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <CandidatesManagerClient
      matchmakerDict={dictionary.matchmakerPage}
      profileDict={dictionary.profilePage}
      locale={locale}
    />
  );
}