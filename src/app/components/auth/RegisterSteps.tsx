// src/app/components/auth/RegisterSteps.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RegistrationProvider, useRegistration } from "./RegistrationContext";
import WelcomeStep from "./steps/WelcomeStep";
import BasicInfoStep from "./steps/BasicInfoStep";
import PersonalDetailsStep from "./steps/PersonalDetailsStep";
import OptionalInfoStep from "./steps/OptionalInfoStep";
import CompleteStep from "./steps/CompleteStep";
import ProgressBar from "./ProgressBar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRight, Info, MailCheck } from "lucide-react"; // הוסף MailCheck
import { Button } from "@/components/ui/button"; // הוסף Button
import { motion } from "framer-motion"; // הוסף motion

// קומפוננטה ייעודית להצגת הודעת "בדוק אימייל"
const EmailVerificationPending: React.FC = () => {
  const { data } = useRegistration(); // קבל את האימייל מהקונטקסט

  return (
    <motion.div
      className="space-y-5 text-center p-6 bg-blue-50 rounded-lg border border-blue-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <MailCheck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-blue-800">כמעט סיימנו!</h2>
      <p className="text-blue-700">
        שלחנו מייל אימות לכתובת{" "}
        <strong className="font-semibold">{data.email}</strong>.
      </p>
      <p className="text-gray-600 text-sm mt-2">
        אנא בדוק את תיבת הדואר הנכנס שלך (וגם את תיקיית הספאם/זבל) ולחץ על
        הקישור כדי לאמת את חשבונך.
      </p>
      <p className="text-gray-600 text-sm mt-2">
        לאחר אימות המייל, תוכל להתחבר ולהשלים את פרטי הפרופיל שלך.
      </p>
      <Button
        onClick={() => (window.location.href = "/auth/signin")} // הפנה להתחברות
        variant="link"
        className="mt-4 text-blue-600 hover:text-blue-800"
      >
        חזרה לדף ההתחברות
      </Button>
      {/* אפשר להוסיף כפתור resend אם ה-API תומך */}
    </motion.div>
  );
};

