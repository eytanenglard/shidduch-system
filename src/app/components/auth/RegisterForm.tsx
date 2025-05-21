"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gender } from "@prisma/client";
import { signIn } from "next-auth/react";

interface RegistrationFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender;
  birthDate: string;
  maritalStatus?: string;
  height?: number;
  occupation?: string;
  education?: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (value: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(value)) {
      setPasswordError(
        "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validatePassword(password)) {
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: RegistrationFormData = {
      email: formData.get("email") as string,
      password: password,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      gender: formData.get("gender") as Gender,
      birthDate: formData.get("birthDate") as string,
      maritalStatus: formData.get("maritalStatus") as string,
      height: formData.get("height")
        ? Number(formData.get("height"))
        : undefined,
      occupation: formData.get("occupation") as string,
      education: formData.get("education") as string,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "אירעה שגיאה בהרשמה");
      }

      // העברה לדף אימות המייל
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "אירעה שגיאה בהרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError("");

      // ניסיון התחברות עם גוגל - הסרנו את callbackUrl
      // NextAuth יטפל בהפניה באמצעות פונקציית callback.redirect
      await signIn("google");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("אירעה שגיאה בהתחברות עם גוגל");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* השארנו את כל השדות הקיימים */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            שם פרטי
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            שם משפחה
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            טלפון נייד
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            required
            pattern="[0-9]{10}"
            placeholder="0501234567 - לדוגמא"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית, אות קטנה
            באנגלית ומספר
          </p>
          {passwordError && (
            <div className="text-red-500 text-sm">{passwordError}</div>
          )}
        </div>

        {/* שאר השדות */}
        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700"
          >
            מגדר
          </label>
          <select
            name="gender"
            id="gender"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">בחר מגדר</option>
            <option value="MALE">זכר</option>
            <option value="FEMALE">נקבה</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="birthDate"
            className="block text-sm font-medium text-gray-700"
          >
            תאריך לידה
          </label>
          <input
            type="date"
            name="birthDate"
            id="birthDate"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="maritalStatus"
            className="block text-sm font-medium text-gray-700"
          >
            מצב משפחתי
          </label>
          <select
            name="maritalStatus"
            id="maritalStatus"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">בחר מצב משפחתי</option>
            <option value="רווק/ה">רווק/ה</option>
            <option value="גרוש/ה">גרוש/ה</option>
            <option value="אלמן/ה">אלמן/ה</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700"
          >
            גובה (בסמ)
          </label>
          <input
            type="number"
            name="height"
            id="height"
            min="120"
            max="220"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="occupation"
            className="block text-sm font-medium text-gray-700"
          >
            עיסוק
          </label>
          <input
            type="text"
            name="occupation"
            id="occupation"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="education"
            className="block text-sm font-medium text-gray-700"
          >
            השכלה
          </label>
          <input
            type="text"
            name="education"
            id="education"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isLoading || !!passwordError}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "נרשם..." : "הרשמה"}
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
              הרשמה עם גוגל
            </>
          )}
        </div>
      </button>
    </div>
  );
}
