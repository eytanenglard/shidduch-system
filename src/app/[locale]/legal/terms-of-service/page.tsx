// src/app/[locale]/legal/terms-of-service/page.tsx
import React from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import TermsOfServiceClient from './TermsOfServiceClient';

// Server Component
export default async function TermsOfServicePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <TermsOfServiceClient
      dict={dictionary.auth.legal.termsOfService}
      locale={locale}
    />
  );
}
