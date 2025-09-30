// src/app/components/suggestions/types.ts

import type {
  MatchSuggestion,
  Profile as PrismaProfile, // שינינו את השם כדי למנוע התנגשות
  User,
  UserImage,
  QuestionnaireResponse as PrismaQuestionnaireResponse,
  TestimonialStatus, // ייבוא הטיפוסים הנדרשים
  SubmissionSource,   // ייבוא הטיפוסים הנדרשים
} from '@prisma/client';

// 1. הגדרת טיפוס עבור המלצת חבר בודדת
export interface FriendTestimonial {
  id: string;
  authorName: string;
  relationship: string;
  content: string;
  authorPhone?: string | null;
  isPhoneVisibleToMatch: boolean;
  status: TestimonialStatus;
  submittedBy: SubmissionSource;
  createdAt: Date;
}

// 2. הגדרת הטיפוס UserProfile כך שירחיב את הטיפוס של פריזמה ויוסיף את ההמלצות
export interface UserProfile extends PrismaProfile {
  testimonials?: FriendTestimonial[]; // הוספנו את השדה החסר כאן
}

// הגדרת טיפוס מרכזי לעולמות השאלון
export type WorldId =
  | 'values'
  | 'personality'
  | 'relationship'
  | 'partner'
  | 'religion';

export type QuestionnaireResponse = PrismaQuestionnaireResponse;

// PartyInfo עכשיו ישתמש ב-UserProfile המעודכן שלנו
export interface PartyInfo {
  // Fields from User model
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isProfileComplete: boolean;

  // Relation to Profile (which can be null)
  profile: UserProfile | null; // כאן יבוא לידי ביטוי התיקון

  // Relation to Images (which is a full UserImage array)
  images: UserImage[];

  questionnaireResponses?: QuestionnaireResponse[];
}

export interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

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