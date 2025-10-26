// src/app/[locale]/auth/register/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import RegisterClient from './RegisterClient';

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
    </div>
  );
}

// ▼▼▼ כאן השינוי ▼▼▼
type RegisterPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <Suspense fallback={<Loading />}>
      <RegisterClient
        dict={dictionary.auth.register}
        locale={locale}
      />
    </Suspense>
  );
}