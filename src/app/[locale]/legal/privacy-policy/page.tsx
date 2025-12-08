// src/app/[locale]/legal/privacy-policy/page.tsx
import React, { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import PrivacyPolicyClient from './PrivacyPolicyClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type PrivacyPolicyPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PrivacyPolicyPage({
  params,
}: PrivacyPolicyPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={<StandardizedLoadingSpinner text="טוען מדיניות פרטיות..." />}
    >
      <PrivacyPolicyClient
        dict={dictionary.auth.legal.privacyPolicy}
        locale={locale}
      />
    </Suspense>
  );
}
