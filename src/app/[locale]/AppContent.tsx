// src/app/AppContent.tsx

'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'sonner';
import { ReactNode, useState, useEffect } from 'react';

type NavbarDict = {
  myMatches: string;
  matchmakingQuestionnaire: string;
  messages: string;
  login: string;
  register: string;
  toQuestionnaire: string;
};

type Dictionary = {
  navbar: NavbarDict;
};

interface AppContentProps {
  children: ReactNode;
  dict: Dictionary;
}

export default function AppContent({ children, dict }: AppContentProps) {
  const pathname = usePathname();
  const [isMainNavbarVisible, setIsMainNavbarVisible] = useState(true);

  // ✨ לוגיקה משוכתבת ומדויקת בתוך useEffect
  useEffect(() => {
    // בודקים אם אנחנו בדף הבית. הנתיבים יכולים להיות /he, /en, או פשוט /
    const locale = pathname.split('/')[1];
    const isHomePage =
      pathname === `/${locale}` || (pathname === '/' && !locale);

    // מקרה 1: אם אנחנו לא בדף הבית
    if (!isHomePage) {
      // קובעים שה-Navbar תמיד יהיה גלוי
      setIsMainNavbarVisible(true);
      // חשוב: אנחנו לא מוסיפים שום event listener, ולכן אין צורך בפונקציית ניקוי.
      // יוצאים מהאפקט כאן.
      return;
    }

    // מקרה 2: אם אנחנו כן בדף הבית - כאן נטפל בלוגיקת הגלילה
    const handleScroll = () => {
      // ה-Navbar יהיה גלוי רק בחלק העליון ביותר של הדף
      setIsMainNavbarVisible(window.scrollY <= 10);
    };

    // מוסיפים את ה-event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    // מפעילים פעם אחת בהתחלה כדי לקבוע מצב ראשוני נכון
    handleScroll();

    // ✨ פונקציית ניקוי קריטית ✨
    // פונקציה זו תרוץ אוטומטית כאשר ה-pathname משתנה (כלומר, כשמנווטים לעמוד אחר).
    // היא מסירה את ה-event listener ומבטיחה שהוא לא ישפיע על עמודים אחרים.
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]); // האפקט ירוץ מחדש בכל פעם שהנתיב משתנה

  // לוגיקה להסתרה ידנית של ה-Navbar (למשל, בשאלון)
  const isNavbarManuallyHidden = pathname.includes('/questionnaire');

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />

      {!isNavbarManuallyHidden && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
            isMainNavbarVisible
              ? 'opacity-100'
              : 'opacity-0 -translate-y-full pointer-events-none'
          }`}
        >
          <Navbar dict={dict.navbar} />
        </div>
      )}

      <main className="flex-grow">{children}</main>
    </div>
  );
}
