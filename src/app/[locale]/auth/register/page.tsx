// src/app/[locale]/auth/register/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import RegisterClient from './RegisterClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

// עדכון רכיב הטעינה
function Loading() {
  return <StandardizedLoadingSpinner />;
}

type RegisterPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense fallback={<Loading />}>
      <RegisterClient
        dict={dictionary.auth.register}
        locale={locale}
      />
    </Suspense>
  );
}