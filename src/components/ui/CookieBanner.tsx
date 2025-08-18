// src/components/ui/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './button'; // ודא שהנתיב לקומפוננטת הכפתור נכון

const CookieBanner = () => {
  // State שמחזיק את ההחלטה של המשתמש (נלקח מהאחסון המקומי)
  const [consent, setConsent] = useState<string | null>(null);

  // בטעינה הראשונה, נבדוק אם יש החלטה שמורה ב-localStorage
  useEffect(() => {
    const storedConsent = localStorage.getItem('cookie_consent');
    setConsent(storedConsent);
  }, []);

  // פונקציה שמטפלת בלחיצה על "מסכים/ה"
  const handleAccept = () => {
    setConsent('true');
    localStorage.setItem('cookie_consent', 'true');
    // נפעיל מחדש את הטעינה כדי שהסקריפטים של אנליטיקס ייטענו
    window.location.reload(); 
  };

  // פונקציה שמטפלת בלחיצה על "מסרב/ת"
  const handleDecline = () => {
    setConsent('false');
    localStorage.setItem('cookie_consent', 'false');
  };

  // אם המשתמש כבר בחר (הסכים או סירב), אל תציג את הבאנר
  if (consent === 'true' || consent === 'false') {
    return null;
  }

  // אם אין החלטה שמורה, הצג את הבאנר
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm text-white p-4 z-[100] shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-200 text-center sm:text-right">
          אנו משתמשים ב"עוגיות" (Cookies), כולל אלו של Google Analytics, כדי לשפר את חווית הגלישה שלך ולנתח את תנועת הגולשים באתר. המידע נאסף באופן אנונימי. למידע נוסף, אנא עיין/י ב
          <Link href="/legal/privacy-policy" className="underline hover:text-cyan-300 mx-1">
            מדיניות הפרטיות
          </Link>
          שלנו.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button onClick={handleDecline} variant="outline" className="text-white border-slate-500 hover:bg-slate-700 hover:text-white">
            מסרב/ת
          </Button>
          <Button onClick={handleAccept} className="bg-cyan-500 hover:bg-cyan-600 text-white">
            מסכים/ה
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;