// src/app/[locale]/page.tsx

import { getDictionary } from '@/lib/dictionaries';
import type { Locale } from '../../../i18n-config';
import HomePage from '@/components/HomePage/HomePage';
import { generateDemoData } from '@/components/HomePage/components/demo-data';

// ✅ Next.js 15: params is a Promise with string type (not union)
type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home(props: HomePageProps) {
  const params = await props.params;
  const locale = params.locale as Locale;

  // שאר הקוד נשאר זהה
  const [dictionary, demoData] = await Promise.all([
    getDictionary(locale),
    generateDemoData(locale),
  ]);

  return <HomePage dict={dictionary} demoData={demoData} locale={locale} />;
}