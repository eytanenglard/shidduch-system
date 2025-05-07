// src/types/next-auth.d.ts (or similar path)

import type {
  Profile as PrismaProfile,
  UserImage as PrismaUserImage,
  AvailabilityStatus,
  Gender,
  UserRole,
  UserStatus,
  QuestionnaireResponse as PrismaQuestionnaireResponse,
} from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

// --- Standalone Interface Definitions (if used elsewhere) ---
// These mirror the module augmentations below

export interface User extends DefaultUser {
  id: string;
  email: string; // email is typically required and guaranteed by NextAuth
  firstName: string;
  lastName: string;
  phone?: string | null; // Add phone here as well
  name: string | null; // DefaultUser might have this optional
  image: string | null; // DefaultUser has this
  role: UserRole;
  status: UserStatus;
  isVerified: boolean; // Email verification status
  isProfileComplete: boolean;
  isPhoneVerified: boolean; // <<-- ADDED
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null;
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
  // Optional flags passed during auth flow
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean; // <<-- ADDED
}

export interface Verification {
  metadata?: {
    hashedNewPassword?: string;
    [key: string]: string | number | boolean | null | undefined;
  }
}

export interface JWT extends DefaultJWT {
  id: string; // Ensure id is required
  email: string; // Ensure email is required
  firstName: string;
  lastName: string;
  phone?: string | null; // <<-- ADDED
  name: string | null;
  picture: string | null; // Matches DefaultJWT picture
  role: UserRole;
  status: UserStatus;
  isVerified: boolean; // Email verification
  isProfileComplete: boolean;
  isPhoneVerified: boolean; // <<-- ADDED
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null;
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
  // Optional flags
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean; // <<-- ADDED
  // DefaultJWT fields like sub, iat, exp, jti might also exist
}

export interface Session extends DefaultSession {
  user: User; // Use the extended User interface defined above
  // Optional flags (can be on session root or session.user)
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean; // <<-- ADDED
}


// --- Prisma Model Extensions (Keep these as they define nested structures) ---

export interface UserProfile extends PrismaProfile {
    // Keep your detailed UserProfile definition
    id: string;
    userId: string;
    gender: Gender;
    birthDate: Date;
    nativeLanguage?: string | null;
    additionalLanguages: string[];
    height: number | null;
    maritalStatus?: string | null; // Allow null if optional
    occupation?: string | null;
    education?: string | null;
    address?: string | null;
    city?: string | null;
    origin?: string | null;
    religiousLevel?: string | null;
    about?: string | null;
    hobbies?: string | null;
    parentStatus?: string | null;
    siblings?: number | null; // Allow null if optional
    position?: number | null; // Allow null if optional
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
    preferredMatchmakerGender?: Gender | null; // Allow null if optional
    matchingNotes?: string | null;
    verifiedBy?: string | null;
    availabilityStatus: AvailabilityStatus;
    availabilityNote?: string | null;
    availabilityUpdatedAt?: Date | null; // Allow null if optional
    createdAt: Date;
    updatedAt: Date;
    lastActive?: Date | null; // Allow null if optional
    // Removed 'user' relation from here if UserProfile is nested within User type above
  }

export interface UserImage extends PrismaUserImage {
    // Keep your detailed UserImage definition
    id: string;
    url: string;
    isMain: boolean;
    cloudinaryPublicId?: string | null; // Allow null if optional
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }

// Assume FormattedAnswer and QuestionAnswers are correctly defined

export interface QuestionnaireResponse extends PrismaQuestionnaireResponse {
    // Keep your detailed QuestionnaireResponse definition
    id: string;
    userId: string;
    valuesAnswers: QuestionAnswers | Prisma.JsonValue | null; // Use Prisma.JsonValue or QuestionAnswers
    personalityAnswers: QuestionAnswers | Prisma.JsonValue | null;
    relationshipAnswers: QuestionAnswers | Prisma.JsonValue | null;
    partnerAnswers: QuestionAnswers | Prisma.JsonValue | null;
    religionAnswers: QuestionAnswers | Prisma.JsonValue | null;
    // formattedAnswers?: { /* ... */ }; // Optional formatting
    valuesCompleted: boolean;
    personalityCompleted: boolean;
    relationshipCompleted: boolean;
    partnerCompleted: boolean;
    religionCompleted: boolean;
    worldsCompleted: string[];
    completed: boolean;
    startedAt: Date; // Use Date type
    completedAt: Date | null;
    lastSaved: Date; // Use Date type
    createdAt: Date; // Use Date type
    updatedAt: Date; // Use Date type
  }


// --- Module Augmentation for NextAuth ---

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface RedirectCallbackParams<T = NextAuthJWT | undefined> { // Use the imported JWT type here
    /** The URL provided as the redirect target */
    url: string;
    /** The base URL of the site */
    baseUrl: string;
    /** The JWT token, only available if using the "jwt" session strategy */
    token?: T; // Use T which defaults to NextAuthJWT | undefined
  }
  interface Session extends DefaultSession {
    
    user: {
      id: string;
      email: string; // Keep non-optional
      firstName: string;
      lastName: string;
      phone?: string | null; // <<-- ADDED
      name: string | null;
      image: string | null;
      role: UserRole;
      status: UserStatus;
      isVerified: boolean; // Email verification
      isProfileComplete: boolean;
      isPhoneVerified: boolean; // <<-- ADDED
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      // Keep nested Prisma types optional or defined as needed
      profile: PrismaProfile | null;
      images: PrismaUserImage[];
      questionnaireResponses: PrismaQuestionnaireResponse[];
    } & DefaultSession['user']; // Extend DefaultSession user if needed

    // Optional flags directly on session
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean; // <<-- ADDED
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    id: string; // Ensure id is always present
    firstName: string;
    lastName: string;
    phone?: string | null; // <<-- ADDED
    role: UserRole;
    status: UserStatus;
    isVerified: boolean; // Email verification
    isProfileComplete: boolean;
    isPhoneVerified: boolean; // <<-- ADDED
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // Keep nested Prisma types optional or defined as needed
    profile: PrismaProfile | null;
    images: PrismaUserImage[];
    questionnaireResponses: PrismaQuestionnaireResponse[];
    // Optional flags
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean; // <<-- ADDED
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    id: string; // Ensure id is always present
    email: string; // Ensure email is always present
    firstName: string;
    lastName: string;
    phone?: string | null; // <<-- ADDED
    name: string | null; // Use DefaultJWT name type
    picture: string | null; // Use DefaultJWT picture type
    role: UserRole;
    status: UserStatus;
    isVerified: boolean; // Email verification
    isProfileComplete: boolean;
    isPhoneVerified: boolean; // <<-- ADDED
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    // Keep nested Prisma types optional or defined as needed
    profile: PrismaProfile | null;
    images: PrismaUserImage[];
    questionnaireResponses: PrismaQuestionnaireResponse[];
    // Optional flags
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean; // <<-- ADDED
    // DefaultJWT fields like sub, iat, exp, jti are automatically included
  }
}

// --- Other Exported Types (Keep these as they were) ---
export type UpdateValue =
  | { type: "answer"; value: string }
  | { type: "visibility"; isVisible: boolean };
export type ContactPreference = "direct" | "matchmaker" | "both";
export { Gender, UserRole, UserStatus, AvailabilityStatus }; // Export enums