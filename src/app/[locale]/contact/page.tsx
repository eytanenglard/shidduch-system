// src/app/[locale]/contact/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../i18n-config';
import ContactClient from './ContactClient';

// ▼▼▼ כאן השינוי ▼▼▼
type ContactPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params; // הוספת await
  const dictionary = await getDictionary(locale);

  return <ContactClient dict={dictionary.contactPage} />;
}