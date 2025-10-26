// src/app/[locale]/auth/verify-phone/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import VerifyPhoneClient from './VerifyPhoneClient';

// ▼▼▼ כאן השינוי ▼▼▼
type VerifyPhonePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function VerifyPhonePage({ params }: VerifyPhonePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <VerifyPhoneClient
      dict={dictionary.auth.verifyPhone}
      locale={locale}
    />
  );
}