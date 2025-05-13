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
import { ArrowRight, Info } from "lucide-react";
// import { motion } from "framer-motion"; // Not directly used here, but sub-components use it

const RegisterStepsContent: React.FC = () => {
  const { data, initializeForCompletion, goToStep } = useRegistration();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession(); // Renamed status to avoid conflict
  const searchParams = useSearchParams();
  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  const [initializedForCompletion, setInitializedForCompletion] =
    useState(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "complete_profile") {
      setShowIncompleteProfileMessage(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      session?.user &&
      !session.user.isProfileComplete &&
      !initializedForCompletion && // Use the dedicated state
      !data.isCompletingProfile && // Ensure we are not already in completion mode
      !data.isVerifyingEmailCode // And not verifying email
    ) {
      console.log(
        "RegisterSteps: Authenticated user with incomplete profile. Initializing completion flow."
      );
      initializeForCompletion({
        email: session.user.email || "",
        firstName: session.user.firstName, // These might be null/undefined
        lastName: session.user.lastName,
      });
      setInitializedForCompletion(true); // Mark as initialized
    } else if (
      sessionStatus === "authenticated" &&
      session?.user?.isProfileComplete
    ) {
      console.log(
        "RegisterSteps: User authenticated and profile complete, redirecting to /profile"
      );
      router.push("/profile");
    } else if (
      sessionStatus === "unauthenticated" &&
      data.isCompletingProfile && // If was in completion mode
      !data.isVerifyingEmailCode // And not verifying email
      // data.step !== 0 // No need to check step if isCompletingProfile is true
    ) {
      // If user becomes unauthenticated while they were in profile completion mode,
      // reset them to the initial registration step (Welcome)
      console.log(
        "User became unauthenticated during profile completion, resetting to WelcomeStep."
      );
      goToStep(0);
      // Also reset isCompletingProfile if necessary, though goToStep(0) might handle it
      // depending on RegistrationContext logic. For clarity:
      // setData(prev => ({ ...prev, isCompletingProfile: false, step: 0 }));
    }
  }, [
    sessionStatus,
    session,
    initializeForCompletion,
    initializedForCompletion,
    router,
    // data.step, // data.step changes frequently, data object itself is better
    data, // Listen to changes in the whole data object from context
    goToStep,
    // data.isCompletingProfile, // Covered by 'data'
    // data.isVerifyingEmailCode, // Covered by 'data'
  ]);

  const renderStep = (): React.ReactNode => {
    if (data.isVerifyingEmailCode && !data.isCompletingProfile) {
      console.log("RegisterSteps: Rendering EmailVerificationCodeStep.");
      return <EmailVerificationCodeStep />;
    }

    // Profile Completion Flow
    if (data.isCompletingProfile) {
      // Profile completion starts at PersonalDetails (which is step 2 in the main flow)
      // and goes to OptionalInfo (step 3), then Complete (step 4)
      switch (data.step) {
        case 2: // Personal Details
          console.log(
            "RegisterSteps (Completion): Rendering PersonalDetailsStep."
          );
          return <PersonalDetailsStep />;
        case 3: // Optional Info
          console.log(
            "RegisterSteps (Completion): Rendering OptionalInfoStep."
          );
          return <OptionalInfoStep />;
        case 4: // Completion Confirmation Screen
          console.log("RegisterSteps (Completion): Rendering CompleteStep.");
          return <CompleteStep />;
        default:
          // If in completion mode but step is unexpected (e.g., 0 or 1),
          // default to PersonalDetails or log an error.
          console.warn(
            `RegisterSteps (Completion): Unexpected step ${data.step}. Defaulting to PersonalDetailsStep.`
          );
          return <PersonalDetailsStep />;
      }
    }

    // Regular Registration Flow
    switch (data.step) {
      case 0: // Welcome
        console.log("RegisterSteps (Registration): Rendering WelcomeStep.");
        return <WelcomeStep />;
      case 1: // Basic Info (EmailVerificationCodeStep is handled above)
        console.log("RegisterSteps (Registration): Rendering BasicInfoStep.");
        return <BasicInfoStep />;
      case 2: // Personal Details (after email verification)
        console.log(
          "RegisterSteps (Registration): Rendering PersonalDetailsStep."
        );
        return <PersonalDetailsStep />;
      case 3: // Optional Info
        console.log(
          "RegisterSteps (Registration): Rendering OptionalInfoStep."
        );
        return <OptionalInfoStep />;
      case 4: // Complete (This step is usually for profile completion confirmation)
        // In a new registration, after OptionalInfo, they might be redirected or shown a different message.
        // For now, if step 4 is reached in normal registration, show CompleteStep.
        console.log(
          "RegisterSteps (Registration): Rendering CompleteStep (end of multi-step form)."
        );
        return <CompleteStep />;
      default:
        console.warn(
          `RegisterSteps (Registration): Unexpected step ${data.step}. Defaulting to WelcomeStep.`
        );
        return <WelcomeStep />;
    }
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        טוען...
      </div>
    );
  }
  // If authenticated and profile is complete, useEffect will redirect.
  // If authenticated, incomplete profile, and not yet initializedForCompletion, show loading.
  if (
    sessionStatus === "authenticated" &&
    session?.user &&
    !session.user.isProfileComplete &&
    !initializedForCompletion &&
    !data.isCompletingProfile
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        בודק נתוני משתמש...
      </div>
    );
  }

  const stepContent = renderStep();

  // --- Determine Titles and Progress Bar ---
  let pageTitle = "הרשמה למערכת";
  let stepDescription = "ברוכים הבאים! בואו נתחיל.";

  // ProgressBar logic:
  // Registration: Welcome(0) -> Basic(1) --Verify--> Personal(2) -> Optional(3) -> End(4)
  // ProgressBar steps: (BasicInfo) -> (Personal) -> (Optional) => 3 steps for progress bar
  // Completion: Personal(data.step=2) -> Optional(data.step=3) -> End(data.step=4)
  // ProgressBar steps: (Personal) -> (Optional) => 2 steps for progress bar

  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3; // For new registration
  let showProgressBar = false;

  if (data.isVerifyingEmailCode) {
    pageTitle = "אימות כתובת מייל";
    stepDescription = `כדי להמשיך, יש לאמת את כתובת המייל שלך: ${data.emailForVerification}.`;
    showProgressBar = false; // Or treat as part of BasicInfo's progress
  } else if (data.isCompletingProfile) {
    pageTitle = "השלמת פרטים";
    totalProgressBarSteps = 2; // Personal, Optional
    if (data.step === 2) {
      // PersonalDetails
      stepDescription = "שלב 1 מתוך 2: פרטים אישיים.";
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (data.step === 3) {
      // OptionalInfo
      stepDescription = "שלב 2 מתוך 2: מידע נוסף (מומלץ).";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (data.step === 4) {
      // CompleteStep
      stepDescription = "הפרופיל הושלם בהצלחה!";
      showProgressBar = false; // Or show full
    }
  } else {
    // New Registration
    if (data.step === 0) {
      // Welcome
      // Default description is fine
      showProgressBar = false;
    } else if (data.step === 1) {
      // BasicInfo
      stepDescription = "שלב 1 מתוך 3: פרטי חשבון.";
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (data.step === 2) {
      // PersonalDetails
      stepDescription = "שלב 2 מתוך 3: פרטים אישיים.";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (data.step === 3) {
      // OptionalInfo
      stepDescription = "שלב 3 מתוך 3: מידע נוסף (אופציונלי).";
      currentProgressBarStep = 3;
      showProgressBar = true;
    } else if (data.step === 4) {
      // CompleteStep (if used for new reg completion)
      stepDescription = "ההרשמה הושלמה!";
      showProgressBar = false; // Or show full
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowRight className="h-4 w-4" />{" "}
        {/* Icon might need to flip for RTL */}
        חזרה לדף הבית
      </button>

      <div className="mb-6 text-center">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 text-3xl font-bold mb-2">
          {pageTitle}
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">{stepDescription}</p>
      </div>

      {showIncompleteProfileMessage &&
        !data.isCompletingProfile && ( // Show only if not already in completion flow
          <Alert className="mb-6 w-full max-w-md bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md">
            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="ml-3 rtl:mr-3 rtl:ml-0">
              <AlertTitle className="font-semibold mb-1">
                השלמת פרופיל נדרשת
              </AlertTitle>
              <AlertDescription className="text-sm">
                כדי לגשת לאזור האישי ולשאר חלקי האתר, יש להשלים תחילה את פרטי
                הפרופיל שלך.
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
        {/* Conditional top bar, hide if verifying email or on welcome step */}
        {!(
          data.isVerifyingEmailCode ||
          (data.step === 0 && !data.isCompletingProfile)
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
