'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// 1. הגדרת הטיפוסים עבור השפה והקונטקסט
type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 2. יצירת הקונטקסט עם ערך התחלתי undefined
// ריאקט יזרוק שגיאה רק אם ננסה להשתמש בקונטקסט מחוץ לספק שלו.
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// 3. יצירת Custom Hook לצריכה נוחה של הקונטקסט
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// 4. יצירת רכיב הספק (Provider) שיעטוף את האפליקציה
export function LanguageProvider({ children }: { children: ReactNode }) {
  // המצב ההתחלתי חייב להיות 'he' כדי להתאים לרינדור השרת ב-layout.tsx
  const [language, setLanguage] = useState<Language>('he');

  // מצב 'mounted' נועד לעקוב אם הרכיב סיים את הטעינה הראשונית בצד הלקוח
  const [mounted, setMounted] = useState(false);

  // useEffect ירוץ פעם אחת בלבד לאחר ההידרציה בצד הלקוח
  useEffect(() => {
    // קריאת השפה השמורה מה-localStorage
    const savedLanguage = localStorage.getItem('language') as Language;

    // בדיקה שהערך תקין לפני עדכון המצב
    if (savedLanguage && ['he', 'en'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // רק לאחר שקבענו את השפה הנכונה, נסמן שהרכיב "עלה" ומוכן להצגה
    setMounted(true);
  }, []); // המערך הריק [] מבטיח שהאפקט ירוץ פעם אחת בלבד

  // פונקציה לעדכון השפה, שגם שומרת את הבחירה ב-localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // --- לב הפתרון ---
  // כל עוד הרכיב לא "עלה" (כלומר, ה-useEffect עדיין לא קבע את השפה הסופית),
  // אנחנו לא מציגים את התוכן של האפליקציה.
  // זה מונע את ההצגה הראשונית עם הכיווניות הלא נכונה ואת ה"סלייד" שנוצר מהתיקון.
  if (!mounted) {
    return null; // אפשר להחזיר כאן רכיב טעינה (Spinner) לחוויה טובה יותר
  }

  // לאחר שהרכיב עלה והשפה נקבעה, נציג את האפליקציה עם הערכים הנכונים
  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
