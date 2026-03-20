import { Suspense } from 'react';
import type { Locale } from '@/../i18n-config';
import SoulFingerprintPageClient from './SoulFingerprintPageClient';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function SoulFingerprintPage({ params }: Props) {
  const { locale } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      }
    >
      <SoulFingerprintPageClient locale={locale} />
    </Suspense>
  );
}
