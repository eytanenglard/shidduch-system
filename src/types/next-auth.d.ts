// src/types/next-auth.d.ts

import type {
  Profile as PrismaProfile,
  UserImage as PrismaUserImage,
  Account as PrismaAccount,
  AvailabilityStatus,
  Gender,
  UserRole,
  UserStatus,
  QuestionnaireResponse as PrismaQuestionnaireResponse,
  ServiceType, // Ensure this is imported if used directly in arrays
  HeadCoveringType, // Ensure this is imported
  KippahType, // Ensure this is imported
  Prisma,
  UserSource,
  ReligiousJourney,
    Prisma,
     TestimonialStatus, // <-- הוספה חדשה
  SubmissionSource, // <-- הוספה חדשה
  Language, 
} from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

// --- Standalone Interface Definitions ---
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
export type WorldId = 'VALUES' | 'PERSONALITY' | 'RELATIONSHIP' | 'PARTNER' | 'RELIGION';

export interface UserProfile extends Omit<PrismaProfile, 'gender' | 'birthDate' | 'height' | 'additionalLanguages' | 'profileCharacterTraits' | 'profileHobbies' | 'preferredReligiousLevels' | 'preferredLocations' | 'preferredEducation' | 'preferredOccupations' | 'preferredMaritalStatuses' | 'preferredOrigins' | 'preferredServiceTypes' | 'preferredHeadCoverings' | 'preferredKippahTypes' | 'preferredCharacterTraits' | 'preferredHobbies' | 'availabilityStatus' | 'isProfileVisible' | 'createdAt' | 'updatedAt'| 'birthDateIsApproximate'> {
  // Overriding PrismaProfile fields with more specific or frontend-friendly types
  // Fields that are identical to PrismaProfile are inherited via Omit and don't need re-declaration unless type needs refinement.

  id: string; // from PrismaProfile
  userId: string; // from PrismaProfile

  gender: Gender; // User's own gender - Kept as required as per your old file
  birthDate: Date; // Kept as required
  birthDateIsApproximate?: boolean | null; // <--- הוסף שדה זה

  // Optional fields that might be null or undefined
  nativeLanguage?: string | null;
  height?: number | null; // Changed from 'number | null' to allow undefined for consistency
  maritalStatus?: string | null;
  occupation?: string | null;
  education?: string | null;
  educationLevel?: string | null;
  city?: string | null;
  origin?: string | null;
  religiousLevel?: string | null;
  about?: string | null;
  shomerNegiah?: boolean | null;
  profileHeadline?: string | null;
  inspiringCoupleStory?: string | null;
  influentialRabbi?: string | null;
  religiousJourney?: ReligiousJourney | null; 
  serviceType?: ServiceType | null;
  serviceDetails?: string | null;
  headCovering?: HeadCoveringType | null;
  kippahType?: KippahType | null;
  hasChildrenFromPrevious?: boolean | null; // This was the field causing issues, ensure it's here
  aliyaCountry?: string | null;
  aliyaYear?: number | null;
  parentStatus?: string | null;
  fatherOccupation?: string | null;
  motherOccupation?: string | null;
  siblings?: number | null;
  position?: number | null;
 manualEntryText?: string | null; 
   isAboutVisible?: boolean | null;
  isFriendsSectionVisible?: boolean | null;
    testimonials?: FriendTestimonial[];
 conversationSummary?: string | null;
  // Array fields - ensure they default to empty arrays if not present
  additionalLanguages: string[];
  profileCharacterTraits: string[];
  profileHobbies: string[];
 hasMedicalInfo?: boolean | null;
  medicalInfoDetails?: string | null;
  medicalInfoDisclosureTiming?: string | null; // הערך כאן צריך להיות תואם ל-enum אם תגדיר
 // --- הוספה חדשה: שדות שליטה על נראות ---
  isAboutVisible?: boolean | null;
  isFriendsSectionVisible?: boolean | null;
  isNeshamaTechSummaryVisible?: boolean | null;
  
  // --- הוספה חדשה: מערך המלצות ---
  testimonials?: FriendTestimonial[];
  // --- הוספה חדשה ---
  isMedicalInfoVisible: boolean; // זה לא אופציונלי כי יש לו ברירת מחדל בדאטהבייס
  // --- Existing Preference Fields ---
  preferredAgeMin?: number | null;
  preferredAgeMax?: number | null;
  preferredHeightMin?: number | null;
  preferredHeightMax?: number | null;
  contactPreference?: string | null;
  matchingNotes?: string | null;
internalMatchmakerNotes?: string | null; 
  // Array preference fields
  preferredReligiousLevels: string[];
  preferredLocations: string[];
  preferredEducation: string[];
  preferredOccupations: string[];

