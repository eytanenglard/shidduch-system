"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // בדיקה אם יש שגיאה מה-URL
  useEffect(() => {
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      switch (errorMessage) {
        case "CredentialsSignin":
          setError("אימייל או סיסמה אינם נכונים");
          break;
        default:
          setError("אירעה שגיאה, נסה שנית");
      }
    }
  }, [searchParams]);

  // בדיקה אם יש אימייל בפרמטרים של ה-URL
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem("last_google_user_email", emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("אנא הזן אימייל וסיסמה");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      // שמירת האימייל ב-localStorage לשימוש אפשרי בהמשך
      localStorage.setItem("last_user_email", email);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("אימייל או סיסמה אינם נכונים");
        console.error("Sign-in error:", result.error);
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

        // אם אין שאלון או שהשמירה נכשלה, נווט לפרופיל
        router.push("/profile");
      }
    } catch (err) {
      console.error("Unexpected sign-in error:", err);
      setError("אירעה שגיאה בהתחברות, נסה שנית");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError("");

      // לפני השימוש ב-signIn, שמור מידע על התחברות גוגל
      localStorage.setItem("google_auth_in_progress", "true");
      localStorage.setItem("auth_method", "google");

      // NextAuth יטפל בהפניה - עדכון ליעד החדש
      await signIn("google", { callbackUrl: "/auth/google-callback" });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("אירעה שגיאה בהתחברות עם גוגל");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>

      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            התחברות למערכת
          </h1>
          <p className="text-gray-600">
            ברוכים השבים! המשיכו למצוא את השידוך המושלם
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              אימייל
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              סיסמה
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
                placeholder="הסיסמה שלך"
              />
            </div>
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline mt-1"
              >
                שכחת סיסמה?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-lg flex items-center justify-center gap-2 relative overflow-hidden"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>מתחבר...</span>
              </>
            ) : (
              <>
                {/* Button shimmer effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                <span>התחברות</span>
              </>
            )}
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">או</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          variant="outline"
          size="lg"
          className="w-full relative border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl flex items-center justify-center gap-3 group"
        >
          {isGoogleLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent" />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
              <span className="text-gray-700 font-medium">
                התחברות עם Google
              </span>
            </>
          )}
        </Button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            אין לך חשבון עדיין?{" "}
            <Link
              href="/auth/register"
              className="text-cyan-600 font-medium hover:text-cyan-700 hover:underline"
            >
              הרשמה עכשיו
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
