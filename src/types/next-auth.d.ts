
// src/types/next-auth.d.ts (or similar path)

import type {
  Profile as PrismaProfile,
  UserImage as PrismaUserImage,
  Account as PrismaAccount, // Use PrismaAccount directly
  AvailabilityStatus,
  Gender,
  UserRole,
  UserStatus, // Make sure this is imported
  QuestionnaireResponse as PrismaQuestionnaireResponse,
  Prisma,
} from '@prisma/client';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

// --- Standalone Interface Definitions (if used elsewhere) ---

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
  education?: string | null; // תיאור טקסטואלי
  educationLevel?: string | null; // רמת השכלה מובנית
  // address?: string | null; // הוסר
  city?: string | null;
  origin?: string | null;
  religiousLevel?: string | null; // יורחבו האופציות ב-UI
  about?: string | null;
  // hobbies?: string | null; // הוסר (הוחלף ב-profileHobbies)

  // --- שדות חדשים ---
  shomerNegiah?: boolean | null;
  serviceType?: ServiceType | null;
  serviceDetails?: string | null;
  headCovering?: HeadCoveringType | null; // לנשים
  kippahType?: KippahType | null; // לגברים
  hasChildrenFromPrevious?: boolean | null;
  profileCharacterTraits: string[];
  profileHobbies: string[];
  aliyaCountry?: string | null;
  aliyaYear?: number | null;

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
  user?: {
    id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
  };
}

export interface FormattedAnswer {
  questionId: string;
  question: string;
  answer: string;
  displayText: string;
  isVisible?: boolean;
  answeredAt: string | Date;
}

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
    [key: string]: Prisma.JsonValue;
  }
export interface QuestionnaireResponse extends PrismaQuestionnaireResponse {
    id: string;
    userId: string;
    valuesAnswers: QuestionAnswers | Prisma.JsonValue | null;
    personalityAnswers: QuestionAnswers | Prisma.JsonValue | null;
    relationshipAnswers: QuestionAnswers | Prisma.JsonValue | null;
    partnerAnswers: QuestionAnswers | Prisma.JsonValue | null;
    religionAnswers: QuestionAnswers | Prisma.JsonValue | null;
    formattedAnswers?: {
      [key: string]: Array<{
        questionId: string;
        question: string;
        answer: string;
        displayText: string;
        isVisible?: boolean;
        answeredAt: string | Date;
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

// No custom 'Account' interface needed if PrismaAccount suffices
// export interface Account extends PrismaAccount {} // This line is removed

export interface User extends DefaultUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  name: string | null; // DefaultUser has name, ensure consistency
  image: string | null; // DefaultUser has image
  role: UserRole;
  status: UserStatus; // Crucial for resuming flow
  isVerified: boolean; // Email verification status
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: UserProfile | null;
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
  accounts?: PrismaAccount[]; // Changed to PrismaAccount
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean;
  // password field should NOT be in client-side User object
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
  name: string | null; // from DefaultJWT
  picture: string | null; // from DefaultJWT
  role: UserRole;
  status: UserStatus; // Crucial for resuming flow
  isVerified: boolean; // Email verification status
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date; // Assuming populated from DB User
  updatedAt: Date; // Assuming populated from DB User
  profile: UserProfile | null;
  images: UserImage[];
  questionnaireResponses: QuestionnaireResponse[];
  accounts?: PrismaAccount[]; // Changed to PrismaAccount
  redirectUrl?: string;
  newlyCreated?: boolean;
  requiresCompletion?: boolean;
  // Custom claims can be added here
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
      status: UserStatus; // Added status
      isVerified: boolean; // Email verification
      isProfileComplete: boolean;
      isPhoneVerified: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      profile: UserProfile | null;
      images: UserImage[];
      questionnaireResponses: QuestionnaireResponse[];
      accounts?: PrismaAccount[]; // Changed to PrismaAccount
    } & DefaultSession['user'];

    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
  }

  interface User extends DefaultUser { // This is the user object passed to JWT/Session callbacks on sign-in/sign-up
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role: UserRole;
    status: UserStatus; // Added status
    isVerified: boolean; // Email verification
    isProfileComplete: boolean;
    isPhoneVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null;
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
    accounts?: PrismaAccount[]; // Changed to PrismaAccount
    redirectUrl?: string;
    newlyCreated?: boolean;
    requiresCompletion?: boolean;
    
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string; // Ensure email is present as DefaultJWT might make it optional
    firstName: string;
    lastName: string;
    phone?: string | null;
    // name and picture are already in DefaultJWT
    role: UserRole;
    status: UserStatus; // Added status
    isVerified: boolean; // Email verification
    isProfileComplete: boolean;
    isPhoneVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null;
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
    accounts?: PrismaAccount[]; // Changed to PrismaAccount
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
export { Gender, UserRole, UserStatus, AvailabilityStatus, ServiceType, HeadCoveringType, KippahType };
