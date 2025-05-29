// src/app/components/auth/RegisterSteps.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RegistrationProvider, useRegistration } from "./RegistrationContext";
import WelcomeStep from "./steps/WelcomeStep";
import BasicInfoStep from "./steps/BasicInfoStep";
import EmailVerificationCodeStep from "./steps/EmailVerificationCodeStep";
import PersonalDetailsStep from "./steps/PersonalDetailsStep";
import OptionalInfoStep from "./steps/OptionalInfoStep";
import CompleteStep from "./steps/CompleteStep";
// אין צורך לייבא את ConsentAcknowledgementStep
import ProgressBar from "./ProgressBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Info, Loader2 } from "lucide-react";
import type { User as SessionUserType } from "@/types/next-auth";

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

  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] = useState(false);
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "complete_profile" && !registrationContextData.isCompletingProfile) {
      setShowIncompleteProfileMessage(true);
    } else if (reason === "verify_phone" && !registrationContextData.isCompletingProfile) {
      setShowIncompleteProfileMessage(true);
    } else {
      setShowIncompleteProfileMessage(false);
    }
  }, [searchParams, registrationContextData.isCompletingProfile]);

  useEffect(() => {
    console.log(
      "[RegisterSteps] Effect: Session Status:", sessionStatus,
      "Context:", registrationContextData,
      "Session User:", session?.user,
      "Init Attempted:", initializationAttempted
    );

    if (sessionStatus === "loading") return;

    if (sessionStatus === "authenticated" && session?.user) {
      const user = session.user as SessionUserType;
      console.log("[RegisterSteps] Auth. User data:", user);

      if (user.isProfileComplete && user.isPhoneVerified && user.termsAndPrivacyAcceptedAt) {
        console.log("[RegisterSteps] User fully set up. Redirecting to /profile.");
        router.push("/profile");
        return;
      }

      // אתחול הקונטקסט רק אם לא נוסה עדיין, או אם אנחנו במצב התחלתי מאוד
      // והסשן מצביע על צורך בהשלמה.
      if (!initializationAttempted || (registrationContextData.step === 0 && !registrationContextData.isVerifyingEmailCode)) {
        // בדוק אם הסשן מצביע על כך שהמשתמש צריך להשלים משהו
        if (!user.termsAndPrivacyAcceptedAt || !user.isProfileComplete || !user.isPhoneVerified) {
            console.log("[RegisterSteps] Auth & needs setup. Initializing context from session.");
            initializeFromSession(user);
            setInitializationAttempted(true);
            return; // אפשר לקונטקסט להתעדכן
        } else {
            // המשתמש מאומת ומוגדר לחלוטין, אך ה-redirect הקודם לא עבד (נדיר)
            console.warn("[RegisterSteps] Auth & fully setup, but stuck. Forcing redirect to /profile.");
            router.push("/profile");
            return;
        }
      }
      console.log("[RegisterSteps] Init already attempted or not needed based on context state.");

    } else if (sessionStatus === "unauthenticated") {
      console.log("[RegisterSteps] Unauth. Context:", registrationContextData);
      setInitializationAttempted(false); // אפס ללוגין הבא
      let shouldReset = false;
      let resetReason = "";

      if (registrationContextData.isCompletingProfile) {
        shouldReset = true;
        resetReason = "Unauth while completing profile.";
      } else if (!registrationContextData.isCompletingProfile) {
        if (registrationContextData.isVerifyingEmailCode) {
          // זה מצב תקין למשתמש חדש לא מאומת שממתין לקוד אימות
        } else if (registrationContextData.step > 1) { // אם עבר את BasicInfo ואינו מאמת מייל
          shouldReset = true;
          resetReason = "Unauth in new reg flow, past BasicInfo, not verifying email.";
        }
      }

      if (shouldReset) {
        console.log(`[RegisterSteps] Resetting form. Reason: ${resetReason}`);
        resetForm();
      }
    }
  }, [
    sessionStatus,
    session,
    router,
    registrationContextData,
    initializeFromSession,
    resetForm,
    initializationAttempted,
  ]);

  const renderStep = (): React.ReactNode => {
    if (sessionStatus === "loading") {
      return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;
    }

    // הצג טעינה אם הסשן אותחל אך הקונטקסט עדיין לא סיים אתחול
    // (והמשתמש באמת צריך להשלים משהו)
    const userFromSession = session?.user as SessionUserType | undefined;
    if (
      sessionStatus === "authenticated" && userFromSession && !initializationAttempted &&
      (!userFromSession.termsAndPrivacyAcceptedAt || !userFromSession.isProfileComplete || !userFromSession.isPhoneVerified) &&
      registrationContextData.step === 0 && // ודא שהקונטקסט במצב התחלתי
      !registrationContextData.isVerifyingEmailCode
    ) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /><p className="ml-2">מכין תהליך הרשמה...</p></div>;
    }


    // Email Verification for new Email/Password users
    if (registrationContextData.isVerifyingEmailCode && !registrationContextData.isCompletingProfile) {
      return <EmailVerificationCodeStep />;
    }

    // Profile Completion Flow (isCompletingProfile is true)
    // This includes Google Signups needing completion, Email/Pass users post-email-verification,
    // or users returning to complete profile/phone.
    // The Consent part is now handled within PersonalDetailsStep if needed.
    if (registrationContextData.isCompletingProfile) {
      switch (registrationContextData.step) {
        case 2: return <PersonalDetailsStep />; // Starts here (consent handled inside if needed)
        case 3: return <OptionalInfoStep />;
        case 4: return <CompleteStep />;
        default:
          console.warn(`[RegisterSteps] (Completion) Unexpected step ${registrationContextData.step}. Session:`, session?.user);
          if (session?.user && (!initializationAttempted || registrationContextData.step < 2 || registrationContextData.step > 4)) {
            if (!initializationAttempted) initializeFromSession(session.user as SessionUserType);
            else if (goToStep) goToStep(2);
            setInitializationAttempted(true);
            return <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto my-10" />;
          }
          resetForm();
          return <WelcomeStep />;
      }
    }

    // Regular New Registration Flow
    switch (registrationContextData.step) {
      case 0: return <WelcomeStep />;
      case 1: return <BasicInfoStep />; // Email/Pass new users, consent handled inside
      // Steps 2,3,4 for new registration happen after email verification, where isCompletingProfile becomes true.
      default:
        console.warn(`[RegisterSteps] (New Reg) Unexpected step ${registrationContextData.step}. Resetting.`);
         if (session?.user && (!session.user.isProfileComplete || !session.user.isPhoneVerified || !session.user.termsAndPrivacyAcceptedAt)) {
          if (!initializationAttempted) {
            initializeFromSession(session.user as SessionUserType);
            setInitializationAttempted(true);
            return <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mx-auto my-10" />;
          }
        }
        resetForm();
        return <WelcomeStep />;
    }
  };

  const stepContent = renderStep();

  let pageTitle = "הרשמה למערכת";
  let stepDescription = "ברוכים הבאים! בואו נתחיל.";
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3; // Default: Basic (1), Personal (2), Optional (3)
  let showProgressBar = false;

  // עדכון לוגיקת הכותרות והפרוגרס בר
  if (registrationContextData.isVerifyingEmailCode && !registrationContextData.isCompletingProfile) {
    pageTitle = "אימות כתובת מייל";
    stepDescription = `הזן את הקוד שנשלח ל: ${registrationContextData.emailForVerification || registrationContextData.email}.`;
    showProgressBar = true;
    currentProgressBarStep = 1; // חלק מ"פרטי בסיס" (שלב 1 מ-3 לפני סיום)
  } else if (registrationContextData.isCompletingProfile) {
    pageTitle = "השלמת פרטים";
    // פרוגרס בר להשלמה: פרטים אישיים (1), אופציונלי (2) -> ואז מסך סיום
    totalProgressBarSteps = 2; // אישי (1), אופציונלי (2)
    if (registrationContextData.step === 2) { // PersonalDetails
      stepDescription = session?.user?.termsAndPrivacyAcceptedAt
        ? "שלב 1 מתוך 2: פרטים אישיים."
        : "שלב 1: אישור תנאים ופרטים אישיים.";
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 3) { // OptionalInfo
      stepDescription = "שלב 2 מתוך 2: מידע נוסף (מומלץ).";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) { // CompleteStep
      stepDescription = session?.user?.isPhoneVerified
        ? "הפרופיל שלך מוכן!"
        : "הפרטים הושלמו! השלב הבא: אימות טלפון.";
      showProgressBar = false;
    } else {
      stepDescription = "טוען שלב השלמת פרופיל..."; // למשל אם step הוא 0 או 1 במצב השלמה
      showProgressBar = registrationContextData.step > 1 && registrationContextData.step < 4; // הצג רק אם בשלבי מילוי
    }
  } else { // הרשמה חדשה (לא מאמתים מייל על המסך, לא משלימים פרופיל עדיין)
    if (registrationContextData.step === 0) { // Welcome
      pageTitle = "ברוכים הבאים";
      stepDescription = "בואו נתחיל את המסע יחד.";
      showProgressBar = false;
    } else if (registrationContextData.step === 1) { // BasicInfo
      pageTitle = "יצירת חשבון";
      stepDescription = "שלב 1 מתוך 3: אישור תנאים ופרטי התחברות.";
      currentProgressBarStep = 1;
      totalProgressBarSteps = 3; // בסיסי(כולל הסכמה), אישי, אופציונלי
      showProgressBar = true;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <button
        onClick={() => router.push("/")}
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
               {searchParams.get("reason") === "verify_phone"
                 ? "הפרופיל שלך כמעט מוכן! נדרש אימות טלפון כדי להמשיך."
                 : "כדי לגשת לאזור האישי ולשאר חלקי האתר, יש להשלים תחילה את פרטי הפרופיל ואימותים נדרשים."}
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
          (registrationContextData.step === 0 && !registrationContextData.isCompletingProfile) || // Welcome
          registrationContextData.step === 4 // Complete
        ) && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
        )}
        <div className="p-6 sm:p-8">{stepContent}</div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        יש לך שאלות?{" "}
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