import { Suspense } from 'react';
import type { Locale } from '@/../i18n-config';
import SoulFingerprintPageClient from './SoulFingerprintPageClient';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function SoulFingerprintPage({ params }: Props) {
  const { locale } = await params;

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען את טביעת הנשמה..."
          subtext="מכינים את השאלות עבורך"
        />
      }
    >
      <SoulFingerprintPageClient locale={locale} />
    </Suspense>
  );
}
