// src/app/[locale]/legal/child-safety/page.tsx
import React, { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '@/../i18n-config';
import ChildSafetyClient from './ChildSafetyClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type ChildSafetyPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ChildSafetyPage({
  params,
}: ChildSafetyPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense
      fallback={<StandardizedLoadingSpinner text="טוען תקני בטיחות..." />}
    >
      <ChildSafetyClient
        dict={dictionary.auth.legal.childSafety}
        locale={locale}
      />
    </Suspense>
  );
}