// File: CandidatesManagerClient.tsx

'use client';

import CandidatesManager from '@/components/matchmaker/new/CandidatesManager/index';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';

interface CandidatesManagerClientProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  locale: string; // ▼▼▼ ADDED: locale prop ▼▼▼
}

export default function CandidatesManagerClient({
  matchmakerDict,
  profileDict,
  locale, // ▼▼▼ ADDED: destructure locale ▼▼▼
}: CandidatesManagerClientProps) {
  // ▼▼▼ CHANGE: Pass the dictionaries and the new locale prop down ▼▼▼
  return (
    <CandidatesManager
      matchmakerDict={matchmakerDict}
      profileDict={profileDict}
      locale={locale}
    />
  );
}
