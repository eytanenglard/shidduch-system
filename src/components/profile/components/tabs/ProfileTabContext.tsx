'use client';

import { createContext, useContext } from 'react';
import type { FormattedAnswer, UserProfile } from '@/types/next-auth';
import type {
  ProfileCardDict,
  ProfileCardDisplayDict,
  BudgetDisplayDict,
} from '@/types/dictionary';
import type { ThemeType } from '../../constants/theme';
import type { EnumMap } from '../../types/profileCard';

interface WorldConfig {
  label: string;
  icon: React.ElementType;
  color: string;
}

interface TabItem {
  value: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  hasContent: boolean;
}

export interface TabContentData {
  hookAnswer: FormattedAnswer | undefined;
  deeperAnswers: FormattedAnswer[];
}

export interface ProfileTabContextType {
  // Layout & navigation
  isDesktop: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabItems: TabItem[];
  direction: 'ltr' | 'rtl';
  locale: string;
  effectiveViewMode: 'matchmaker' | 'candidate';
  isOwnProfile: boolean;
  mobileViewLayout: 'focus' | 'detailed';

  // Data
  profile: UserProfile;
  THEME: ThemeType;
  WORLDS: Record<string, WorldConfig>;

  // Dictionaries
  displayDict: ProfileCardDisplayDict;
  dict: ProfileCardDict;

  // Computed questionnaire content
  personalityContent: TabContentData;
  valuesContent: TabContentData;
  religionContent: TabContentData;
  relationshipContent: TabContentData;
  partnerContent: TabContentData;

  // Soul Fingerprint (Heart Map) answers
  sfAnswers: Record<string, unknown> | null;

  // Boolean flags
  hasAnyPreferences: boolean;
  hasEducationAndCareerDetails: boolean;
  hasFamilyBackgroundDetails: boolean;
  hasJudaismConnectionDetails: boolean;

  // Enum maps
  characterTraitMap: EnumMap;
  hobbiesMap: EnumMap;
  educationLevelMap: EnumMap;
  serviceTypeMap: EnumMap;
  religiousLevelMap: EnumMap;
  religiousJourneyMap: EnumMap;
  headCoveringMap: EnumMap;
  kippahTypeMap: EnumMap;
  contactPreferenceMap: EnumMap;
  maritalStatusMap: EnumMap;

  // Shared helpers
  renderMobileNav: () => React.ReactNode;
  SectionDivider: React.FC;
}

export const ProfileTabContext = createContext<ProfileTabContextType | null>(null);

export function useProfileTab(): ProfileTabContextType {
  const ctx = useContext(ProfileTabContext);
  if (!ctx) {
    throw new Error(
      'useProfileTab must be used within a <ProfileTabContext.Provider>. ' +
      'Wrap your tab component inside MainContentTabs.'
    );
  }
  return ctx;
}
