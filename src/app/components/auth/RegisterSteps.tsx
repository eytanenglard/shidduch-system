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
    setData,
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
      // This case indicates they should be guided towards phone verification.
      // CompleteStep (step 4) should handle this message.
      setShowIncompleteProfileMessage(true); // Or a more specific message
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
      return; // Wait for session to load
    }

    if (sessionStatus === "authenticated" && session?.user) {
      const user = session.user;

      // Scenario 1: Fully complete and verified. Redirect away.
      if (user.isProfileComplete && user.isPhoneVerified) {
        console.log(
          "[RegisterSteps] User fully verified. Redirecting to /profile."
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
        setInitializationAttempted(true); // Mark that initialization has been attempted for this session user
        return; // Allow context to update and re-render
      }
      // If initialization was attempted, let the current context state drive the UI.
    } else if (sessionStatus === "unauthenticated") {
      console.log("[RegisterSteps] User unauthenticated.");
      setInitializationAttempted(false); // Reset for next potential login

      // If user was in a flow that requires authentication (e.g. completing profile, verifying email for an existing account)
      // then reset the form. A brand new registration (step 0, 1 before account creation) can proceed unauthenticated.
      if (
        registrationContextData.isCompletingProfile ||
        registrationContextData.isVerifyingEmailCode
      ) {
        console.log(
          "[RegisterSteps] Resetting registration due to unauthentication while in profile completion or email verification."
        );
        resetForm();
      } else if (
        registrationContextData.step > 1 &&
        !registrationContextData.isCompletingProfile
      ) {
        // If they were past BasicInfo in a new registration (e.g. on PersonalDetails) and became unauth, also reset.
        // This situation is less likely if BasicInfoStep creates account then moves to email verification.
        console.log(
          "[RegisterSteps] Resetting registration due to unauthentication during new registration flow past BasicInfo."
        );
        resetForm();
      }
    }
  }, [
    sessionStatus,
    session,
    router,
    registrationContextData, // Main dependency for context state
    initializeFromSession,
    resetForm,
    initializationAttempted, // Local state to control initialization
    setData,
    goToStep, // Added goToStep and setData for potential recovery
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
    // (e.g., waiting for the useEffect to run initializeFromSession)
    if (
      sessionStatus === "authenticated" &&
      session?.user &&
      !initializationAttempted &&
      registrationContextData.step === 0
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
    if (
      registrationContextData.isVerifyingEmailCode &&
      !registrationContextData.isCompletingProfile
    ) {
      console.log(
        "[RegisterSteps] Rendering EmailVerificationCodeStep. Current step in context:",
        registrationContextData.step
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
          // This case might be hit if initializeFromSession determined a state but step is unexpected.
          // Or if user was on step 0/1 of completion (which shouldn't happen with current init logic).
          console.warn(
            `[RegisterSteps] (Completion) Unexpected step ${registrationContextData.step}. Attempting recovery.`
          );
          // If session exists, re-initialize to be safe. Otherwise, go to step 2 for completion.
          if (session?.user) {
            if (!initializationAttempted) {
              // Avoid infinite loops if re-init also leads here
              initializeFromSession(session.user);
              setInitializationAttempted(true); // Mark it
              return (
                <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
                  <p className="text-gray-600">מאפס שלב...</p>
                </div>
              );
            } else {
              // If already attempted initialization and still here, default to step 2 of completion
              if (
                registrationContextData.step < 2 ||
                registrationContextData.step > 4
              )
                goToStep(2);
              return <PersonalDetailsStep />;
            }
          } else {
            // No session, but in completion mode? This is odd. Reset.
            resetForm();
            return <WelcomeStep />;
          }
      }
    }

    // Regular New Registration Flow (isCompletingProfile is false, not verifying email)
    console.log(
      "[RegisterSteps] (New Registration Flow) Current step:",
      registrationContextData.step
    );
    switch (registrationContextData.step) {
      case 0: // Welcome
        return <WelcomeStep />;
      case 1: // Basic Info (Email, Password). EmailVerification is handled above.
        return <BasicInfoStep />;
      // Steps 2, 3, 4 for new registration are typically after email verification.
      // completeEmailVerification in context moves to step 2.
      // So, if isCompletingProfile is false, user should not be on steps 2,3,4 unless email was verified.
      // The context state (driven by initializeFromSession or flow functions) should manage this.
      // If a new user (not completing profile) somehow gets to step 2,3,4 without isCompletingProfile being set,
      // it implies they passed email verification for a new account.
      case 2:
        return <PersonalDetailsStep />;
      case 3:
        return <OptionalInfoStep />;
      case 4:
        return <CompleteStep />; // For new reg, this is after OptionalInfo
      default:
        console.warn(
          `[RegisterSteps] (Registration) Unexpected step ${registrationContextData.step}. Defaulting to WelcomeStep (step 0).`
        );
        if (registrationContextData.step !== 0) goToStep(0); // Try to recover
        return <WelcomeStep />;
    }
  };

  const stepContent = renderStep();

  let pageTitle = "הרשמה למערכת";
  let stepDescription = "ברוכים הבאים! בואו נתחיל.";
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3; // Default for new: Basic (1), Personal (2), Optional (3)
  let showProgressBar = false;

  if (registrationContextData.isVerifyingEmailCode) {
    pageTitle = "אימות כתובת מייל";
    stepDescription = `כדי להמשיך, יש לאמת את כתובת המייל שלך: ${
      registrationContextData.emailForVerification ||
      registrationContextData.email
    }.`;
    showProgressBar = true;
    currentProgressBarStep = 1; // Part of "Basic Info" stage
    totalProgressBarSteps = 3;
  } else if (registrationContextData.isCompletingProfile) {
    pageTitle = "השלמת פרטים";
    // Progress bar for completion: Personal (1), Optional (2)
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
      showProgressBar = false; // Or show full progress
    } else {
      // Should not happen if steps are 2,3,4 for completion
      stepDescription = "אנא המתן...";
      showProgressBar = false;
    }
  } else {
    // New Registration Flow (not verifying email, not completing profile)
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
      /* PersonalDetails after new reg email verify */
      pageTitle = "פרטים אישיים";
      stepDescription = "שלב 2 מתוך 3: קצת עליך.";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (registrationContextData.step === 3) {
      /* OptionalInfo */
      pageTitle = "מידע נוסף";
      stepDescription = "שלב 3 מתוך 3: עוד קצת פרטים (אופציונלי).";
      currentProgressBarStep = 3;
      showProgressBar = true;
    } else if (registrationContextData.step === 4) {
      /* CompleteStep for new registration */
      pageTitle = "סיום הרשמה ראשונית";
      stepDescription = "הפרטים נשמרו! השלב הבא: אימות טלפון."; // This assumes new reg always needs phone verify next
      showProgressBar = false; // Or show full
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
              !registrationContextData.isCompletingProfile) ||
            registrationContextData.step === 4
          ) // No top bar on welcome, email verify, or complete step
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
