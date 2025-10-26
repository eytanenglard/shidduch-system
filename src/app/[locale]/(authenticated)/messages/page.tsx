// src/app/[locale]/(authenticated)/messages/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import MessagesClientPage from './MessagesClientPage';

// הגדרת ה-props הנכונה
type MessagesPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function MessagesPage({ params }: MessagesPageProps) {
  // שימוש ב-await כדי לחלץ את המידע מה-Promise
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return <MessagesClientPage dict={dictionary.messagesPage} locale={locale} />;
}