// Wrapper component that uses the context
const RegisterStepsContent: React.FC = () => {
  // Use the registration context hook
  const { data, initializeForCompletion, goToStep } = useRegistration();
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [showIncompleteProfileMessage, setShowIncompleteProfileMessage] =
    useState(false);
  const [initialized, setInitialized] = useState(false);

  // ... useEffects נשארים כפי שהם ...
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "complete_profile") {
      setShowIncompleteProfileMessage(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user &&
      !session.user.isProfileComplete && // או !session.user.isPhoneVerified כתנאי העיקרי
      !initialized
    ) {
      console.log(
        "Detected authenticated user with incomplete profile. Initializing completion flow."
      );
      initializeForCompletion({
        email: session.user.email || "",
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      });
      setInitialized(true);
    } else if (status === "authenticated" && session?.user?.isProfileComplete) {
      // או isPhoneVerified
      console.log(
        "RegisterSteps: User authenticated and profile complete, redirecting to /profile"
      );
      router.push("/profile");
    } else if (
      status === "unauthenticated" &&
      data.isCompletingProfile &&
      data.step !== 0 // בדוק אם אנחנו לא כבר בשלב 0 לפני שמחזירים
    ) {
      goToStep(0); // חזור לשלב ההתחלה של השלמת הפרופיל (שיופעל רק אם מחובר)
      console.log(
        "User became unauthenticated during profile completion, resetting step."
      );
    }
  }, [
    status,
    session,
    initializeForCompletion,
    initialized,
    router,
    data.step,
    goToStep,
    data.isCompletingProfile, // הוסף כתלות
  ]);

  // Function to render the current step component
  const renderStep = (): React.ReactNode => {
    // --- בדיקה חדשה: הצג הודעת אימות אימייל ---
    if (data.isEmailVerificationPending && !data.isCompletingProfile) {
      return <EmailVerificationPending />;
    }
    // --- סוף בדיקה חדשה ---

    // לוגיקה קיימת להשלמת פרופיל
    if (data.isCompletingProfile && data.step < 2) {
      console.log(
        "In completion mode but step is < 2, attempting to show step 2"
      );
      return <PersonalDetailsStep />;
    }

    // לוגיקה קיימת לבחירת שלב
    switch (data.step) {
      case 0:
        return data.isCompletingProfile ? null : <WelcomeStep />;
      case 1:
        // אם אנחנו לא משלימים פרופיל ולא ממתינים לאימייל, הצג שלב 1
        return data.isCompletingProfile ? null : <BasicInfoStep />;
      case 2:
        return <PersonalDetailsStep />;
      case 3:
        return <OptionalInfoStep />;
      case 4:
        return <CompleteStep />; // שלב זה יופיע רק בסוף תהליך *השלמת* הפרופיל
      default:
        return data.isCompletingProfile ? (
          <PersonalDetailsStep />
        ) : (
          <WelcomeStep />
        );
    }
  };

  // ... Loading state נשאר זהה ...
  if (
    status === "loading" ||
    (status === "authenticated" &&
      !initialized &&
      !session?.user?.isProfileComplete)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        טוען נתוני משתמש...
      </div>
    );
  }
  if (status === "authenticated" && session?.user?.isProfileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        מעביר לפרופיל...
      </div>
    );
  }

  const stepContent = renderStep();
  if (stepContent === null) {
    // זה קורה אם isCompletingProfile=true ו step < 2
    return (
      <div className="min-h-screen flex items-center justify-center">
        טוען שלב הבא...
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      {/* Back to home button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לדף הבית
      </button>

      {/* Branding - עדכן את הטקסט אם אנחנו במצב "בדוק אימייל" */}
      <div className="mb-6 text-center">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 text-3xl font-bold mb-2">
          {data.isEmailVerificationPending
            ? "אימות כתובת מייל"
            : data.isCompletingProfile
            ? "השלמת פרטים"
            : "הרשמה למערכת"}
        </h1>
        {/* הסתר את תיאור השלב אם אנחנו במצב "בדוק אימייל" */}
        {!data.isEmailVerificationPending && (
          <p className="text-gray-600 max-w-md mx-auto">
            {data.step === 4
              ? "כמעט סיימנו!"
              : data.isCompletingProfile
              ? `שלב ${data.step - 1} מתוך 2 - ממשיכים להתקדם.`
              : data.step === 0
              ? "ברוכים הבאים! בואו נתחיל."
              : `שלב ${data.step} מתוך 3 - נא למלא את הפרטים.`}
          </p>
        )}
      </div>

      {/* Alert Message for incomplete profile - נשאר זהה */}
      {showIncompleteProfileMessage && (
        <Alert className="mb-6 w-full max-w-md bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="ml-3">
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

      {/* Progress bar - הסתר אם אנחנו במצב "בדוק אימייל" */}
      {!data.isEmailVerificationPending && data.step >= 2 && data.step < 4 && (
        <div className="w-full max-w-md mb-6">
          <ProgressBar
            currentStep={data.isCompletingProfile ? data.step - 1 : data.step}
            totalSteps={data.isCompletingProfile ? 2 : 3}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
        {/* הסתר את הפס העליון אם אנחנו במצב "בדוק אימייל" או השאר לפי עיצוב */}
        {!data.isEmailVerificationPending && (
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
        )}
        <div className="p-6 sm:p-8">
          {stepContent}{" "}
          {/* Render the determined step or the pending message */}
        </div>
      </div>

      {/* Footer נשאר זהה */}
      <div className="mt-8 text-center text-sm text-gray-500">
        יש לך שאלות?{" "}
        <a href="/contact" className="text-cyan-600 hover:underline">
          צור קשר
        </a>
      </div>
    </div>
  );
};

// Export with provider wrapper נשאר זהה
export default function RegisterSteps() {
  return (
    <RegistrationProvider>
      <RegisterStepsContent />
    </RegistrationProvider>
  );
}
