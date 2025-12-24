// src/app/[locale]/AppContent.tsx

'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'sonner';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/types/dictionary';
// רכיב הסנכרון החדש - דואג לשמור תשובות שאלון של אורחים לאחר הרשמה
import QuestionnaireSyncer from '@/components/questionnaire/common/QuestionnaireSyncer';

interface AppContentProps {
  children: ReactNode;
  dict: Dictionary;
}

export default function AppContent({ children, dict }: AppContentProps) {
  const pathname = usePathname();
  const [isMainNavbarVisible, setIsMainNavbarVisible] = useState(true);

  useEffect(() => {
    // חילוץ ה-locale מה-path (למשל /he/...)
    const locale = pathname?.split('/')[1];
    const isHomePage =
      pathname === `/${locale}` || (pathname === '/' && !locale);

    // בדף הבית אנחנו רוצים לוגיקה ספציפית או תצוגה קבועה בהתחלה
    if (!isHomePage) {
      setIsMainNavbarVisible(true);
      return;
    }

    const handleScroll = () => {
      // דוגמה ללוגיקה: ה-Navbar נעלם בגלילה למטה (אלא אם כן תרצה לשנות זאת)
      // כרגע הקוד המקורי שלך הראה אותו רק ב-top (scrollY <= 10)
      setIsMainNavbarVisible(window.scrollY <= 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // בדיקה ראשונית

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // לוגיקה להסתרה ידנית של ה-Navbar (כרגע מוגדרת שתמיד תוצג)
  const isNavbarManuallyHidden = false;

  // משתנה עזר שקובע אם צריך להוסיף את הריפוד העליון (כדי שהתוכן לא יוסתר ע"י ה-Navbar הקבוע)
  const shouldApplyNavbarPadding = !isNavbarManuallyHidden;

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />

      {/* 
        רכיב הסנכרון:
        רץ ברקע, בודק אם יש LocalStorage עם תשובות ואם המשתמש מחובר.
        אם כן - שולח לשרת ומוחק מה-LocalStorage כדי למנוע אובדן מידע.
      */}
      <QuestionnaireSyncer />

      {/* ה-Navbar עם position: fixed */}
      {!isNavbarManuallyHidden && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
            isMainNavbarVisible
              ? 'opacity-100'
              : 'opacity-0 -translate-y-full pointer-events-none'
          }`}
        >
          <Navbar dict={dict} />
        </div>
      )}

      {/* 
        תוכן העמוד הראשי (Main):
        אנו מוסיפים ריפוד עליון (padding-top) בגובה ה-Navbar (h-20 = 80px = 5rem)
        רק כאשר ה-Navbar מוצג, כדי למנוע הסתרה של התוכן העליון.
      */}
      <main className={cn('flex-grow', shouldApplyNavbarPadding && 'pt-20')}>
        {children}
      </main>
    </div>
  );
}
