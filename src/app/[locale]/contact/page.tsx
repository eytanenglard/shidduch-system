// src/app/[locale]/contact/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../i18n-config';
import ContactClient from './ContactClient'; // שם הקובץ שמכיל את רכיב הלקוח

export default async function ContactPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // קוראים למילון הראשי כרגיל
  const dictionary = await getDictionary(locale);

  // מעבירים את החלק הספציפי של עמוד יצירת הקשר
  return <ContactClient dict={dictionary.contactPage} />;
}
