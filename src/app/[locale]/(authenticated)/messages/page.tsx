// src/app/[locale]/messages/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import MessagesClientPage from './MessagesClientPage';

export default async function MessagesPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(locale);

  // חילוץ החלק הרלוונטי מהמילון המלא והעברתו כ-prop
  return <MessagesClientPage dict={dictionary.messagesPage} locale={locale} />;
}