  // --- New Preference Fields (as defined in your old file + the problematic one) ---
  preferredMaritalStatuses: string[]; // UserProfile was missing this one
  preferredShomerNegiah?: string | null; // Kept as string | null as per your old file
  preferredPartnerHasChildren?: string | null; // Kept as string | null
  preferredOrigins: string[]; // UserProfile was missing this
  preferredServiceTypes: ServiceType[]; // UserProfile was missing this, using Prisma enum array
  preferredHeadCoverings: HeadCoveringType[]; // UserProfile was missing this
  preferredKippahTypes: KippahType[]; // UserProfile was missing this
  preferredCharacterTraits: string[]; // UserProfile was missing this
  preferredHobbies: string[]; // UserProfile was missing this
  preferredAliyaStatus?: string | null;
preferredReligiousJourneys: ReligiousJourney[]; 
  // Management fields
  isProfileVisible: boolean; // from PrismaProfile
  isProfileComplete: boolean; // FIXED: Added missing property
  preferredMatchmakerGender?: Gender | null;
  verifiedBy?: string | null; // from PrismaProfile
  availabilityStatus: AvailabilityStatus; // from PrismaProfile
  availabilityNote?: string | null;
  availabilityUpdatedAt?: Date | null;
  hasViewedProfilePreview: boolean; // <--- הוסף את השורה הזו
  needsAiProfileUpdate: boolean;
 cvUrl?: string | null;
  cvSummary?: string | null;
  // Timestamps
  createdAt: Date; // from PrismaProfile
  updatedAt: Date; // from PrismaProfile
  lastActive?: Date | null;
// === Priority System (Internal - Matchmaker Only) ===
  priorityScore?: number | null;
  priorityCategory?: string | null;
  priorityUpdatedAt?: Date | null;
  
  // === Scanning & Suggestions Tracking (Internal) ===
  lastScannedAt?: Date | null;
  lastSuggestedAt?: Date | null;
  pendingMatchesCount?: number;
  
  // === Engagement Metrics (Internal) ===
  suggestionsReceived?: number;
  suggestionsAccepted?: number;
  suggestionsDeclined?: number;
  averageResponseTimeHours?: number | null;
  
  // === Matchmaker Impressions (Internal) ===
  matchmakerImpression?: string | null;
  impressionScore?: number | null;
  redFlags?: string[];
  greenFlags?: string[];
  difficultyScore?: number | null;
  readinessLevel?: 'NOT_READY' | 'UNCERTAIN' | 'SOMEWHAT_READY' | 'READY' | 'VERY_READY' | null;
  
  // === Profile Completeness (Internal) ===
  profileCompletenessScore?: number | null;
  missingFields?: string[];
  
  // === Derived Stats (Internal) ===
  acceptanceRate?: number | null;
  avgMatchScore?: number | null;
  lastActiveAt?: Date | null;
  // Associated user (optional and with optional fields for flexibility)
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
  };

  
}

export interface FormattedAnswer {
  questionId: string;
  question: string;
  
  /**
   * סוג השאלה המקורי (למשל, 'budgetAllocation', 'openText').
   * זה המפתח שיאפשר לנו להציג כל תשובה בצורה המתאימה לה.
   */
  questionType: string;

  /**
   * הערך הגולמי מהתשובה כפי שהוא שמור במסד הנתונים.
   * זה יכול להיות אובייקט, מערך, מספר או טקסט.
   * זה המידע שנשתמש בו כדי לבנות את הגרף הוויזואלי.
   */
  rawValue: Prisma.JsonValue | null;

  /**
   * טקסט התצוגה הפשוט, ישמש לשאלות רגילות ולתצוגת גיבוי.
   */
  displayText: string;
  
  isVisible?: boolean;
  answeredAt: string | Date;
}


export type UserImage = PrismaUserImage;

export interface QuestionAnswers {
  [key: string]: Prisma.JsonValue;
}

export interface QuestionnaireResponse extends Omit<PrismaQuestionnaireResponse, 'valuesAnswers' | 'personalityAnswers' | 'relationshipAnswers' | 'partnerAnswers' | 'religionAnswers'> {
  // Overriding Json fields for more specific typing if necessary, or keeping as Prisma.JsonValue
  valuesAnswers: QuestionAnswers | Prisma.JsonValue | null;
  personalityAnswers: QuestionAnswers | Prisma.JsonValue | null;
  relationshipAnswers: QuestionAnswers | Prisma.JsonValue | null;
  partnerAnswers: QuestionAnswers | Prisma.JsonValue | null;
  religionAnswers: QuestionAnswers | Prisma.JsonValue | null;

