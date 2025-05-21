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
import ProgressBar from "./ProgressBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Info, Loader2 } from "lucide-react";

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

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (
      reason === "complete_profile" &&
      !registrationContextData.isCompletingProfile
    ) {
      setShowIncompleteProfileMessage(true);
    } else if (
      reason === "verify_phone" &&
      !registrationContextData.isCompletingProfile
    ) {
      setShowIncompleteProfileMessage(true);
    } else {
      setShowIncompleteProfileMessage(false);
    }
  }, [searchParams, registrationContextData.isCompletingProfile]);

  useEffect(() => {
    console.log(
      "[RegisterSteps] Effect triggered. Session Status:",
      sessionStatus,
      "Context Data:",
      registrationContextData,
      "Session User:",
      session?.user,
      "Initialization Attempted:",
      initializationAttempted
    );

    if (sessionStatus === "loading") {
      console.log("[RegisterSteps] Session is loading. Waiting...");
      return; // Wait for session to load
    }

    if (sessionStatus === "authenticated" && session?.user) {
      const user = session.user;
      console.log("[RegisterSteps] Session authenticated. User:", user);

      // Scenario 1: Fully complete and verified. Redirect away.
      if (user.isProfileComplete && user.isPhoneVerified) {
        console.log(
          "[RegisterSteps] User fully verified and profile complete. Redirecting to /profile."
        );
        router.push("/profile");
        return;
      }

      // Scenario 2: User is authenticated but not fully set up.
      // Initialize context from session if not already done or if context is still at step 0 (Welcome)
      // and not in a special state like email verification.
      if (
        !initializationAttempted ||
        (registrationContextData.step === 0 &&
          !registrationContextData.isVerifyingEmailCode)
      ) {
        console.log(
          "[RegisterSteps] Authenticated. Initializing registration context from session data."
        );
        initializeFromSession(user);
        setInitializationAttempted(true);
        return; // Allow context to update and re-render
      }
      console.log(
        "[RegisterSteps] Initialization already attempted for this session user or context state does not require re-init."
      );
    } else if (sessionStatus === "unauthenticated") {
      console.log(
        "[RegisterSteps] User unauthenticated. Context data:",
        registrationContextData
      );
      setInitializationAttempted(false); // Reset for next potential login

      let shouldReset = false;
      let resetReason = "";

      // Case 1: User was explicitly trying to complete an existing profile but became unauthenticated.
      if (registrationContextData.isCompletingProfile) {
        shouldReset = true;
        resetReason = "Unauthenticated while explicitly completing profile.";
      }
      // Case 2: It's a NEW registration flow (NOT completing profile).
      else if (!registrationContextData.isCompletingProfile) {
        // Subcase 2a: User is on the EmailVerificationCodeStep for a new registration.
        // This is an EXPECTED state for an unauthenticated new user. DO NOT RESET.
        if (registrationContextData.isVerifyingEmailCode) {
          console.log(
            "[RegisterSteps] User unauthenticated and isVerifyingEmailCode for NEW registration. This is expected. No reset."
          );
        }
        // Subcase 2b: User was past BasicInfo (e.g., on PersonalDetails, step > 1)
        // for a new registration, and somehow became unauthenticated (and not on email verification). This is unexpected. RESET.
        else if (
          registrationContextData.step > 1 &&
          !registrationContextData.isVerifyingEmailCode
        ) {
          shouldReset = true;
          resetReason =
            "Unauthenticated in new registration flow, past BasicInfo (step > 1) and not on email verification screen.";
        }
        // Other new registration states (Welcome - step 0, BasicInfo - step 1 before submitting)
        // also don't need a reset triggered by unauthentication if not verifying email.
      }

      if (shouldReset) {
        console.log(
          `[RegisterSteps] Resetting registration. Reason: ${resetReason}`,
          "Context data before reset:",
          JSON.parse(JSON.stringify(registrationContextData)) // Deep copy for logging
        );
        resetForm();
      } else {
        console.log(
          "[RegisterSteps] Conditions for reset due to unauthentication not met."
        );
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
    // setData and goToStep are not directly used in this effect's logic flow for now
    // but are good to keep if future changes might need them.
    // setData,
    // goToStep,
  ]);

  const renderStep = (): React.ReactNode => {
    if (sessionStatus === "loading") {
      return (
        <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
          <p className="text-gray-600">טוען סשן...</p>
        </div>
      );
    }

    // If session is authenticated, but context hasn't been initialized from session yet
    if (
      sessionStatus === "authenticated" &&
      session?.user &&
      !initializationAttempted &&
      registrationContextData.step === 0 // Added check to ensure we only show this if context is truly at start
    ) {
      if (!session.user.isProfileComplete || !session.user.isPhoneVerified) {
        return (
          <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
            <p className="text-gray-600">מכין את תהליך ההרשמה...</p>
          </div>
        );
      }
    }

    // Email Verification for new Email/Password users
    // Check this BEFORE isCompletingProfile, as verifying email is a sub-step of new registration.
    if (
      registrationContextData.isVerifyingEmailCode &&
      !registrationContextData.isCompletingProfile // Ensures this is for new registration email verification
    ) {
      console.log(
        "[RegisterSteps] Rendering EmailVerificationCodeStep. Current step in context:",
        registrationContextData.step,
        "isVerifyingEmailCode:",
        registrationContextData.isVerifyingEmailCode
      );
      return <EmailVerificationCodeStep />;
    }

    // Profile Completion Flow (isCompletingProfile is true)
    // This covers Google Signups needing completion, or Email/Pass users post-email-verification,
    // or users returning to complete profile/phone.
    if (registrationContextData.isCompletingProfile) {
      console.log(
        "[RegisterSteps] (Profile Completion Flow) Current step:",
        registrationContextData.step
      );
      switch (registrationContextData.step) {
        case 2: // Personal Details (first step of completion or resume here)
          return <PersonalDetailsStep />;
        case 3: // Optional Info
          return <OptionalInfoStep />;
        case 4: // Complete Confirmation Screen (guides to phone verification if needed)
          return <CompleteStep />;
        default:
          console.warn(
            `[RegisterSteps] (Completion) Unexpected step ${registrationContextData.step}. Session:`,
            session?.user
          );
          // Attempt recovery if session exists and initialization was not attempted or failed
          if (session?.user && !initializationAttempted) {
            console.log(
              "[RegisterSteps] (Completion) Re-attempting initialization from session."
            );
            initializeFromSession(session.user);
            setInitializationAttempted(true);
            return (
              <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
                <p className="text-gray-600">מאפס שלב...</p>
              </div>
            );
          } else if (
            (session?.user && registrationContextData.step < 2) ||
            registrationContextData.step > 4
          ) {
            // If init was attempted, and step is still out of bounds for completion, force to step 2.
            console.log(
              "[RegisterSteps] (Completion) Forcing to step 2 for profile completion."
            );
            if (goToStep) goToStep(2); // Ensure goToStep is available from context
            return <PersonalDetailsStep />;
          }
          // If no session, and in completion mode, reset everything.
          console.log(
            "[RegisterSteps] (Completion) No session or unrecoverable state, resetting form."
          );
          resetForm();
          return <WelcomeStep />;
      }
    }

    // Regular New Registration Flow (isCompletingProfile is false, not verifying email code on screen)
    console.log(
      "[RegisterSteps] (New Registration Flow) Current step:",
      registrationContextData.step
    );
    switch (registrationContextData.step) {
      case 0: // Welcome
        return <WelcomeStep />;
      case 1: // Basic Info (Email, Password). EmailVerification is handled by the 'isVerifyingEmailCode' block above.
        return <BasicInfoStep />;
      // Steps 2, 3, 4 for new registration are after email verification.
      // `completeEmailVerification` in context moves to step 2 and sets isCompletingProfile to true.
      // So, if isCompletingProfile is false, user should NOT be on steps 2,3,4 here.
      // This indicates a logic mismatch if reached.
      case 2:
      case 3:
      case 4:
        console.warn(
          `[RegisterSteps] (New Registration) Unexpectedly on step ${registrationContextData.step} while isCompletingProfile is false and not verifying email. This may indicate an issue with state transition after email verification. Resetting to WelcomeStep.`
        );
        // If the session *is* authenticated and profile *is not* complete, it should have been caught by initializeFromSession.
        // If still here, it implies a state inconsistency.
        if (
          session?.user &&
          (!session.user.isProfileComplete || !session.user.isPhoneVerified)
        ) {
          console.log(
            "[RegisterSteps] (New Registration) Session exists but profile incomplete, re-initializing."
          );
          if (!initializationAttempted) {
            // Prevent re-init loops
            initializeFromSession(session.user);
            setInitializationAttempted(true);
            return (
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
            );
          }
        }
        // Default to reset if state is truly unexpected for new registration
        resetForm();
        return <WelcomeStep />;
      default:
        console.warn(
          `[RegisterSteps] (Registration) Unexpected step ${registrationContextData.step}. Defaulting to WelcomeStep (step 0).`
        );
        if (registrationContextData.step !== 0 && goToStep) goToStep(0); // Try to recover
        return <WelcomeStep />;
    }
  };

  const stepContent = renderStep();

  let pageTitle = "הרשמה למערכת";
  let stepDescription = "ברוכים הבאים! בואו נתחיל.";
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3; // Default for new: Basic (1), Personal (2), Optional (3) -> then CompleteScreen
  let showProgressBar = false;

  // Logic for page titles, descriptions, and progress bar visibility
  if (
    registrationContextData.isVerifyingEmailCode &&
    !registrationContextData.isCompletingProfile // New reg email verification
  ) {
    pageTitle = "אימות כתובת מייל";
    stepDescription = `הזן את הקוד שנשלח ל: ${
      registrationContextData.emailForVerification ||
      registrationContextData.email
    }.`;
    showProgressBar = true;
    currentProgressBarStep = 1; // Part of "Basic Info" stage (which is stage 1 of 3 before completion)
    totalProgressBarSteps = 3;
  } else if (registrationContextData.isCompletingProfile) {
    pageTitle = "השלמת פרטים";
    // Progress bar for completion: Personal (1), Optional (2) -> then CompleteScreen
    totalProgressBarSteps = 2;
    if (registrationContextData.step === 2) {
      // PersonalDetails
      stepDescription = "שלב 1 מתוך 2: פרטים אישיים.";
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 3) {
      // OptionalInfo
      stepDescription = "שלב 2 מתוך 2: מידע נוסף (מומלץ).";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      // CompleteStep for completion
      stepDescription = session?.user?.isPhoneVerified
        ? "הפרופיל שלך מוכן!"
        : "הפרטים הושלמו! השלב הבא: אימות טלפון.";
      showProgressBar = false; // Or show full progress at the end if desired
    } else {
      stepDescription = "טוען שלב השלמת פרופיל...";
      showProgressBar = false;
    }
  } else {
    // New Registration Flow (not verifying email on screen, not completing profile yet)
    if (registrationContextData.step === 0) {
      /* Welcome */
      pageTitle = "ברוכים הבאים";
      stepDescription = "בואו נתחיל את המסע יחד.";
      showProgressBar = false;
    } else if (registrationContextData.step === 1) {
      /* BasicInfo */
      pageTitle = "יצירת חשבון";
      stepDescription = "שלב 1 מתוך 3: פרטי התחברות.";
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (registrationContextData.step === 2) {
      /* PersonalDetails (should be handled by isCompletingProfile) */
      pageTitle = "פרטים אישיים";
      stepDescription = "שלב 2 מתוך 3: קצת עליך.";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (registrationContextData.step === 3) {
      /* OptionalInfo (should be handled by isCompletingProfile) */
      pageTitle = "מידע נוסף";
      stepDescription = "שלב 3 מתוך 3: עוד קצת פרטים (אופציונלי).";
      currentProgressBarStep = 3;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      /* CompleteStep for new registration (should be handled by isCompletingProfile) */
      pageTitle = "סיום הרשמה ראשונית";
      stepDescription = "הפרטים נשמרו! השלב הבא: אימות טלפון.";
      showProgressBar = false;
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
          (
            registrationContextData.isVerifyingEmailCode ||
            (registrationContextData.step === 0 &&
              !registrationContextData.isCompletingProfile) || // Welcome step for new registration
            registrationContextData.step === 4
          ) // Complete step for any flow
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
