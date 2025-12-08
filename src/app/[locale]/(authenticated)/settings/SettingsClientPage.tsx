// src/app/[locale]/settings/SettingsClientPage.tsx

'use client';

import { useSession } from 'next-auth/react';
import AccountSettings from '@/components/profile/account-settings';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { AccountSettingsDict } from '@/types/dictionary';
import type { Locale } from '../../../../../i18n-config';

interface SettingsClientPageProps {
  dict: AccountSettingsDict;
  locale: Locale;
}

export default function SettingsClientPage({
  dict,
  locale,
}: SettingsClientPageProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <StandardizedLoadingSpinner
        text="טוען הגדרות חשבון..."
        className="min-h-[600px]"
      />
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        Access Denied. Please sign in to view your account settings.
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        Error: Could not load user data. The session might be invalid.
      </div>
    );
  }

  const userData = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    status: session.user.status,
    isVerified: session.user.isVerified,
    lastLogin: session.user.lastLogin ?? null,
    createdAt: session.user.createdAt,
    engagementEmailsConsent: session.user.engagementEmailsConsent,
    promotionalEmailsConsent: session.user.promotionalEmailsConsent,
  };

  return <AccountSettings user={userData} dict={dict} locale={locale} />;
}
