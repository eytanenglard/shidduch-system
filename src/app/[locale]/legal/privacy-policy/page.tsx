// src/app/[locale]/legal/privacy-policy/page.tsx
import React from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import PrivacyPolicyClient from './PrivacyPolicyClient';

// ▼▼▼ כאן השינוי ▼▼▼
type PrivacyPolicyPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PrivacyPolicyPage({ params }: PrivacyPolicyPageProps) {
  const { locale } = await params; // הוספת await
  const dictionary = await getDictionary(locale);

  return (
    <PrivacyPolicyClient
      dict={dictionary.auth.legal.privacyPolicy}
      locale={locale}
    />
  );
}