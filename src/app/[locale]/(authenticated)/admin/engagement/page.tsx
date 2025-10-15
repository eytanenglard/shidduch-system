// src/app/[locale]/admin/engagement/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import EngagementDashboard from '@/components/admin/EngagementDashboard';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';

export default async function EngagementPage({ 
  params 
}: { 
  params: { locale: Locale } 
}) {
  console.log('🎯 [Engagement Page] Page component loading...');
  
  const session = await getServerSession();
  console.log('🎯 [Engagement Page] Session:', { 
    hasSession: !!session, 
    role: session?.user?.role 
  });
  
  if (session?.user?.role !== 'ADMIN') {
    console.log('❌ [Engagement Page] Not admin, redirecting...');
    redirect('/');
  }
  
  // 🎯 טען את המילון
  const dict = await getDictionary(params.locale);
  
  console.log('✅ [Engagement Page] Rendering dashboard with dict...');
  return <EngagementDashboard dict={dict} />;
}