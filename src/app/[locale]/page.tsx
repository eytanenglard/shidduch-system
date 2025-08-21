// src/app/[locale]/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../i18n-config';
import HomePage from '@/components/HomePage/HomePage';
import { generateDemoData } from '@/components/HomePage/components/demo-data';


export default async function Home({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // Promise.all טוען את המילון ואת נתוני הדמו במקביל לביצועים מיטביים.
  const [dictionary, demoData] = await Promise.all([
    getDictionary(locale),
    generateDemoData(locale),
  ]);

  // מעבירים את שני האובייקטים כ-props לרכיב הלקוח.
  return <HomePage dict={dictionary} demoData={demoData} />;
}