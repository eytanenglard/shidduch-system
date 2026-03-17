// src/app/[locale]/(authenticated)/matchmaker/candidate-file/CandidateFileClient.tsx

'use client';

import CandidateHub from '@/components/matchmaker/CandidateHub';
import type { MatchmakerPageDictionary, SuggestionsDictionary, ProfilePageDictionary } from '@/types/dictionary';
import type { Locale } from '../../../../../../i18n-config';

interface CandidateFileClientProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  suggestionsDict: SuggestionsDictionary;
  locale: Locale;
}

export default function CandidateFileClient({
  matchmakerDict,
  profileDict,
  suggestionsDict,
  locale,
}: CandidateFileClientProps) {
  return (
    <CandidateHub
      matchmakerDict={matchmakerDict}
      profileDict={profileDict}
      suggestionsDict={suggestionsDict}
      locale={locale}
    />
  );
}
