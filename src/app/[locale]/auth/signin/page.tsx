// src/app/[locale]/auth/signin/page.tsx

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import SignInClient from './SignInClient';

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
    </div>
  );
}

export default async function SignInPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
      <Suspense fallback={<Loading />}>
        {/* הוספנו את locale={locale} כ-prop */}
        <SignInClient dict={dictionary.auth.signIn} locale={locale} />
      </Suspense>
    </div>
  );
}
