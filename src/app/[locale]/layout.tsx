// src/app/[locale]/layout.tsx

import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '@/components/Providers';
// 'LanguageProvider' הוסר מכיוון שהוא גרם לחוסר תאימות ברינדור
import AppContent from './AppContent';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AccessibilityFeatures from '@/components/questionnaire/components/AccessibilityFeatures';
import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../i18n-config';
import FeedbackWidget from '@/components/layout/FeedbackWidget';
import { QuestionnaireStateProvider } from '@/app/[locale]/contexts/QuestionnaireStateContext';

// הגדרת הפונט נשארת ללא שינוי
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// פונקציית יצירת המטא-דאטה נשארת ללא שינוי
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

// רכיב ה-Layout הראשי של האפליקציה
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  // טעינת המילון המתאים לשפה מה-URL. פעולה זו מתבצעת בשרת.
  const dictionary = await getDictionary(params.locale);

  // הגדרת כיווניות (direction) על סמך השפה
  const direction = params.locale === 'he' ? 'rtl' : 'ltr';

  return (
    // תגית ה-html מקבלת את השפה והכיווניות ישירות מה-URL.
    // זה מבטיח שה-HTML הראשוני שהשרת שולח תמיד יהיה נכון.
    <html
      lang={params.locale}
      dir={direction}
      className={direction === 'rtl' ? 'dir-rtl' : 'dir-ltr'}
      // מומלץ להשאיר אזהרה זו למקרה שיש תוספים שגורמים לבעיות הידרציה
      suppressHydrationWarning
    >
      <head />
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <GoogleAnalytics />
        <Providers>
          {/* 
            הסרנו את LanguageProvider. 
            כעת, אין יותר מצב גלובלי נפרד לשפה בצד הלקוח שמתנגש עם השרת.
            השפה נקבעת אך ורק על ידי ה-URL.
          */}
          <QuestionnaireStateProvider dict={dictionary}>
            <FeedbackWidget
              dict={dictionary.feedbackWidget}
              locale={params.locale}
            />

            {/* 
              אנו מעבירים את המילון וחשוב מכך, את השפה (locale),
              ישירות כ-props לרכיב AppContent. 
              רכיב זה יוכל להעביר אותם הלאה לרכיבים שתחתיו במידת הצורך.
            */}
            <AppContent dict={dictionary}>{children}</AppContent>
          </QuestionnaireStateProvider>

          <AccessibilityFeatures
            dict={dictionary.questionnaire.accessibilityFeatures}
          />
        </Providers>
      </body>
    </html>
  );
}
