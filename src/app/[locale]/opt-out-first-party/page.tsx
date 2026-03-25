// src/app/[locale]/opt-out-first-party/page.tsx
import { Suspense } from 'react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../i18n-config';
import OptOutFirstPartyClient from './OptOutFirstPartyClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

function Loading() {
  return <StandardizedLoadingSpinner text="טוען..." />;
}

type OptOutFirstPartyPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function OptOutFirstPartyPage({
  params,
}: OptOutFirstPartyPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<Loading />}>
        <OptOutFirstPartyClient dict={dictionary.auth.optOutFirstPartyPage} />
      </Suspense>
    </div>
  );
}
