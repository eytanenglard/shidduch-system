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
  };
}

// ✨ 1. הפונקציה הופכת להיות אסינכרונית (async)
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  // ✨ 2. טוענים את המילון המלא כאן, ברמת ה-Layout
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
            {/* ✨ 3. מעבירים את המילון כולו כ-prop לרכיב AppContent */}
            <AppContent dict={dictionary}>{children}</AppContent>
          </LanguageProvider>
          {/* ✨ 4. העברת המילון הרלוונטי לרכיב הנגישות */}
          <AccessibilityFeatures
            dict={dictionary.questionnaire.accessibilityFeatures}
          />
        </Providers>
      </body>
    </html>
  );
}
