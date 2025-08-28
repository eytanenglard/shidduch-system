// src/app/[locale]/legal/privacy-policy/page.tsx
import React from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import PrivacyPolicyClient from './PrivacyPolicyClient';

// Server Component
export default async function PrivacyPolicyPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <PrivacyPolicyClient
      dict={dictionary.auth.legal.privacyPolicy}
      locale={locale}
    />
  );
}
