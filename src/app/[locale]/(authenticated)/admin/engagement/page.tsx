// בתוך page.tsx
   import { getServerSession } from 'next-auth';
   import { redirect } from 'next/navigation';
      import EngagementDashboard from '@/components/admin/EngagementDashboard';

   export default async function EngagementPage() {
     const session = await getServerSession();
     if (session?.user?.role !== 'ADMIN') {
       redirect('/');
     }
     
     return <EngagementDashboard />;
   }