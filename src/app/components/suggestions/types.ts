// src/app/components/suggestions/types.ts

import type {
  MatchSuggestion,
  Profile,
  User,
  UserImage,
  QuestionnaireResponse as PrismaQuestionnaireResponse,
} from '@prisma/client';

// --- הוספה חדשה ---
// הגדרת טיפוס מרכזי לעולמות השאלון
export type WorldId =
  | 'values'
  | 'personality'
  | 'relationship'
  | 'partner'
  | 'religion';

// This type now accurately reflects the structure of Prisma's Profile model.
export type UserProfile = Profile;

// --- שינוי קל להוספת טיפוס ברור יותר ---
export type QuestionnaireResponse = PrismaQuestionnaireResponse;

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

  // --- שינוי: שימוש בטיפוס המדויק ---
  questionnaireResponses?: QuestionnaireResponse[];
}

export interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

// This now correctly expects PartyInfo which can have a null profile.
export interface ExtendedMatchSuggestion
  extends Omit<MatchSuggestion, 'firstParty' | 'secondParty' | 'matchmaker'> {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: StatusHistoryItem[];
}
