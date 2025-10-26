// src/app/[locale]/legal/terms-of-service/page.tsx
import React from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import TermsOfServiceClient from './TermsOfServiceClient';

// ▼▼▼ כאן השינוי ▼▼▼
type TermsOfServicePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function TermsOfServicePage({ params }: TermsOfServicePageProps) {
  const { locale } = await params; // הוספת await
  const dictionary = await getDictionary(locale);

  return (
    <TermsOfServiceClient
      dict={dictionary.auth.legal.termsOfService}
      locale={locale}
    />
  );
}