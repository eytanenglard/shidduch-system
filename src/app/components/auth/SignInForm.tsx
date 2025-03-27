// src/components/auth/SignInForm.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // בדיקה אם יש יעד הפניה בפרמטרים של ה-URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

    // שמירת האימייל ב-localStorage אם קיים
    if (email) {
      localStorage.setItem("last_google_user_email", email);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // שמירת האימייל ב-localStorage לשימוש אפשרי בהמשך
      localStorage.setItem("last_user_email", email);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // בדיקה אם יש שאלון זמני
        const tempQuestionnaire = localStorage.getItem("tempQuestionnaire");

        if (tempQuestionnaire) {
          try {
            const response = await fetch("/api/questionnaire", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: tempQuestionnaire,
            });

            if (response.ok) {
              localStorage.removeItem("tempQuestionnaire");
              localStorage.removeItem("questionnaireProgress");
              router.push("/questionnaire/complete");
              return;
            }
          } catch (error) {
            console.error("Error saving questionnaire:", error);
          }
        }

        // אם אין שאלון או שהשמירה נכשלה, נווט לדשבורד
        router.push("/profile");
        router.refresh();
      }
    } catch {
      setError("אירעה שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError("");

      // לפני השימוש ב-signIn, שמור את הנתון שהתחברות עם גוגל מתבצעת
      localStorage.setItem("google_auth_in_progress", "true");

      // החלפת כל המידע מה-localStorage למצב Google בלבד
      localStorage.setItem("auth_method", "google");

      // ניסיון התחברות עם גוגל
      await signIn("google", { callbackUrl: "/auth/complete-registration" });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("אירעה שגיאה בהתחברות עם גוגל");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            אימייל
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            סיסמה
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "מתחבר..." : "התחבר"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">או</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <div className="mr-2">
          {isGoogleLoading ? (
            <span>מתחבר...</span>
          ) : (
            <>
              <svg
                className="h-5 w-5 ml-2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              התחבר עם גוגל
            </>
          )}
        </div>
      </button>
    </div>
  );
}
