import { UserProfile } from '@/types/next-auth';
import { PreferencesSectionDict } from '@/types/dictionary';

export interface PreferenceCardProps {
  profile: UserProfile | null;
  isEditing: boolean;
  viewOnly?: boolean;
  formData: Partial<UserProfile>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: keyof UserProfile, value: string) => void;
  handleMultiSelectChange: (field: keyof UserProfile, value: string) => void;
  handleAddItemToArray: (field: keyof UserProfile, value: string) => void;
  handleRemoveItemFromArray: (field: keyof UserProfile, value: string) => void;
  t: PreferencesSectionDict;
  locale: string;
  direction: 'rtl' | 'ltr';
}
