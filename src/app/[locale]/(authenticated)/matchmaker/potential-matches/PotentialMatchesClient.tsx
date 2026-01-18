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
  profileDict, // <-- מקבלים כאן
  locale,
}: PotentialMatchesClientProps) {
  return (
    <PotentialMatchesDashboard
      locale={locale}
      profileDict={profileDict} // <-- הוסף שורה זו: העברת המילון לדשבורד
    />
  );
}
