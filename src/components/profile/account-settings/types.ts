// src/components/profile/account-settings/types.ts

import { UserRole, UserStatus, Language } from '@prisma/client';
import type { AccountSettingsDict } from '@/types/dictionary';
import type { Locale } from '../../../../i18n-config';

export interface ConnectedAccount {
  provider: string;
  providerAccountId?: string;
}

export interface AccountSettingsUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  engagementEmailsConsent?: boolean;
  promotionalEmailsConsent?: boolean;
  language?: Language;
  wantsToBeFirstParty?: boolean;
  image?: string | null;
  accounts?: ConnectedAccount[];
}

export interface AccountSettingsBaseProps {
  user: AccountSettingsUser;
  dict: AccountSettingsDict;
  locale: Locale;
}

export interface AccountSettingsWithSessionProps extends AccountSettingsBaseProps {
  onSessionUpdate: () => Promise<void>;
}
