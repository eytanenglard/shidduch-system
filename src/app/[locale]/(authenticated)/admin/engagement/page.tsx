import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import EngagementDashboard from '@/components/admin/EngagementDashboard';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../../i18n-config';
import { authOptions } from '@/lib/auth';

export default async function EngagementPage({ 
  params 
}: { 
  params: { locale: Locale } 
}) {
  console.log('🎯 [Engagement Page] Page component loading...');
  
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
  const dict = await getDictionary(params.locale);
  
  console.log('✅ [Engagement Page] Rendering dashboard with dict...');
  return <EngagementDashboard dict={dict} />;
}
