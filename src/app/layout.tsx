// src/app/layout.tsx (הקובץ המתוקן ללא CookieBanner)

import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { LanguageProvider } from '@/app/contexts/LanguageContext';
import AppContent from './AppContent';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const defaultLanguage = 'he';
const isRTL = defaultLanguage === 'he';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={defaultLanguage}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={isRTL ? 'dir-rtl' : 'dir-ltr'}
      suppressHydrationWarning
    >
      <head>
        <title>NeshamaTech - זוגיות שמתחילה מהנשמה</title>
        <meta
          name="description"
          content="NeshamaTech - משלבים טכנולוגיה עם לב..."
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <Providers>
          <LanguageProvider>
            <AppContent>{children}</AppContent>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
