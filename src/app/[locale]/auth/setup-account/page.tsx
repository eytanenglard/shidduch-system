// src/app/[locale]/auth/setup-account/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SetupAccountClient from './SetupAccountClient';

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
    </div>
  );
}

// ▼▼▼ כאן השינוי ▼▼▼
type SetupAccountPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function SetupAccountPage({ params }: SetupAccountPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Suspense fallback={<Loading />}>
        <SetupAccountClient dict={dictionary.auth.setupAccount} />
      </Suspense>
    </div>
  );
}