   currentQuestionIndices?: {
    PERSONALITY: number;
    VALUES: number;
    RELATIONSHIP: number;
    PARTNER: number;
    RELIGION: number;
  } | Prisma.JsonValue | null;
  // This formattedAnswers seems like a client-side computed property
 formattedAnswers?: {
    [key in WorldId | Uppercase<WorldId>]?: FormattedAnswer[];
  } | null;
  // Other fields from PrismaQuestionnaireResponse are inherited
  // id: string;
  // userId: string;
  // valuesCompleted: boolean;
  // personalityCompleted: boolean;
  // etc.
  
}

export interface User extends DefaultUser {
  id: string;
  email: string; // DefaultUser has email? (optional), making it required here
  firstName: string;
  lastName: string;
  phone?: string | null;
  name: string | null; // from DefaultUser, if you use it, ensure consistency
  image: string | null; // from DefaultUser, if you use it
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  lastLogin?: Date | null; // Changed to optional as it might not always be set
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null; // Using our defined UserProfile
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
      questionnaireCompleted?: boolean;

  accounts?: PrismaAccount[];
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean;
    source: UserSource; // Add new field
  addedByMatchmakerId?: string | null; // Add new field
   termsAndPrivacyAcceptedAt?: Date | null;
       engagementEmailsConsent?: boolean;
  promotionalEmailsConsent?: boolean;

  language: Language; // <-- 2. הוסף את השדה לממשק הראשי
     neshamaInsightLastGeneratedAt?: string | null;
    neshamaInsightGeneratedCount?: number;
}

export interface Verification {
  metadata?: {
    hashedNewPassword?: string;
    [key: string]: string | number | boolean | null | undefined;
  }
}

// --- Module Augmentation for NextAuth ---

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
       name: string | null; // from DefaultUser, keep if used
      image: string | null; // from DefaultUser, keep if used
      role: UserRole;
      status: UserStatus;
      isVerified: boolean;
      isProfileComplete: boolean;
      isPhoneVerified: boolean;
      lastLogin?: Date | null; // Changed to optional
      createdAt: Date;
      updatedAt: Date;
       profile: UserProfile | null;
       images: UserImage[];
       questionnaireResponses: QuestionnaireResponse[];
           questionnaireCompleted?: boolean;
    hasCompletedOnboarding?: boolean; // <-- הוספה כאן

       accounts?: PrismaAccount[];
        source: UserSource; // Add new field
      addedByMatchmakerId?: string | null; // Add new field
       termsAndPrivacyAcceptedAt?: Date | null;
              engagementEmailsConsent?: boolean;
      promotionalEmailsConsent?: boolean;
  language: Language; // <-- 2. הוסף את השדה לממשק הראשי

    }; // Omit to avoid type conflicts if DefaultSession changes

    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
    error?: string; // For passing errors to client
  }

  interface User extends DefaultUser {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email: string; // Making sure email is required
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    isProfileComplete: boolean;
    isPhoneVerified: boolean;
    lastLogin?: Date | null; // Changed to optional
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null; // This is the User object from DB/provider
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
    accounts?: PrismaAccount[];
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
     source: UserSource; // Add new field
    addedByMatchmakerId?: string | null; // Add new field
     termsAndPrivacyAcceptedAt?: Date | null;
     questionnaireCompleted?: boolean;
    hasCompletedOnboarding?: boolean; // <-- הוספה כאן
        neshamaInsightLastGeneratedAt?: Date | string | null;
    neshamaInsightGeneratedCount?: number;

  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    // name and picture are part of DefaultJWT
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    isProfileComplete: boolean;
    isPhoneVerified: boolean;
    lastLogin?: Date | null; // Changed to optional
    createdAt: Date; // Optional as JWT might be created before user is fully in DB
    updatedAt: Date; // Optional
    profile: UserProfile | null;
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
        questionnaireCompleted?: boolean;

    accounts?: PrismaAccount[];
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
    error?: string; // For JWT-based error propagation
     source: UserSource; // Add new field
    addedByMatchmakerId?: string | null; // Add new field
        termsAndPrivacyAcceptedAt?: Date | null; // <--- הוספה
      engagementEmailsConsent?: boolean;
    promotionalEmailsConsent?: boolean;
  language: Language; // <-- 2. הוסף את השדה לממשק הראשי


  }
}

// --- Other Exported Types (Keep these as they were if still used) ---
export type UpdateValue =
  | { type: "answer"; value: string }
  | { type: "visibility"; isVisible: boolean } | {
      type: 'delete'; // הוספת סוג הפעולה 'delete'
    };

export type ContactPreference = "direct" | "matchmaker" | "both"; // Already in UserProfile

// Re-export enums for convenience if they are used directly in other parts of the app
export { Gender, UserRole, UserStatus, AvailabilityStatus, ServiceType, HeadCoveringType, KippahType, Language };