// src/app/components/auth/RegisterSteps.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RegistrationProvider, useRegistration } from "./RegistrationContext"; // Import RegistrationData if needed
import WelcomeStep from "./steps/WelcomeStep";
import BasicInfoStep from "./steps/BasicInfoStep";
import EmailVerificationCodeStep from "./steps/EmailVerificationCodeStep";
import PersonalDetailsStep from "./steps/PersonalDetailsStep";
import OptionalInfoStep from "./steps/OptionalInfoStep";
import CompleteStep from "./steps/CompleteStep";
import ProgressBar from "./ProgressBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Info, Loader2 } from "lucide-react"; // Added Loader2

const RegisterStepsContent: React.FC = () => {
  // Destructure all needed functions from context, including resetForm
  const { data, initializeForCompletion, goToStep, resetForm } =
    useRegistration();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  // State to track if initialization for completion has been attempted/done for the current session
  const [completionInitializedForSession, setCompletionInitializedForSession] =
    useState(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    // Show message only if directed to complete profile AND not already in completion mode
    if (reason === "complete_profile" && !data.isCompletingProfile) {
      setShowIncompleteProfileMessage(true);
    } else {
      setShowIncompleteProfileMessage(false);
    }
  }, [searchParams, data.isCompletingProfile]);

  useEffect(() => {
    console.log(
      "[RegisterSteps] Effect triggered. Session Status:",
      sessionStatus,
      "Context Data:",
      data,
      "Session User:",
      session?.user
    );

    if (sessionStatus === "authenticated" && session?.user) {
      // Scenario 1: User is authenticated, profile is complete, and phone is verified.
      if (session.user.isProfileComplete && session.user.isPhoneVerified) {
        console.log(
          "[RegisterSteps] Scenario 1: Fully complete profile. Redirecting to /profile."
        );
        router.push("/profile");
        return; // Early exit to prevent further processing
      }

      // Scenario 2: User authenticated, but profile is NOT complete.
      // Middleware likely redirected them here.
      if (
        !session.user.isProfileComplete &&
        !data.isCompletingProfile &&
        !completionInitializedForSession
      ) {
        console.log(
          "[RegisterSteps] Scenario 2: Incomplete profile. Initializing completion flow."
        );
        initializeForCompletion({
          email: session.user.email || "",
          firstName: session.user.firstName,
          lastName: session.user.lastName,
        });
        setCompletionInitializedForSession(true); // Mark that we've tried to initialize for this session
        return; // Early exit
      }

      // Scenario 3: User authenticated, phone NOT verified.
      // This should ideally be handled by middleware sending to /auth/verify-phone.
      // If they land here, it's a fallback.
      if (!session.user.isPhoneVerified && !data.isVerifyingEmailCode) {
        // also ensure not in email verification
        // If they are in a registration flow that hasn't reached phone verification, that's fine.
        // But if profile is otherwise "complete" but phone isn't, redirect.
        // This condition needs care. Let's assume if they are on step 0,1,2,3,4 of registration, it's fine.
        // If `isProfileComplete` was true but `isPhoneVerified` false, then redirect.
        if (
          session.user.isProfileComplete === true &&
          session.user.isPhoneVerified === false
        ) {
          console.log(
            "[RegisterSteps] Scenario 3: Profile marked complete but phone not verified. Redirecting to /auth/verify-phone."
          );
          router.push("/auth/verify-phone");
          return;
        }
      }

      // If user is in profile completion mode (data.isCompletingProfile is true)
      // and their session profile is still incomplete, this is the active state of filling the form.
      // No specific action needed here, the form will render.
    } else if (sessionStatus === "unauthenticated") {
      // Scenario 4: User becomes unauthenticated.
      console.log("[RegisterSteps] Scenario 4: User unauthenticated.");
      setCompletionInitializedForSession(false); // Reset for next potential login
      // If they were in any step other than Welcome, or in completion/verification mode, reset.
      if (
        data.step !== 0 ||
        data.isCompletingProfile ||
        data.isVerifyingEmailCode
      ) {
        console.log(
          "[RegisterSteps] Resetting registration due to unauthentication."
        );
        resetForm(); // Use resetForm from context
      }
    }
  }, [
    sessionStatus,
    session,
    router,
    data, // Key dependency: whole data object
    initializeForCompletion,
    resetForm, // Added resetForm
    completionInitializedForSession, // Added
  ]);

  const renderStep = (): React.ReactNode => {
    // Handle loading states first
    if (sessionStatus === "loading") {
      return (
        <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
          <p className="text-gray-600">טוען סשן...</p>
        </div>
      );
    }
    if (
      sessionStatus === "authenticated" &&
      !session?.user?.isProfileComplete &&
      !data.isCompletingProfile &&
      !completionInitializedForSession
    ) {
      // Waiting for the useEffect to initialize completion
      return (
        <div className="flex flex-col items-center justify-center p-10 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600 mb-4" />
          <p className="text-gray-600">מכין טופס השלמת פרטים...</p>
        </div>
      );
    }

    // If email verification is active (for new registrations, not profile completion)
    if (data.isVerifyingEmailCode && !data.isCompletingProfile) {
      console.log(
        "[RegisterSteps] Rendering EmailVerificationCodeStep. Current step in context:",
        data.step
      );
      return <EmailVerificationCodeStep />;
    }

    // Profile Completion Flow (user is authenticated, profile was incomplete)
    if (data.isCompletingProfile) {
      console.log(
        "[RegisterSteps] (Profile Completion Flow) Current step:",
        data.step
      );
      switch (data.step) {
        case 2: // Personal Details (first step of completion)
          return <PersonalDetailsStep />;
        case 3: // Optional Info
          return <OptionalInfoStep />;
        case 4: // Complete Confirmation Screen for profile completion
          return <CompleteStep />; // This step should guide to phone verification if not yet done.
        default:
          console.warn(
            `[RegisterSteps] (Completion) Unexpected step ${data.step}. Defaulting to PersonalDetailsStep (step 2).`
          );
          // If initializeForCompletion sets step to 2, this default should ideally not be hit often.
          // If somehow step is wrong, try to force it or show an error.
          if (data.step < 2 || data.step > 4) goToStep(2); // Try to recover
          return <PersonalDetailsStep />;
      }
    }

    // Regular New Registration Flow
    console.log(
      "[RegisterSteps] (New Registration Flow) Current step:",
      data.step
    );
    switch (data.step) {
      case 0: // Welcome
        return <WelcomeStep />;
      case 1: // Basic Info (Email, Password). EmailVerificationCodeStep is handled above.
        return <BasicInfoStep />;
      case 2: // Personal Details (after email verification for new users)
        return <PersonalDetailsStep />;
      case 3: // Optional Info
        return <OptionalInfoStep />;
      case 4: // Complete Confirmation Screen for new registration
        return <CompleteStep />; // This step should guide to phone verification.
      default:
        console.warn(
          `[RegisterSteps] (Registration) Unexpected step ${data.step}. Defaulting to WelcomeStep (step 0).`
        );
        if (data.step !== 0) goToStep(0); // Try to recover
        return <WelcomeStep />;
    }
  };

  const stepContent = renderStep();

  // --- Determine Page Title, Description, and ProgressBar ---
  let pageTitle = "הרשמה למערכת";
  let stepDescription = "ברוכים הבאים! בואו נתחיל.";
  let currentProgressBarStep = 0;
  let totalProgressBarSteps = 3; // Basic (1), Personal (2), Optional (3) for new registration
  let showProgressBar = false;

  if (data.isVerifyingEmailCode) {
    pageTitle = "אימות כתובת מייל";
    stepDescription = `כדי להמשיך, יש לאמת את כתובת המייל שלך: ${
      data.emailForVerification || data.email
    }.`;
    showProgressBar = true; // Show progress for Basic Info step
    currentProgressBarStep = 1; // Still part of "Basic Info" stage
    totalProgressBarSteps = 3;
  } else if (data.isCompletingProfile) {
    pageTitle = "השלמת פרטים";
    totalProgressBarSteps = 2; // Personal (1), Optional (2) for completion flow
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
      // CompleteStep for completion
      stepDescription = "הפרטים הושלמו! השלב הבא: אימות טלפון.";
      showProgressBar = false; // Or show full
    }
  } else {
    // New Registration Flow
    if (data.step === 0) {
      /* Welcome */ pageTitle = "ברוכים הבאים";
      stepDescription = "בואו נתחיל את המסע יחד.";
      showProgressBar = false;
    } else if (data.step === 1) {
      /* BasicInfo */
      pageTitle = "יצירת חשבון";
      stepDescription = "שלב 1 מתוך 3: פרטי התחברות.";
      currentProgressBarStep = 1;
      showProgressBar = true;
    } else if (data.step === 2) {
      /* PersonalDetails */
      pageTitle = "פרטים אישיים";
      stepDescription = "שלב 2 מתוך 3: קצת עליך.";
      currentProgressBarStep = 2;
      showProgressBar = true;
    } else if (data.step === 3) {
      /* OptionalInfo */
      pageTitle = "מידע נוסף";
      stepDescription = "שלב 3 מתוך 3: עוד קצת פרטים (אופציונלי).";
      currentProgressBarStep = 3;
      showProgressBar = true;
    } else if (data.step === 4) {
      /* CompleteStep for new registration */
      pageTitle = "סיום הרשמה ראשונית";
      stepDescription = "הפרטים נשמרו! השלב הבא: אימות טלפון.";
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
        {!(
          (
            data.isVerifyingEmailCode ||
            (data.step === 0 && !data.isCompletingProfile)
          ) // No top bar on welcome or if verifying email
        ) &&
          data.step !== 4 && ( // Also no top bar on complete step
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
