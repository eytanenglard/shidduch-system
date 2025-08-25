// src/app/AppContent.tsx

'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'sonner';
import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils'; // ודא שהייבוא הזה קיים

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

  useEffect(() => {
    const locale = pathname.split('/')[1];
    const isHomePage =
      pathname === `/${locale}` || (pathname === '/' && !locale);

    if (!isHomePage) {
      setIsMainNavbarVisible(true);
      return;
    }

    const handleScroll = () => {
      setIsMainNavbarVisible(window.scrollY <= 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // לוגיקה להסתרה ידנית של ה-Navbar (למשל, בשאלון)
  const isNavbarManuallyHidden = pathname.includes('/questionnaire');

  // משתנה עזר שקובע אם צריך להוסיף את הריפוד העליון
  const shouldApplyNavbarPadding = !isNavbarManuallyHidden;

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" richColors />

      {/* ה-Navbar נשאר עם position: fixed כפי שהיה */}
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
        --- התיקון המרכזי כאן ---
        אנו מוסיפים לאלמנט ה-<main> ריפוד עליון (padding-top) בגובה של ה-Navbar (שהוא h-20, כלומר 5rem או 80px).
        הריפוד מתווסף באופן מותנה רק כאשר ה-Navbar באמת מוצג, כדי למנוע רווח מיותר בעמודים שבהם הוא מוסתר.
      */}
      <main
        className={cn(
          'flex-grow',
          shouldApplyNavbarPadding && 'pt-20' // pt-20 = padding-top: 5rem (80px)
        )}
      >
        {children}
      </main>
    </div>
  );
}
