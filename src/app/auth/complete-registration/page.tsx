// src/app/auth/complete-registration/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import CompleteRegistrationForm from "@/app/components/auth/CompleteRegistrationForm";

export default function CompleteRegistrationPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    // שמירת נתונים נוספים מה-URL לשימוש בהמשך
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (email) {
      localStorage.setItem("last_google_user_email", email);
      console.log("Saved email from URL params:", email);
    }

    if (userId) {
      localStorage.setItem("last_user_id", userId);
      console.log("Saved user ID from URL params:", userId);
    }

    // בדיקה אם יש סמן שמציין שהגענו מתהליך אימות של גוגל
    const googleAuth = localStorage.getItem("google_auth_in_progress");
    if (googleAuth) {
      console.log("Google auth process was detected");

      // בדיקת סשן
      if (status === "authenticated" && session) {
        console.log("Authenticated session exists:", {
          id: session.user.id,
          email: session.user.email,
        });

        // שמירת נתוני משתמש לשימוש עתידי
        localStorage.setItem("last_google_user_email", session.user.email);
        localStorage.setItem("last_user_id", session.user.id);
      }

      // ניקוי הסמן
      localStorage.removeItem("google_auth_in_progress");
    }
  }, [searchParams, session, status]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">השלמת פרטי הרשמה</h1>
          <p className="mt-2 text-gray-600">
            כדי להשלים את תהליך ההרשמה, אנא מלא את הפרטים הבאים
          </p>
        </div>

        <div className="bg-white p-8 shadow rounded-lg">
          <CompleteRegistrationForm />
        </div>
      </div>
    </div>
  );
}
