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
  return (
    <PotentialMatchesDashboard
      matchmakerDict={matchmakerDict} // <-- הוספנו את זה כדי לתקן את השגיאה
      profileDict={profileDict}
      locale={locale}
    />
  );
}
