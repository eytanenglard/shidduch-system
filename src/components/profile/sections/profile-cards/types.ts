import { UserProfile } from '@/types/next-auth';
import { ProfileSectionDict } from '@/types/dictionary';

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
}
