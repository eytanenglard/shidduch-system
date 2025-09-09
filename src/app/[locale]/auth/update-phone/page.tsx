// src/app/[locale]/auth/update-phone/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import UpdatePhoneClient from './UpdatePhoneClient';

// רכיב זה נשאר פשוט כי הלוגיקה המורכבת נמצאת ברכיב הלקוח.
// אין צורך ב-Suspense כאן כי רכיב הלקוח עצמו מטפל במצב הטעינה של הסשן.
export default async function UpdatePhonePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  return (
    <UpdatePhoneClient dict={dictionary.auth.updatePhone} locale={locale} />
  );
}
