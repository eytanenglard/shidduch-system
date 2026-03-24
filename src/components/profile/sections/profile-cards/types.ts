import { UserProfile } from '@/types/next-auth';
import { ProfileSectionDict } from '@/types/dictionary';

/** Fields that are auto-synced from the questionnaire (source of truth). */
export type QuestionnaireSyncedFields = {
  smokingStatus?: boolean;
  shomerNegiah?: boolean;
  profileCharacterTraits?: boolean;
  preferredCharacterTraits?: boolean;
  about?: boolean;
};

export interface ProfileCardProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  formData: Partial<UserProfile>;
  handleChange: (field: keyof UserProfile, value: any) => void;
  handleMultiSelectToggle: (field: keyof UserProfile, optionValue: string) => void;
  dict: ProfileSectionDict;
  locale: string;
  direction: 'rtl' | 'ltr';
  /** Indicates which fields are synced from the questionnaire */
  questionnaireSyncedFields?: QuestionnaireSyncedFields;
  /** Callback to navigate to the questionnaire tab for editing synced fields */
  onNavigateToQuestionnaire?: () => void;
}
