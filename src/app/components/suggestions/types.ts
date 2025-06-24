// src/app/components/suggestions/types.ts

import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

// הטיפוסים המורחבים שהגדרנו, כעת במקום מרכזי
// ועם `export` כדי שניתן יהיה לייבא אותם בכל מקום

export interface ExtendedUserProfile extends UserProfile {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PartyInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: ExtendedUserProfile;
  images: UserImage[];
}

export interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

export interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: StatusHistoryItem[];
}