// src/app/[locale]/auth/verify-phone/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import VerifyPhoneClient from './VerifyPhoneClient';

export default async function VerifyPhonePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return <VerifyPhoneClient dict={dictionary.auth.verifyPhone} />;
}
