// src/app/[locale]/legal/accessibility-statement/page.tsx
import React from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import AccessibilityStatementClient from './AccessibilityStatementClient';

// Server Component
export default async function AccessibilityStatementPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <AccessibilityStatementClient
      dict={dictionary.auth.legal.accessibilityStatement}
      locale={locale}
    />
  );
}
