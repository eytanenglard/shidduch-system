// src/app/[locale]/layout.tsx

import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '@/components/Providers';
import { LanguageProvider } from '@/app/[locale]/contexts/LanguageContext';
import AppContent from './AppContent';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AccessibilityFeatures from '@/components/questionnaire/components/AccessibilityFeatures';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../i18n-config';
import FeedbackWidget from '@/components/layout/FeedbackWidget';
// ✨ 1. ייבוא ה-Provider החדש שיצרנו
import { QuestionnaireStateProvider } from '@/app/[locale]/contexts/QuestionnaireStateContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const dictionary = await getDictionary(locale);
  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    keywords: dictionary.metadata.keywords,
    openGraph: dictionary.metadata.openGraph,
    twitter: dictionary.metadata.twitter,
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dictionary = await getDictionary(params.locale);

  return (
    <html
      lang={params.locale}
      dir={params.locale === 'he' ? 'rtl' : 'ltr'}
      className={params.locale === 'he' ? 'dir-rtl' : 'dir-ltr'}
      suppressHydrationWarning
    >
      <head />
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <Providers>
          <LanguageProvider>
            {/* ✨ 2. עטיפת AppContent ב-Provider החדש */}
            {/* ה-Provider מקבל את המילון כדי להציג את המודאל בשפה הנכונה */}
            <QuestionnaireStateProvider dict={dictionary}>
              <FeedbackWidget dict={dictionary.feedbackWidget} />

              <AppContent dict={dictionary}>{children}</AppContent>
            </QuestionnaireStateProvider>
          </LanguageProvider>
          <AccessibilityFeatures
            dict={dictionary.questionnaire.accessibilityFeatures}
          />
        </Providers>
      </body>
    </html>
  );
}
