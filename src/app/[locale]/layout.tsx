// src/app/[locale]/layout.tsx

import { Rubik } from 'next/font/google'; // הפונט החם והנעים
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

// הגדרת פונט Rubik - עגול, אנושי, נגיש וחם
const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  variable: '--font-rubik', // שם המשתנה
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'], // מגוון משקלים לעיצוב עשיר
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
        // שימוש במשתנה של רוביק
        className={`${rubik.variable} antialiased font-sans`}
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