// src/app/[locale]/(authenticated)/matchmaker/potential-matches/PotentialMatchesClient.tsx
'use client';

import PotentialMatchesDashboard from '@/components/matchmaker/new/PotentialMatches/PotentialMatchesDashboard';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';

interface PotentialMatchesClientProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  locale: string;
}

export default function PotentialMatchesClient({
  matchmakerDict,
  profileDict,
  locale,
}: PotentialMatchesClientProps) {
  return <PotentialMatchesDashboard locale={locale} />;
}
