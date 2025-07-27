// src/app/components/auth/RegisterSteps.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RegistrationProvider, useRegistration } from './RegistrationContext'; // ודא ש-RegistrationData מיובא
import WelcomeStep from './steps/WelcomeStep';
import BasicInfoStep from './steps/BasicInfoStep';
import EmailVerificationCodeStep from './steps/EmailVerificationCodeStep';
import PersonalDetailsStep from './steps/PersonalDetailsStep';
import OptionalInfoStep from './steps/OptionalInfoStep';
import CompleteStep from './steps/CompleteStep';
import ProgressBar from './ProgressBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Info, Loader2 } from 'lucide-react';
import type { User as SessionUserType } from '@/types/next-auth';

const RegisterStepsContent: React.FC = () => {
  const {
    data: registrationContextData,
    initializeFromSession,
    resetForm,
    goToStep,
  } = useRegistration();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // הדפסה ראשונית של מצב הקומפוננטה בעת טעינה/עדכון
  console.log('[RegisterStepsContent RENDER] Initial State Check:', {
    sessionStatus,
    sessionUserExists: !!session?.user,
    registrationContextData_step: registrationContextData.step,
    registrationContextData_isCompletingProfile:
      registrationContextData.isCompletingProfile,
    registrationContextData_isVerifyingEmailCode:
      registrationContextData.isVerifyingEmailCode,
    initializationAttempted,
    searchParams: searchParams.toString(),
  });

  useEffect(() => {
    const reasonParam = searchParams.get('reason');
    if (
      reasonParam === 'complete_profile' &&
      !registrationContextData.isCompletingProfile
    ) {
      setShowIncompleteProfileMessage(true);
    } else if (
      reasonParam === 'verify_phone' &&
      !registrationContextData.isCompletingProfile
    ) {
      setShowIncompleteProfileMessage(true);
    } else {
      setShowIncompleteProfileMessage(false);
    }
  }, [searchParams, registrationContextData.isCompletingProfile]);

  useEffect(() => {
    console.log('[RegisterStepsContent useEffect Trigger] Current State:', {
      sessionStatus,
      sessionUserExists: !!session?.user,
      contextStep: registrationContextData.step,
      contextIsCompletingProfile: registrationContextData.isCompletingProfile,
      contextIsVerifyingEmailCode: registrationContextData.isVerifyingEmailCode,
      initializationAttempted,
    });

    if (sessionStatus === 'loading') {
      console.log(
        '[RegisterStepsContent useEffect] Session loading, returning.'
      );
      return;
    }

    if (sessionStatus === 'authenticated' && session?.user) {
      const user = session.user as SessionUserType;
      console.log(
        '[RegisterStepsContent useEffect] AUTHENTICATED. User data from session:',
        user
      );

      if (
        user.isProfileComplete &&
        user.isPhoneVerified &&
        user.termsAndPrivacyAcceptedAt
      ) {
        console.log(
          '[RegisterStepsContent useEffect] User fully set up. Redirecting to /profile.'
        );
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/profile'
        ) {
          router.push('/profile');
        }
        return;
      }

      const needsSetup =
        !user.termsAndPrivacyAcceptedAt ||
        !user.isProfileComplete ||
        !user.isPhoneVerified;
      console.log(
        '[RegisterStepsContent useEffect] User needsSetup:',
        needsSetup
      );

      if (needsSetup) {
        if (
          !initializationAttempted ||
          (registrationContextData.step === 0 &&
            !registrationContextData.isVerifyingEmailCode)
        ) {
          console.log(
            '[RegisterStepsContent useEffect] AUTHENTICATED & needs setup. Initializing context from session.'
          );
          initializeFromSession(user);
          setInitializationAttempted(true);
          // הפונקציה initializeFromSession תגרום לעדכון הקונטקסט, מה שיפעיל מחדש את ה-useEffect.
          // הלוגיקה תמשיך משם עם הקונטקסט המעודכן.
          return;
        } else {
          console.log(
            '[RegisterStepsContent useEffect] AUTHENTICATED & needs setup, but initialization already attempted or context not in initial state. Context should be guiding the flow now.'
          );
        }
      } else {
        console.warn(
          '[RegisterStepsContent useEffect] AUTHENTICATED & fully setup, but somehow not redirected yet. Forcing redirect to /profile.'
        );
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/profile'
        ) {
          router.push('/profile');
        }
        return;
      }
    } else if (sessionStatus === 'unauthenticated') {
      console.log(
        '[RegisterStepsContent useEffect] UNAUTHENTICATED. Context state:',
        {
          step: registrationContextData.step,
          isCompletingProfile: registrationContextData.isCompletingProfile,
          isVerifyingEmailCode: registrationContextData.isVerifyingEmailCode,
        }
      );
      setInitializationAttempted(false); // אפס ניסיון אתחול עבור התחברות עתידית
      let shouldReset = false;
      let resetReason = '';

      // קריטי: בדוק אם אנחנו במצב שבו אנו *מצפים* שהאימות יתרחש בקרוב.
      // זה נכון אם הרגע סיימנו אימות מייל והקונטקסט משקף זאת.
      const justFinishedEmailVerificationAndContextIsReadyForProfileCompletion =
        registrationContextData.isCompletingProfile && // הקונטקסט עבר למצב השלמת פרופיל
        registrationContextData.step === 2 && // השלב הבא הוא פרטים אישיים
        !registrationContextData.isVerifyingEmailCode; // לא בתהליך אימות קוד מייל

      if (justFinishedEmailVerificationAndContextIsReadyForProfileCompletion) {
        console.log(
          "[RegisterStepsContent useEffect] UNAUTHENTICATED, but context suggests email verification just completed and set for profile completion. Holding off on reset, expecting session to become 'authenticated' soon."
        );
        shouldReset = false; // אל תאפס, חכה שהסשן יתעדכן
      } else if (registrationContextData.isCompletingProfile) {
        // אם נמצאים בתהליך השלמת פרופיל (לא מיד אחרי אימות מייל) והסשן אבד.
        shouldReset = true;
        resetReason =
          "Unauthenticated while in 'isCompletingProfile' mode (not immediately after email verification).";
      } else if (registrationContextData.isVerifyingEmailCode) {
        // זהו מצב תקין למשתמש חדש שאינו מאומת ונמצא בתהליך אימות קוד מייל.
        shouldReset = false;
        console.log(
          '[RegisterStepsContent useEffect] UNAUTHENTICATED, but actively verifying email code. No reset needed.'
        );
      } else if (registrationContextData.step > 1) {
        // בתהליך הרשמה חדש (לא isCompletingProfile), עבר את שלב BasicInfo (שלב 1), לא מאמת קוד מייל, והפך ללא מאומת.
        shouldReset = true;
        resetReason =
          'Unauthenticated in new registration flow, past BasicInfo (step > 1), and not verifying email code.';
      } else if (
        registrationContextData.step <= 1 &&
        registrationContextData.step >= 0
      ) {
        // ב-Welcome (שלב 0) או BasicInfo (שלב 1) עבור הרשמה חדשה, ומצב לא מאומת הוא צפוי.
        shouldReset = false;
        console.log(
          '[RegisterStepsContent useEffect] UNAUTHENTICATED, on Welcome/BasicInfo step for new registration. This is normal, no reset needed.'
        );
      }

      if (shouldReset) {
        console.warn(
          `[RegisterStepsContent useEffect] UNAUTHENTICATED. Resetting form. Reason: ${resetReason}`
        );
        resetForm();
      }
    }
  }, [
    sessionStatus,
    session, // תלות בסשן עצמו (לא רק בסטטוס)
    router,
    registrationContextData,
    initializeFromSession,
    resetForm,
    goToStep,
    initializationAttempted,
    searchParams, // הוספנו כתלות כי הוא משפיע על הודעת הפרופיל הלא שלם
  ]);

  const renderStep = (): React.ReactNode => {
    console.log(
      '[RegisterStepsContent renderStep] Determining step. Context:',
      {
        step: registrationContextData.step,
        isCompletingProfile: registrationContextData.isCompletingProfile,
        isVerifyingEmailCode: registrationContextData.isVerifyingEmailCode,
        emailForVerification: registrationContextData.emailForVerification,
      },
      'Session Status:',
      sessionStatus
    );

    if (sessionStatus === 'loading') {
      console.log(
        '[RegisterStepsContent renderStep] Session loading, showing loader.'
      );
      return (
        <div className="flex justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      );
    }
    const user = session?.user as SessionUserType | undefined;
    if (
      sessionStatus === 'authenticated' &&
      user &&
      (!user.isProfileComplete || !user.isPhoneVerified) &&
      registrationContextData.step < 2
    ) {
      console.log(
        "[RegisterStepsContent renderStep] Authenticated but context is not ready. Showing 'preparing' loader to prevent flash."
      );
      return (
        <div className="flex justify-center items-center p-10 space-x-3 rtl:space-x-reverse">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          <span className="text-gray-600">מכין את השלב הבא...</span>
        </div>
      );
    }
    // --- סוף התיקון ---
    const userFromSession = session?.user as SessionUserType | undefined;
    if (
      sessionStatus === 'authenticated' &&
      userFromSession &&
      !initializationAttempted &&
      (!userFromSession.termsAndPrivacyAcceptedAt ||
        !userFromSession.isProfileComplete ||
        !userFromSession.isPhoneVerified) &&
      registrationContextData.step === 0 &&
      !registrationContextData.isVerifyingEmailCode
    ) {
      console.log(
        "[RegisterStepsContent renderStep] Authenticated but initialization not attempted and context is at step 0. Showing 'preparing' loader."
      );
      return (
        <div className="flex justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          <p className="ml-2">מכין תהליך הרשמה...</p>
        </div>
      );
    }

    // אימות מייל למשתמשים חדשים עם אימייל/סיסמה
    if (
      registrationContextData.isVerifyingEmailCode &&
      !registrationContextData.isCompletingProfile
    ) {
      console.log(
        '[RegisterStepsContent renderStep] Rendering EmailVerificationCodeStep.'
      );
      return <EmailVerificationCodeStep />;
    }

    // תהליך השלמת פרופיל (isCompletingProfile הוא true)
    // זה כולל משתמשי גוגל שצריכים השלמה, משתמשי אימייל/סיסמה אחרי אימות מייל,
    // או משתמשים שחזרו להשלים פרופיל/טלפון.
    // ההסכמה מטופלת כעת בתוך PersonalDetailsStep אם נדרש.
    if (registrationContextData.isCompletingProfile) {
      console.log(
        "[RegisterStepsContent renderStep] In 'isCompletingProfile' mode. Current step:",
        registrationContextData.step
      );
      switch (registrationContextData.step) {
        case 2:
          console.log(
            '[RegisterStepsContent renderStep] Rendering PersonalDetailsStep for profile completion.'
          );
          return <PersonalDetailsStep />;
        case 3:
          console.log(
            '[RegisterStepsContent renderStep] Rendering OptionalInfoStep for profile completion.'
          );
          return <OptionalInfoStep />;
        case 4:
          console.log(
            '[RegisterStepsContent renderStep] Rendering CompleteStep for profile completion.'
          );
          return <CompleteStep />;
        default:
          console.warn(
            `[RegisterStepsContent renderStep] (Profile Completion Flow) Unexpected step ${registrationContextData.step}. Session:`,
            session?.user
          );
          // ניסיון התאוששות אם המצב לא תקין
          if (session?.user) {
            // רק אם יש סשן, אחרת זה עלול לגרום ללולאה עם הלוגיקה ב-useEffect
            if (!initializationAttempted) {
              console.log(
                '[RegisterStepsContent renderStep] (Profile Completion Flow) Default case - user exists, re-initializing from session.'
              );
              initializeFromSession(session.user as SessionUserType);
              setInitializationAttempted(true); // סמן שניסית לאתחל
              return (
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto my-10" />
              );
            } else if (
              registrationContextData.step < 2 ||
              registrationContextData.step > 4
            ) {
              // אם כבר ניסינו אתחול, והשלב עדיין לא תקין (לא 2,3,4), נסה לנתב לשלב ההתחלה של השלמת פרופיל
              console.log(
                `[RegisterStepsContent renderStep] (Profile Completion Flow) Default case - user exists, init attempted, step ${registrationContextData.step} invalid. Going to step 2.`
              );
              if (goToStep) goToStep(2); // ודא ש-goToStep מוגדר לפני הקריאה
              return (
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto my-10" />
              );
            }
          }
          // אם אין סשן או שההתאוששות לא עבדה, אולי כדאי לאפס
          console.log(
            '[RegisterStepsContent renderStep] (Profile Completion Flow) Default case - cannot recover, resetting form and showing WelcomeStep.'
          );
          resetForm();
          return <WelcomeStep />;
      }
    }

    // תהליך הרשמה חדש רגיל
    console.log(
      '[RegisterStepsContent renderStep] In new registration flow. Current step:',
      registrationContextData.step
    );
    switch (registrationContextData.step) {
      case 0:
        console.log('[RegisterStepsContent renderStep] Rendering WelcomeStep.');
        return <WelcomeStep />;
      case 1:
        console.log(
          '[RegisterStepsContent renderStep] Rendering BasicInfoStep.'
        );
        return <BasicInfoStep />;
      // שלבים 2,3,4 עבור הרשמה חדשה קורים אחרי אימות מייל,
      // שם isCompletingProfile הופך ל-true והלוגיקה למעלה תופסת.
      default:
        console.warn(
          `[RegisterStepsContent renderStep] (New Registration Flow) Unexpected step ${registrationContextData.step}.`
        );
        // אם יש סשן והוא לא מוגדר במלואו, נסה לאתחל
        if (
          session?.user &&
          (!session.user.isProfileComplete ||
            !session.user.isPhoneVerified ||
            !session.user.termsAndPrivacyAcceptedAt)
        ) {
          if (!initializationAttempted) {
            console.log(
              '[RegisterStepsContent renderStep] (New Registration Flow) Default case - user exists and needs setup, re-initializing from session.'
            );
            initializeFromSession(session.user as SessionUserType);
            setInitializationAttempted(true);
            return (
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto my-10" />
            );
          }
        }
        // אם אין סשן או שהאתחול לא נדרש/עזר, אפס והצג את שלב הפתיחה
        console.log(
          '[RegisterStepsContent renderStep] (New Registration Flow) Default case - resetting form and showing WelcomeStep.'
        );
        resetForm();
        return <WelcomeStep />;
    }
  };

  const stepContent = renderStep();

  // --- לוגיקת כותרות וסרגל התקדמות (נשארה כפי שהייתה, אך מומלץ לבדוק אותה היטב בהקשר לשינויים) ---
  let pageTitle = 'הרשמה למערכת';
  let stepDescription = 'ברוכים הבאים! בואו נתחיל.';
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3;
  let showProgressBar = false;

  if (
    registrationContextData.isVerifyingEmailCode &&
    !registrationContextData.isCompletingProfile
  ) {
    pageTitle = 'אימות כתובת מייל';
    stepDescription = `הזן את הקוד שנשלח ל: ${registrationContextData.emailForVerification || registrationContextData.email}.`;
    showProgressBar = true;
    currentProgressBarStep = 1;
  } else if (registrationContextData.isCompletingProfile) {
    pageTitle = 'השלמת פרטים';
    totalProgressBarSteps = 2; // פרטים אישיים (1), מידע נוסף (2)
    if (registrationContextData.step === 2) {
      // PersonalDetails
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? 'שלב 1 מתוך 2: פרטים אישיים.'
        : 'שלב 1: אישור תנאים ופרטים אישיים.';
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 3) {
      // OptionalInfo
      stepDescription = 'שלב 2 מתוך 2: מידע נוסף (מומלץ).'; // ללא שינוי, כבר היה טוב
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      // CompleteStep
      stepDescription = session?.user?.isPhoneVerified
        ? 'הפרופיל שלך מוכן!'
        : 'הפרטים הושלמו! השלב הבא: אימות טלפון.';
      showProgressBar = false; // בדרך כלל אין סרגל התקדמות במסך הסיום
    } else {
      // למקרה שהשלב הוא לא 2, 3, או 4 במצב השלמת פרופיל (למשל, אם נתקע על 0 או 1)
      stepDescription = 'טוען שלב השלמת פרופיל...';
      showProgressBar =
        registrationContextData.step > 1 && registrationContextData.step < 4; // הצג רק אם בשלבי מילוי פעילים
    }
  } else {
    // הרשמה חדשה (לא מאמתים מייל על המסך, לא משלימים פרופיל עדיין)
    if (registrationContextData.step === 0) {
      // Welcome
      pageTitle = 'ברוכים הבאים';
      stepDescription = 'בואו נתחיל את המסע יחד.';
      showProgressBar = false;
    } else if (registrationContextData.step === 1) {
      // BasicInfo
      pageTitle = 'יצירת חשבון';
      stepDescription = 'שלב 1 מתוך 3: אישור תנאים ופרטי התחברות.';
      currentProgressBarStep = 1;
      totalProgressBarSteps = 3; // בסיסי (כולל הסכמה), אישי, מידע נוסף (אחרי אימות מייל)
      showProgressBar = true;
    }
  }
  // --- סוף לוגיקת כותרות וסרגל התקדמות ---

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <button
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לדף הבית
      </button>

      <div className="mb-6 text-center">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 text-3xl font-bold mb-2">
          {pageTitle}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">{stepDescription}</p>
      </div>

      {showIncompleteProfileMessage && (
        <Alert className="mb-6 w-full max-w-md bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="ml-3 rtl:mr-3 rtl:ml-0">
            <AlertTitle className="font-semibold mb-1">
              נדרשת פעולה להשלמת החשבון
            </AlertTitle>
            <AlertDescription className="text-sm">
              {searchParams.get('reason') === 'verify_phone'
                ? 'הפרופיל שלך כמעט מוכן! נדרש אימות טלפון כדי להמשיך.'
                : 'כדי לגשת לאזור האישי ולשאר חלקי האתר, יש להשלים תחילה את פרטי הפרופיל ואימותים נדרשים.'}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {showProgressBar && (
        <div className="w-full max-w-md mb-6">
          <ProgressBar
            currentStep={currentProgressBarStep}
            totalSteps={totalProgressBarSteps}
          />
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
        {!(
          (registrationContextData.step === 0 &&
            !registrationContextData.isCompletingProfile) || // WelcomeStep
          registrationContextData.step === 4 // CompleteStep
        ) && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
        )}
        <div className="p-6 sm:p-8">{stepContent}</div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        יש לך שאלות?{' '}
        <a href="/contact" className="text-cyan-600 hover:underline">
          צור קשר
        </a>
      </div>
    </div>
  );
};

export default function RegisterSteps() {
  return (
    <RegistrationProvider>
      <RegisterStepsContent />
    </RegistrationProvider>
  );
}
