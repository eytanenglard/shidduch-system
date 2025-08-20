// src/app/AppContent.tsx

'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'sonner';
import { ReactNode, useState, useEffect } from 'react'; // ✨ 1. ייבוא Hooks

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
  
  // ✨ 2. הוספת state לניהול נראות ה-Navbar הגלובלי
  const [isMainNavbarVisible, setIsMainNavbarVisible] = useState(true);

  // בודקים אם אנחנו בדף הבית. הנתיבים יהיו /he, /en, או פשוט /
  const locale = pathname.split('/')[1];
  const isHomePage = pathname === `/${locale}` || pathname === '/';

  // ✨ 3. הוספת useEffect לניהול נראות ה-Navbar בגלילה
  useEffect(() => {
    const handleScroll = () => {
      // אם אנחנו לא בדף הבית, ה-Navbar תמיד גלוי
      if (!isHomePage) {
        setIsMainNavbarVisible(true);
        return;
      }
      // אם אנחנו כן בדף הבית, ה-Navbar נעלם אחרי גלילה קטנה
      setIsMainNavbarVisible(window.scrollY <= 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // הפעלה ראשונית כדי לקבוע את המצב ההתחלתי
    handleScroll(); 

    // ניקוי ה-event listener כשהרכיב יורד
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, isHomePage]); // המערך הזה יגרום לאפקט לרוץ מחדש אם הנתיב משתנה

  // לוגיקה ישנה להסתרת ה-Navbar (למשל, בשאלון)
  const isNavbarManuallyHidden = pathname.includes('/questionnaire');

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />
      
      {/* ✨ 4. עטיפת ה-Navbar ב-div שמנהל את האנימציה */}
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