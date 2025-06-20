"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/app/contexts/OnboardingContext';

/**
 * רכיב זה אחראי להחליט מתי להתחיל את סיור ההיכרות (Onboarding Tour).
 * הוא פועל ברקע ובודק את התנאים הבאים:
 * 1. האם המשתמש מחובר (authenticated)?
 * 2. האם המשתמש כבר השלים את הפרופיל הראשוני שלו? (isProfileComplete === true)
 * 3. האם המשתמש עדיין לא עשה את סיור ההיכרות? (hasCompletedOnboarding === false)
 *
 * רק אם כל התנאים מתקיימים, הסיור יופעל.
 * כדי למנוע הפעלה חוזרת ונשנית, הוא יופעל רק פעם אחת בכל טעינת סשן.
 */
const OnboardingTrigger = () => {
  const { data: session, status } = useSession();
  const { startTour, isTourActive } = useOnboarding();
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    // בדוק אם יש צורך להפעיל את הסיור
    if (
      status === 'authenticated' &&      // 1. המשתמש מחובר
      session?.user &&                   // ודא שאובייקט המשתמש קיים
      !isTourActive &&                   // 2. הסיור אינו פעיל כרגע
      !hasTriggered &&                   // 3. הסיור לא הופעל כבר בטעינה זו
      session.user.isProfileComplete &&  // 4. המשתמש השלים את הפרופיל (התנאי החדש והחשוב!)
      !session.user.hasCompletedOnboarding // 5. המשתמש עדיין לא השלים את הסיור
    ) {
      console.log("OnboardingTrigger: Conditions met. Starting tour.");
      
      // המתן שנייה קטנה כדי לתת לדף להיטען באופן מלא לפני הצגת הסיור
      const timer = setTimeout(() => {
        startTour();
        setHasTriggered(true); // סמן שהסיור הופעל כדי למנוע הפעלות חוזרות
      }, 1000); // דיליי של שנייה אחת (1000ms)

      return () => clearTimeout(timer); // נקה את הטיימר אם הרכיב יורד מהמסך
    } else {
        if (status === 'authenticated' && session?.user) {
            // הדפסה לדיבאג כדי להבין למה הסיור לא מתחיל
            console.log("OnboardingTrigger: Conditions not met.", {
                isAuthenticated: status === 'authenticated',
                isTourActive,
                hasTriggered,
                isProfileComplete: session.user.isProfileComplete,
                hasCompletedOnboarding: session.user.hasCompletedOnboarding,
            });
        }
    }
  }, [session, status, startTour, isTourActive, hasTriggered]);

  // רכיב זה אינו מרנדר שום דבר למסך, הוא רק מפעיל לוגיקה
  return null;
};

export default OnboardingTrigger;