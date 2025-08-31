// src/app/[locale]/auth/verify-phone/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import VerifyPhoneClient from './VerifyPhoneClient';

export default async function VerifyPhonePage({
  params: { locale }, // Next.js מספק את 'locale' מה-URL כאן
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <VerifyPhoneClient
      dict={dictionary.auth.verifyPhone}
      locale={locale} // <<< כאן אנחנו מעבירים את השפה כ-prop לרכיב הלקוח
    />
  );
}
