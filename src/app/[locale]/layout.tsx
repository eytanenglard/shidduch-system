// src/app/[locale]/layout.tsx

import { Assistant, Heebo, Rubik, Frank_Ruhl_Libre } from 'next/font/google';
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

// --- הגדרת ארסנל הפונטים לבדיקה ---

// 1. Assistant: ברירת המחדל. נקי, קריא, מאוזן.
const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});

// 2. Heebo: טכנולוגי, חד, גיאומטרי. משדר "הייטק" ודיוק.
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

// 3. Rubik: עגול, חמים, נגיש. משדר "אנושיות" ורוך.
const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  variable: '--font-rubik',
  display: 'swap',
});

// 4. Frank Ruhl Libre: סריף, קלאסי, ספרותי. משדר "מסורת" ורצינות.
const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  variable: '--font-frank',
  display: 'swap',
});

// ✅ Next.js 15: params is a Promise with string type
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
  
  // טעינת המילון המתאים לשפה
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
        // אנחנו מזריקים את כל המשתנים של הפונטים ל-body.
        // זה לא מכביד על האתר, אבל מאפשר לנו לבחור ב-CSS באיזה מהם להשתמש.
        className={`
          ${assistant.variable} 
          ${heebo.variable} 
          ${rubik.variable} 
          ${frankRuhl.variable} 
          antialiased font-sans
        `}
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