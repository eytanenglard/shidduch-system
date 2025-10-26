// src/app/[locale]/messages/page.tsx
import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../../../i18n-config';
import MessagesClientPage from './MessagesClientPage';

// ▼▼▼ CHANGE WAS MADE HERE ▼▼▼
export default async function MessagesPage({
  params,
}: {
  params: { locale: Locale };
}) {
  const { locale } = params; // Destructure locale inside the function
  const dictionary = await getDictionary(locale);

  // חילוץ החלק הרלוונטי מהמילון המלא והעברתו כ-prop
  return <MessagesClientPage dict={dictionary.messagesPage} locale={locale} />;
}