// candidates.ts
import { Gender, AvailabilityStatus, UserStatus } from '@prisma/client';
import type { UserProfile, UserImage, QuestionnaireResponse} from '@/types/next-auth';

// Base API Response Type
export interface APIResponse<T> {
  success: boolean;
  clients: T[];
  count: number;
  error?: string;
}

// Base Types
export type CandidateImage = UserImage;

export type CandidateProfile = UserProfile;

export interface Candidate {
  id: string;
  email: string;
  firstName: string;
  createdAt: Date;
  lastName: string;
  status: UserStatus;
  isVerified: boolean;
  images: CandidateImage[];
  isProfileComplete: boolean;
  profile: CandidateProfile;
}

export interface CandidatesFilter {
  gender?: Gender;
  ageRange?: {
    min: number;
    max: number;
  };
  heightRange?: {
    min: number;
    max: number;
  };
  cities?: string[];
  religiousLevel?: string;
  occupations?: string[];
  educationLevel?: string;
  maritalStatus?: string;
  availabilityStatus?: AvailabilityStatus | string;
  isVerified?: boolean;
  hasReferences?: boolean;
  lastActiveDays?: number;
  isProfileComplete?: boolean;
  searchQuery?: string;
  savedFilterId?: string;
  separateFiltering?: boolean;
  maleFilters?: Partial<CandidatesFilter>;
  femaleFilters?: Partial<CandidatesFilter>;
  userStatus?: UserStatus; // הוסף שדה זה

}

// ViewMode and Action Types - אלה נשארים כמו שהם
export type ViewMode = 'grid' | 'list';
export type CardSize = 'sm' | 'md' | 'lg';
export type CandidateAction = 'suggest' | 'invite' | 'contact' | 'favorite' | 'view' | 'edit';

// Profile Card Types
export interface ProfileCardData {
  profile: CandidateProfile;
  images: CandidateImage[];
  questionnaire?: QuestionnaireResponse;
}

/**
 * ממפה את אובייקט המועמד מהשרת למבנה הנדרש עבור ProfileCard
 */
export const mapCandidateToProfileCard = (candidate: Candidate): ProfileCardData => {
  return {
    profile: candidate.profile,
    images: candidate.images,
    questionnaire: undefined // יש להוסיף לוגיקה לטעינת השאלון בנפרד
  };
};

/**
 * מפריד מועמדים לפי מגדר
 */
export const separateCandidatesByGender = (candidates: Candidate[]) => {
  return {
    maleCandidates: candidates.filter(c => c.profile.gender === 'MALE'),
    femaleCandidates: candidates.filter(c => c.profile.gender === 'FEMALE')
  };
};

/**
 * בודק האם הפרופיל מלא
 */
export const isProfileComplete = (profile: CandidateProfile): boolean => {
  const requiredFields: Array<keyof CandidateProfile> = [
    'birthDate',
    'city',
    'religiousLevel',
    'about',
    'occupation',
    'education'
  ];

  return requiredFields.every(field => Boolean(profile[field]));
};

const candidateUtils = {
  mapCandidateToProfileCard,
  separateCandidatesByGender,
  isProfileComplete
};

export default candidateUtils;