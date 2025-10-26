// src/app/[locale]/auth/update-phone/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import UpdatePhoneClient from './UpdatePhoneClient';

// ▼▼▼ כאן השינוי ▼▼▼
type UpdatePhonePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function UpdatePhonePage({ params }: UpdatePhonePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <UpdatePhoneClient dict={dictionary.auth.updatePhone} locale={locale} />
  );
}