// src/app/[locale]/legal/accessibility-statement/page.tsx
import React from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import AccessibilityStatementClient from './AccessibilityStatementClient';

// ▼▼▼ כאן השינוי ▼▼▼
type AccessibilityStatementPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AccessibilityStatementPage({ params }: AccessibilityStatementPageProps) {
  const { locale } = await params; // הוספת await
  const dictionary = await getDictionary(locale);

  return (
    <AccessibilityStatementClient
      dict={dictionary.auth.legal.accessibilityStatement}
      locale={locale}
    />
  );
}