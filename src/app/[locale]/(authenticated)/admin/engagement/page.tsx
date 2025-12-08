// src/app/[locale]/(authenticated)/admin/engagement/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import EngagementDashboard from '@/components/admin/EngagementDashboard';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import { authOptions } from '@/lib/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type EngagementPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function EngagementPage({ params }: EngagementPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    redirect('/');
  }

  const dict = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען נתוני מעורבות..."
          subtext="מנתחים את הפעילות במערכת"
        />
      }
    >
      <EngagementDashboard dict={dict} />
    </Suspense>
  );
}
