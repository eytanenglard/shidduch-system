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
import { CheckCircle, Loader2, XCircle } from "lucide-react"; // Added XCircle for error

const GoogleCallbackContent = () => {
  const router = useRouter();
  // Use a state to manage the overall status instead of multiple booleans
  const [status, setStatus] = useState<
    "loading" | "success" | "register" | "error"
  >("loading");
  const [error, setError] = useState<string>("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const { setGoogleSignup, data: registrationData } = useRegistration();

  const checkSessionAndProceed = useCallback(async () => {
    console.log("Attempting to fetch session manually using getSession()...");
    setStatus("loading"); // Reset status
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
          setStatus("success"); // Set status to success

          // Redirect after a delay
          setTimeout(() => {
            console.log("Redirecting to /profile after delay.");
            router.replace("/profile");
          }, 3000); // 3-second delay
        } else {
          // Profile is Incomplete - Proceed to registration steps
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
              setStatus("register"); // Set status to register
            } catch (contextError) {
              console.error("Error calling setGoogleSignup:", contextError);
              setError("שגיאה באתחול תהליך ההרשמה.");
              setStatus("error"); // Set status to error
            }
          } else {
            console.error("Missing essential Google data after getSession.");
            setError("פרטים חסרים מ-Google. נסה שוב או הירשם ידנית.");
            setStatus("error"); // Set status to error
          }
        }
      } else {
        console.error(
          "Manual session check failed (getSession returned null or no user)."
        );
        setError("לא ניתן היה לאמת את ההתחברות מול השרת. נסה שוב.");
        setStatus("error"); // Set status to error
      }
    } catch (err) {
      console.error("Error calling getSession():", err);
      setError("אירעה שגיאה בבדיקת ההתחברות מול השרת.");
      setStatus("error"); // Set status to error
    }
    // Removed setIsLoading(false) - status state handles it now
  }, [router, setGoogleSignup]);

  // Fetch session only once
  useEffect(() => {
    if (!sessionChecked) {
      checkSessionAndProceed();
    }
  }, [sessionChecked, checkSessionAndProceed]); // Removed initialStatus dependency

  // --- Render Logic based on status ---

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-cyan-600 mb-4" />
        {/* Optional: Use the fancy border spinner if preferred
         <div className="mb-4 w-16 h-16 border-4 border-t-4 border-cyan-500 border-t-pink-500 rounded-full animate-spin"></div> */}
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
    // Profile was incomplete, setGoogleSignup was called, render RegisterSteps
    console.log(
      "Rendering RegisterSteps component via 'register' status. Current registration step:",
      registrationData.step
    );
    return <RegisterSteps />;
  }

  // Fallback case (should ideally not be reached if status logic is correct)
  return (
    <div className="min-h-screen flex items-center justify-center">
      מצב לא צפוי...
    </div>
  );
};

// Export remains the same
export default function GoogleCallbackPage() {
  return (
    <SessionProvider>
      <RegistrationProvider>
        <GoogleCallbackContent />
      </RegistrationProvider>
    </SessionProvider>
  );
}
