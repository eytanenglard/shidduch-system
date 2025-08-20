// src/app/[locale]/page.tsx

import { getDictionary } from '@/lib/dictionaries';
// ✅ תיקון נתיב הייבוא - מוביל לשורש הפרויקט
import type { Locale } from '@/i18n-config'; 
import HomePage from '@/components/HomePage/HomePage';
import { generateDemoData } from '@/components/HomePage/components/demo-data';

export default async function Home({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const [dictionary, demoData] = await Promise.all([
    getDictionary(locale),
    generateDemoData(locale),
  ]);

  return <HomePage dict={dictionary} demoData={demoData} />;
}