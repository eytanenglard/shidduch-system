// src/app/[locale]/(authenticated)/matchmaker/messages/page.tsx
// ==========================================
// NeshamaTech - Matchmaker Messages Page (Server Component)
// Route: /he/matchmaker/messages or /en/matchmaker/messages
// ==========================================

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import MatchmakerMessagesClientPage from './MatchmakerMessagesClientPage';

type MatchmakerMessagesPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function MatchmakerMessagesPage({ params }: MatchmakerMessagesPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <MatchmakerMessagesClientPage
      locale={locale}
      // אם יש מילון ייעודי להודעות שדכן, העבר אותו כאן:
      // dict={dictionary.matchmakerMessagesPage}
    />
  );
}