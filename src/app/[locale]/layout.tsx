// src/app/[locale]/layout.tsx

import { Heebo } from 'next/font/google'; // החלפה מפונט מקומי ל-Google Font
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

// הגדרת פונט Heebo - קל, נקי ומקצועי
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'], // כולל Light (300) לטקסט קל יותר
});

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

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  const params = await props.params;
  const locale = params.locale as Locale;
  
  const dictionary = await getDictionary(locale);
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
        // שימוש בפונט Heebo
        className={`${heebo.variable} antialiased font-sans`}
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