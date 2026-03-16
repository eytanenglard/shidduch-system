// src/app/[locale]/(authenticated)/matchmaker/candidate-file/CandidateFileClient.tsx

'use client';

import CandidateHub from '@/components/matchmaker/CandidateHub';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';
import type { Locale } from '../../../../../../i18n-config';

interface CandidateFileClientProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  locale: Locale;
}

export default function CandidateFileClient({
  matchmakerDict,
  profileDict,
  locale,
}: CandidateFileClientProps) {
  return (
    <CandidateHub
      matchmakerDict={matchmakerDict}
      profileDict={profileDict}
      locale={locale}
    />
  );
}
