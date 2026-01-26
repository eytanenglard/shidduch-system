// candidates.ts
import { Gender, AvailabilityStatus, UserStatus, UserSource  } from '@prisma/client';
import type { UserProfile, UserImage, QuestionnaireResponse} from '@/types/next-auth';

// Base API Response Type
export interface APIResponse<T> {
  success: boolean;
  clients: T[];
  count: number;
  error?: string;
}
// 🆕 טיפוס לפירוט ציון AI
export interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}
// Base Types
export type CandidateImage = UserImage;

export type CandidateProfile = UserProfile;

export type MobileView = 'split' | 'single' | 'double';

export interface Candidate {
  id: string;
  email: string;
  phone?: string | null; 
  firstName: string;
  createdAt: Date;
  lastName: string;
  status: UserStatus;
  isVerified: boolean;
  images: CandidateImage[];
  isProfileComplete: boolean;
  source: UserSource; // Add new field
   language?: 'he' | 'en';
  addedByMatchmakerId?: string | null; // Add new field
  profile: CandidateProfile; // Ensure this uses the updated CandidateProfile
    suggestionStatus?: {
    status: 'BLOCKED' | 'PENDING';
    suggestionId: string;
    withCandidateName: string;
  } | null;
 aiScore?: number;
  aiReasoning?: string;
  aiRank?: number;
  aiFirstPassScore?: number;
  aiScoreBreakdown?: ScoreBreakdown;
  aiBackgroundMultiplier?: number;
  aiBackgroundCompatibility?: 'excellent' | 'good' | 'possible' | 'problematic' | 'not_recommended';
}
export interface CandidatesFilter {
   source?: UserSource;
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
  religiousLevel?: string[];
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
  
  // הוספת שדות חיפוש נפרדים
  maleSearchQuery?: string;
  femaleSearchQuery?: string;
  
  maleFilters?: Partial<CandidatesFilter>;
  femaleFilters?: Partial<CandidatesFilter>;
  userStatus?: UserStatus;
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