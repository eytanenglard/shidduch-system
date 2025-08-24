// File: CandidatesManagerClient.tsx

'use client';

import CandidatesManager from '@/components/matchmaker/new/CandidatesManager/index';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';

interface CandidatesManagerClientProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
}

export default function CandidatesManagerClient({
  matchmakerDict,
  profileDict,
}: CandidatesManagerClientProps) {
  // Pass the dictionaries down to the main component
  return (
    <CandidatesManager
      matchmakerDict={matchmakerDict}
      profileDict={profileDict}
    />
  );
}
