// src/app/components/suggestions/types.ts

import type { MatchSuggestion, Profile, User, UserImage } from "@prisma/client";

// This type now accurately reflects the structure of Prisma's Profile model.
export type UserProfile = Profile;

// PartyInfo now includes fields from both User and Profile, creating a complete picture.
export interface PartyInfo {
  // Fields from User model
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isProfileComplete: boolean;

  // Relation to Profile (which can be null)
  profile: UserProfile | null;

  // Relation to Images (which is a full UserImage array)
  images: UserImage[];
}

export interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

// This now correctly expects PartyInfo which can have a null profile.
export interface ExtendedMatchSuggestion extends Omit<MatchSuggestion, 'firstParty' | 'secondParty' | 'matchmaker'> {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: StatusHistoryItem[];
}