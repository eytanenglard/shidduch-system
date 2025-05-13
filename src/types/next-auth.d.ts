// src/types/next-auth.d.ts (or similar path)

import type {
  Profile as PrismaProfile,
  UserImage as PrismaUserImage,
  AvailabilityStatus,
  Gender,
  UserRole,
  UserStatus,
  QuestionnaireResponse as PrismaQuestionnaireResponse,
  Prisma, // Make sure Prisma is imported if used for JsonValue
} from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT, JWT as NextAuthJWT } from 'next-auth/jwt'; // Import JWT as NextAuthJWT to avoid name clash

// --- Standalone Interface Definitions (if used elsewhere) ---

// This UserProfile is the one imported by ProfileCard.tsx
// It extends PrismaProfile and adds specific fields, including the nested user info.
export interface UserProfile extends PrismaProfile {
    id: string;
    userId: string;
    gender: Gender;
    birthDate: Date;
    nativeLanguage?: string | null;
    additionalLanguages: string[];
    height: number | null;
    maritalStatus?: string | null;
    occupation?: string | null;
    education?: string | null;
    address?: string | null;
    city?: string | null;
    origin?: string | null;
    religiousLevel?: string | null;
    about?: string | null;
    hobbies?: string | null;
    parentStatus?: string | null;
    siblings?: number | null;
    position?: number | null;
    preferredAgeMin?: number | null;
    preferredAgeMax?: number | null;
    preferredHeightMin?: number | null;
    preferredHeightMax?: number | null;
    preferredReligiousLevels: string[];
    preferredLocations: string[];
    preferredEducation: string[];
    preferredOccupations: string[];
    contactPreference?: string | null;
    referenceName1?: string | null;
    referencePhone1?: string | null;
    referenceName2?: string | null;
    referencePhone2?: string | null;
    isProfileVisible: boolean;
    preferredMatchmakerGender?: Gender | null;
    matchingNotes?: string | null;
    verifiedBy?: string | null;
    availabilityStatus: AvailabilityStatus;
    availabilityNote?: string | null;
    availabilityUpdatedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lastActive?: Date | null;

    // --- ADDED SECTION TO FIX THE ERROR ---
    /**
     * Optional nested user information, typically containing basic details
     * like first and last name. This is to support components like ProfileCard
     * that expect name information directly associated with the profile data.
     * This data would need to be populated by including the related User record
     * (or parts of it) when fetching the Profile.
     */
    user?: {
        firstName?: string; // Made optional to match `profile?.user?.firstName` usage
        lastName?: string; 
        email?: string; // Made optional to match `profile?.user?.lastName` usage
    };
    // --- END OF ADDED SECTION ---
  }

// ADD THIS DEFINITION:
export interface FormattedAnswer {
  questionId: string;
  question: string;
  answer: string;
  displayText: string;
  isVisible?: boolean;
  answeredAt: string | Date; // Matches usage in QuestionnaireResponse
}
// END OF ADDED DEFINITION
export interface UserImage extends PrismaUserImage {
    id: string;
    url: string;
    isMain: boolean;
    cloudinaryPublicId?: string | null;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface QuestionAnswers {
    [key: string]: Prisma.JsonValue; // או any אם הערכים לא בהכרח JSON, אבל JsonValue עדיף
  }
export interface QuestionnaireResponse extends PrismaQuestionnaireResponse {
    id: string;
    userId: string;
    valuesAnswers: QuestionAnswers | Prisma.JsonValue | null;
    personalityAnswers: QuestionAnswers | Prisma.JsonValue | null;
    relationshipAnswers: QuestionAnswers | Prisma.JsonValue | null;
    partnerAnswers: QuestionAnswers | Prisma.JsonValue | null;
    religionAnswers: QuestionAnswers | Prisma.JsonValue | null;
    // formattedAnswers?: { [key: string]: { questionId: string; question: string; answer: any; displayText: string; isVisible?: boolean; answeredAt: Date }[] };
    formattedAnswers?: {
      [key: string]: Array<{
        questionId: string;
        question: string;
        answer: string;
        displayText: string;
        isVisible?: boolean;
        answeredAt: string | Date; // Ensure this matches ProfileCard usage
      }>;
    } | null;
    valuesCompleted: boolean;
    personalityCompleted: boolean;
    relationshipCompleted: boolean;
    partnerCompleted: boolean;
    religionCompleted: boolean;
    worldsCompleted: string[];
    completed: boolean;
    startedAt: Date;
    completedAt: Date | null;
    lastSaved: Date;
    createdAt: Date;
    updatedAt: Date;
  }


export interface User extends DefaultUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  name: string | null;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null; // Use the extended UserProfile
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean;
  password?: string | null;
}

export interface Verification {
  metadata?: {
    hashedNewPassword?: string;
    [key: string]: string | number | boolean | null | undefined;
  }
}

export interface JWT extends DefaultJWT {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  name: string | null;
  picture: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null; // Use the extended UserProfile
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean;
}

export interface Session extends DefaultSession {
  user: User; // Use the extended User interface defined above
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean;
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
      name: string | null;
      image: string | null;
      role: UserRole;
      status: UserStatus;
      isVerified: boolean;
      isProfileComplete: boolean;
      isPhoneVerified: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      profile: UserProfile | null; // Changed from PrismaProfile to UserProfile
      images: UserImage[]; // Changed from PrismaUserImage to UserImage
      questionnaireResponses: QuestionnaireResponse[]; // Changed from PrismaQuestionnaireResponse
    } & DefaultSession['user'];

    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
  }

  interface User extends DefaultUser {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    isProfileComplete: boolean;
    isPhoneVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null; // Changed from PrismaProfile to UserProfile
    images: UserImage[]; // Changed from PrismaUserImage to UserImage
    questionnaireResponses: QuestionnaireResponse[]; // Changed from PrismaQuestionnaireResponse
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    name: string | null;
    picture: string | null;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    isProfileComplete: boolean;
    isPhoneVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null; // Changed from PrismaProfile to UserProfile
    images: UserImage[]; // Changed from PrismaUserImage to UserImage
    questionnaireResponses: QuestionnaireResponse[]; // Changed from PrismaQuestionnaireResponse
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
  }
}

// --- Other Exported Types (Keep these as they were) ---
export type UpdateValue =
  | { type: "answer"; value: string }
  | { type: "visibility"; isVisible: boolean };
export type ContactPreference = "direct" | "matchmaker" | "both";
export { Gender, UserRole, UserStatus, AvailabilityStatus };