// src/app/[locale]/(authenticated)/admin/analytics/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import { authOptions } from '@/lib/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type AnalyticsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Only ADMIN and MATCHMAKER can view analytics
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'MATCHMAKER')) {
    redirect('/');
  }

  const dict = await getDictionary(locale);

  return (
    <Suspense
      fallback={
        <StandardizedLoadingSpinner
          text="טוען נתוני אנליטיקס..."
          subtext="מרכזים את הנתונים מהמערכת"
        />
      }
    >
      <AnalyticsDashboard dict={dict} />
    </Suspense>
  );
}