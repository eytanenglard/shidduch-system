import { Suspense } from 'react';
import type { Locale } from '@/../i18n-config';
import HeartMapStepClient from './HeartMapStepClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function HeartMapStepPage({ params }: Props) {
  const { locale } = await params;

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text={locale === 'he' ? 'טוען את מפת הנשמה...' : 'Loading your Soul Map...'}
          subtext={locale === 'he' ? 'מכינים את המסע עבורך' : 'Preparing your journey'}
        />
      }
    >
      <HeartMapStepClient locale={locale} />
    </Suspense>
  );
}
