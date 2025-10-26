import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import EngagementDashboard from '@/components/admin/EngagementDashboard';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import { authOptions } from '@/lib/auth';

// Define the expected props type for the page
type EngagementPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function EngagementPage({ params }: EngagementPageProps) {
  console.log('🎯 [Engagement Page] Page component loading...');

  // Await the params to get the locale
  const { locale } = await params;

  // 🎯 העבר את authOptions ל-getServerSession
  const session = await getServerSession(authOptions);

  console.log('🎯 [Engagement Page] Session:', {
    hasSession: !!session,
    role: session?.user?.role
  });

  if (session?.user?.role !== 'ADMIN') {
    console.log('❌ [Engagement Page] Not admin, redirecting...');
    redirect('/');
  }

  // טען את המילון
  const dict = await getDictionary(locale);

  console.log('✅ [Engagement Page] Rendering dashboard with dict...');
  return <EngagementDashboard dict={dict} />;
}