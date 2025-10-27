// src/app/[locale]/layout.tsx

import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '@/components/Providers';
import AppContent from './AppContent';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AccessibilityFeatures from '@/components/questionnaire/components/AccessibilityFeatures';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../i18n-config';
import FeedbackWidget from '@/components/layout/FeedbackWidget';
import { QuestionnaireStateProvider } from '@/app/[locale]/contexts/QuestionnaireStateContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ✅ Next.js 15: params is a Promise with string type (not union)
type LayoutParams = Promise<{
  locale: string;
}>;

export async function generateMetadata(props: {
  params: LayoutParams;
}): Promise<Metadata> {
  const params = await props.params;
  const locale = params.locale as Locale;
  
  const dictionary = await getDictionary(locale);
  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    keywords: dictionary.metadata.keywords,
    openGraph: dictionary.metadata.openGraph,
    twitter: dictionary.metadata.twitter,
  };
}

// ✅ Next.js 15: params is a Promise with string type (not union)
export default async function RootLayout(props: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  const params = await props.params;
  const locale = params.locale as Locale;
  
  // טעינת המילון המתאים לשפה מה-URL
  const dictionary = await getDictionary(locale);

  // הגדרת כיווניות (direction) על סמך השפה
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={direction}
      className={direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}
      suppressHydrationWarning
    >
      <head />
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <Providers>
          <QuestionnaireStateProvider dict={dictionary}>
            <AppContent dict={dictionary}>
              <FeedbackWidget
                dict={dictionary.feedbackWidget}
                locale={locale}
              />
              {props.children}
            </AppContent>
          </QuestionnaireStateProvider>
          <AccessibilityFeatures
            dict={dictionary.questionnaire.accessibilityFeatures}
          />
        </Providers>
      </body>
    </html>
  );
}