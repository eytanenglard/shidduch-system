// src/components/auth/SignInForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
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
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("אירעה שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
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
  );
}
