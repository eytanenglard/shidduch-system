// src/components/profile/types/profileCard.ts

import type React from 'react';
import type {
  UserProfile,
  UserImage as UserImageType,
  QuestionnaireResponse,
} from '@/types/next-auth';
import type { Candidate } from '@/components/matchmaker/new/types/candidates';
import type { ProfileCardDict } from '@/types/dictionary';

export interface CreateSuggestionData {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  firstPartyId: string;
  secondPartyId: string;
  status:
    | 'DRAFT'
    | 'PENDING_FIRST_PARTY'
    | 'FIRST_PARTY_APPROVED'
    | 'FIRST_PARTY_DECLINED'
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
}

export interface ExcitementFactor {
  icon: React.ElementType;
  text: string;
  gradient: string;
  shortText?: string;
}

export interface ProfileCardProps {
  profile: Omit<UserProfile, 'isProfileComplete'>;
  isProfileComplete: boolean;
  images?: UserImageType[];
  questionnaire?: QuestionnaireResponse | null;
  viewMode?: 'matchmaker' | 'candidate';
  className?: string;
  candidate?: Candidate;
  allCandidates?: Candidate[];
  onCreateSuggestion?: (data: CreateSuggestionData) => Promise<void>;
  onClose?: () => void;
  dict: ProfileCardDict;
  locale: string;
}

export interface EnumMapEntry {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
}

export type EnumMap = Record<string, EnumMapEntry>;
