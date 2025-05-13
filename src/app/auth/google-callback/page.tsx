// src/app/auth/google-callback/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, getSession } from "next-auth/react";
import {
  RegistrationProvider,
  useRegistration,
} from "@/app/components/auth/RegistrationContext";
import RegisterSteps from "@/app/components/auth/RegisterSteps";
import { User } from "@/types/next-auth";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const GoogleCallbackContent = () => {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "register" | "error"
  >("loading");
  const [error, setError] = useState<string>("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { setGoogleSignup, data: registrationData } = useRegistration();

  const checkSessionAndProceed = useCallback(async () => {
    console.log("Attempting to fetch session manually using getSession()...");
    setStatus("loading");
    setError("");

    try {
      const session = await getSession();
      console.log("getSession() result:", session);
      setSessionChecked(true);

      if (session?.user) {
        const currentUser = session.user as User;
        console.log("Manual session check successful. User data:", {
          id: currentUser.id,
          email: currentUser.email,
          isProfileComplete: currentUser.isProfileComplete,
        });

        if (currentUser.isProfileComplete) {
          console.log(
            `User ${currentUser.email} profile complete. Setting status to 'success' then redirecting to /profile.`
          );
          setStatus("success");
          setTimeout(() => {
            console.log("Redirecting to /profile after delay.");
            router.replace("/profile");
          }, 3000);
        } else {
          console.log(
            `User ${currentUser.email} profile incomplete. Initializing registration steps.`
          );
          if (
            currentUser.email &&
            currentUser.firstName &&
            currentUser.lastName
          ) {
            const googleData = {
              email: currentUser.email,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
            };
            console.log("Calling setGoogleSignup with:", googleData);
            try {
              setGoogleSignup(googleData);
              console.log(
                "setGoogleSignup called successfully. Setting status to 'register'."
              );
              setStatus("register");
            } catch (contextError) {
              console.error("Error calling setGoogleSignup:", contextError);
              setError("שגיאה באתחול תהליך ההרשמה.");
              setStatus("error");
            }
          } else {
            console.error("Missing essential Google data after getSession.");
            setError("פרטים חסרים מ-Google. נסה שוב או הירשם ידנית.");
            setStatus("error");
          }
        }
      } else {
        console.error(
          "Manual session check failed (getSession returned null or no user)."
        );
        if (retryCount < 3) {
          console.log(`Retrying session check (${retryCount + 1}/3)...`);
          setRetryCount(retryCount + 1);
          setTimeout(() => checkSessionAndProceed(), 1000);
          return;
        }
        setError("לא ניתן היה לאמת את ההתחברות מול השרת. נסה שוב.");
        setStatus("error");
      }
    } catch (err) {
      console.error("Error calling getSession():", err);
      setError("אירעה שגיאה בבדיקת ההתחברות מול השרת.");
      setStatus("error");
    }
  }, [router, setGoogleSignup, retryCount]);

  useEffect(() => {
    if (!sessionChecked) {
      checkSessionAndProceed();
    }
  }, [sessionChecked, checkSessionAndProceed]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-cyan-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">
          מאמת התחברות Google...
        </h2>
        <p className="text-gray-500 mt-2">אנא המתן...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
          <div className="text-center text-red-500 mb-4">
            <XCircle className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-xl font-bold">שגיאה בתהליך</h2>
          </div>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/auth/signin")}
              className="py-2 px-6 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-lg shadow-md transition-all duration-300"
            >
              חזרה להתחברות
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md w-full">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            התחברת בהצלחה עם Google!
          </h1>
          <p className="text-gray-600 mt-3">
            החשבון שלך אומת, מיד תועבר לפרופיל שלך.
          </p>
          <p className="text-gray-500 mt-1">אנא המתן...</p>
          <Loader2 className="h-6 w-6 text-gray-400 animate-spin mx-auto mt-5" />
        </div>
      </div>
    );
  }

  if (status === "register") {
    console.log(
      "Rendering RegisterSteps component via 'register' status. Current registration step:",
      registrationData.step
    );
    return <RegisterSteps />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      מצב לא צפוי...
    </div>
  );
};

export default function GoogleCallbackPage() {
  return (
    <SessionProvider>
      <RegistrationProvider>
        <GoogleCallbackContent />
      </RegistrationProvider>
    </SessionProvider>
  );
}
