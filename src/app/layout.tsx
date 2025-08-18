// src/app/layout.tsx (הקובץ המתוקן)

import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { LanguageProvider } from '@/app/contexts/LanguageContext';
import AppContent from './AppContent'; // נייבא קומפוננטה חדשה
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import CookieBanner from '@/components/ui/CookieBanner'; // 1. ייבוא הקומפוננטה

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
        <CookieBanner /> {/* 2. הוספת הקומפוננטה כאן, בסוף ה-body */}
      </body>
    </html>
  );
}
