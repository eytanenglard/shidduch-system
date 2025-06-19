// src/app/components/OnboardingTrigger.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/app/contexts/OnboardingContext';
import type { User as SessionUserType } from '@/types/next-auth';

/**
 * רכיב זה אחראי על הלוגיקה של הפעלת הסיור הראשוני (Onboarding).
 * הוא אינו מרנדר שום דבר ויזואלי.
 * הוא צריך להיות ממוקם בתוך ה-OnboardingProvider ובתוך ה-SessionProvider.
 */
const OnboardingTrigger = () => {
  const { data: session, status: sessionStatus } = useSession();
  const { startTour, isTourActive } = useOnboarding();
  const [hasChecked, setHasChecked] = useState(false); // מונע בדיקות חוזרות ונשנות

  useEffect(() => {
    // בצע את הבדיקה רק פעם אחת לאחר שהסשן נטען במלואו
    if (sessionStatus === 'authenticated' && session?.user && !hasChecked && !isTourActive) {
      setHasChecked(true); // סמן שכבר בדקנו, כדי למנוע ריצה חוזרת

      const user = session.user as SessionUserType;
      
      console.log("[OnboardingTrigger] Checking user onboarding status:", {
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        isTourActive,
      });

      // התנאי להפעלת הסיור: המשתמש מחובר, והוא *לא* השלים את הסיור בעבר.
      if (user.hasCompletedOnboarding === false) {
        console.log("OnboardingTrigger: User has not completed onboarding. Starting tour...");
        
        // השהייה קצרה כדי לאפשר לממשק להיטען ולהיות יציב לפני שהסיור מתחיל
        const tourStartTimeout = setTimeout(() => {
          startTour();
        }, 1500); // 1.5 שניות השהייה

        return () => clearTimeout(tourStartTimeout); // ניקוי הטיימר אם הרכיב יורד מהמסך
      } else {
        console.log("OnboardingTrigger: User has already completed onboarding. No tour needed.");
      }
    } else if (sessionStatus === 'unauthenticated' && !hasChecked) {
      // אם המשתמש לא מחובר, אין צורך לבדוק שוב
      setHasChecked(true);
    }
  }, [session, sessionStatus, hasChecked, isTourActive, startTour]);

  // רכיב זה הוא לוגי בלבד ואינו מרנדר דבר
  return null; 
};

export default OnboardingTrigger;