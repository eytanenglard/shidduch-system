// src/app/[locale]/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../i18n-config';
import HomePage from '@/components/HomePage/HomePage';
import { generateDemoData } from '@/components/HomePage/components/demo-data';

// ▼▼▼ כאן השינוי ▼▼▼
type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params; // <-- הוספת await

  // שאר הקוד נשאר זהה
  const [dictionary, demoData] = await Promise.all([
    getDictionary(locale),
    generateDemoData(locale),
  ]);

  return <HomePage dict={dictionary} demoData={demoData} locale={locale} />;
}