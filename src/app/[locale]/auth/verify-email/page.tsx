// src/app/[locale]/auth/verify-email/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import VerifyEmailClient from './VerifyEmailClient';

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
    </div>
  );
}

export default async function VerifyEmailPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Suspense fallback={<Loading />}>
        <VerifyEmailClient dict={dictionary.auth.verifyEmail} />
      </Suspense>
    </div>
  );
}
