'use client';

import CandidatesManager from "@/components/matchmaker/new/CandidatesManager/index";
import type { MatchmakerPageDictionary } from "@/types/dictionaries/matchmaker";
import type { SuggestionsDictionary } from "@/types/dictionary";
import type { ProfilePageDictionary } from "@/types/dictionary";

interface CandidatesManagerClientProps {
  matchmakerDict: MatchmakerPageDictionary;
  suggestionsDict: SuggestionsDictionary;
  profileDict: ProfilePageDictionary;
}

export default function CandidatesManagerClient({ 
  matchmakerDict, 
  suggestionsDict, 
  profileDict 
}: CandidatesManagerClientProps) {
  // Pass the dictionaries down to the main component
  return (
    <CandidatesManager 
      matchmakerDict={matchmakerDict}
      suggestionsDict={suggestionsDict}
      profileDict={profileDict}
    />
  );
}