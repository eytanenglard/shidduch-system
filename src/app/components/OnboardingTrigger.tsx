// src/app/components/OnboardingTrigger.tsx
"use client";

import { useEffect } from 'react';
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

  useEffect(() => {
    // בצע את הבדיקה רק אם הסשן טעון והסיור לא כבר פעיל.
    if (sessionStatus === 'authenticated' && session?.user && !isTourActive) {
      const user = session.user as SessionUserType;

      // התנאי להפעלת הסיור: המשתמש מחובר, והוא *לא* השלים את הסיור בעבר.
      if (user.hasCompletedOnboarding === false) {
        console.log("OnboardingTrigger: User needs onboarding. Starting tour.");
        startTour(); // פשוט מפעילים את הסיור. הקומפוננטה של הסיור תדאג להמתנה לאלמנטים.
      }
    }
  }, [session, sessionStatus, isTourActive, startTour]);

  // רכיב זה הוא לוגי בלבד ואינו מרנדר דבר
  return null;
};

export default OnboardingTrigger;