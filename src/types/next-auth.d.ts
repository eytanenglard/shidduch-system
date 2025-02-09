  import type {
    Profile as PrismaProfile,
    UserImage as PrismaUserImage,
    AvailabilityStatus,
    Gender,
    UserRole,
    UserStatus,
    QuestionnaireResponse as PrismaQuestionnaireResponse
  } from '@prisma/client';
  import { DefaultUser } from 'next-auth';

  export interface User extends DefaultUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string | null;
    image: string | null;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null;
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
  }

  export interface Verification {
    metadata?: {
      hashedNewPassword?: string;
      [key: string]: any;
    }
  }

  export interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string | null;
    picture: string | null;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    profile: UserProfile | null;
    images: UserImage[];
    questionnaireResponses: QuestionnaireResponse[];
  }

  export interface UserProfile extends PrismaProfile {
    id: string;
    userId: string;
    gender: Gender;
    birthDate: Date;
    nativeLanguage?: string | null;
    additionalLanguages: string[];
    height: number | null;
    maritalStatus?: string;
    occupation?: string;
    education?: string;
    address?: string;
    city?: string;
    origin?: string;
    religiousLevel?: string;
    about?: string;
    hobbies?: string;
    parentStatus?: string;
    siblings?: number;
    position?: number;
    preferredAgeMin?: number;
    preferredAgeMax?: number;
    preferredHeightMin?: number;
    preferredHeightMax?: number;
    preferredReligiousLevels: string[];
    preferredLocations: string[];
    preferredEducation: string[];
    preferredOccupations: string[];
    contactPreference?: string;
    referenceName1?: string;
    referencePhone1?: string;
    referenceName2?: string;
    referencePhone2?: string;
    isProfileVisible: boolean;
    preferredMatchmakerGender?: Gender;
    matchingNotes?: string;
    verifiedBy?: string;
    availabilityStatus: AvailabilityStatus;
    availabilityNote?: string;
    availabilityUpdatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastActive?: Date;
    user:{ 
      email: string;
      firstName: string;
      lastName: string;
    }
 
  
  }

  export interface UserImage extends PrismaUserImage {
    id: string;
    url: string;
    isMain: boolean;
    cloudinaryPublicId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface FormattedAnswer {
    questionId: string;
    question: string;
    value: any;
    displayText: string;
    answeredAt: string;
    category?: string;
    isVisible: boolean;
  }

  export interface QuestionnaireResponse extends PrismaQuestionnaireResponse {
    id: string;
    userId: string;
    valuesAnswers: any;
    personalityAnswers: any;
    relationshipAnswers: any;
    partnerAnswers: any;
    religionAnswers: any;
    formattedAnswers?: {
      values: FormattedAnswer[];
      personality: FormattedAnswer[];
      relationship: FormattedAnswer[];
      partner: FormattedAnswer[];
      religion: FormattedAnswer[];
    };
    valuesCompleted: boolean;
    personalityCompleted: boolean;
    relationshipCompleted: boolean;
    partnerCompleted: boolean;
    religionCompleted: boolean;
    worldsCompleted: string[];
    completed: boolean;
    startedAt: string | Date;
    completedAt: Date | null;
    lastSaved: string | Date;
    createdAt: string | Date;
    updatedAt: string | Date;
  }

  export interface Session {
    user: User;
  }

  export { Gender, UserRole, UserStatus, AvailabilityStatus };


  declare module 'next-auth' {
    interface Session extends DefaultSession {
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        name: string | null;
        image: string | null;
        role: UserRole;
        status: UserStatus;
        isVerified: boolean;
        lastLogin: Date | null;
        createdAt: Date;
        updatedAt: Date;
        profile: PrismaProfile | null;
        images: PrismaUserImage[];
        questionnaireResponses: PrismaQuestionnaireResponse[];
      }
    }

    interface User extends DefaultUser {
      id: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      status: UserStatus;
      isVerified: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      profile: PrismaProfile | null;
      images: PrismaUserImage[];
      questionnaireResponses: PrismaQuestionnaireResponse[];
    }
  }

  declare module 'next-auth/jwt' {
    interface JWT {
      id: string;
      email?: string | null;
      firstName: string;
      lastName: string;
      name: string | null;
      picture: string | null;
      role: UserRole;
      status: UserStatus;
      isVerified: boolean;
      lastLogin: Date | null;
      createdAt: Date;
      updatedAt: Date;
      profile: PrismaProfile | null;
      images: PrismaUserImage[];
      questionnaireResponses: PrismaQuestionnaireResponse[];
      sub?: string;
    }
  }

  export type ContactPreference = "direct" | "matchmaker" | "both";