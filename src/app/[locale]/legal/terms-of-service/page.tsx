// src/app/[locale]/legal/terms-of-service/page.tsx
import React, { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import TermsOfServiceClient from './TermsOfServiceClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type TermsOfServicePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function TermsOfServicePage({
  params,
}: TermsOfServicePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={<StandardizedLoadingSpinner text="טוען תנאי שימוש..." />}
    >
      <TermsOfServiceClient
        dict={dictionary.auth.legal.termsOfService}
        locale={locale}
      />
    </Suspense>
  );
}
