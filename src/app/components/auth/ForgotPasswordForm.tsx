// src/app/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation"; // <--- 1. Import useRouter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const router = useRouter(); // <--- 2. Initialize router
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The success message might not be seen if we redirect immediately.
  // Consider removing it or using a toast notification system for a brief message before redirect.
  // const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // setSuccessMessage(null); // If redirecting, this isn't needed

    if (!email) {
      setError("אנא הזן את כתובת המייל שלך.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "אירעה שגיאה בבקשת איפוס הסיסמה.");
      }

      // 3. Redirect to the reset password page on success
      // The API's success message (data.message) is generic for security and won't be shown here.
      // The ResetPasswordForm will guide the user.
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
      
      // setEmail(""); // Clearing email is not strictly necessary as we are navigating away

    } catch (err) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה לא צפויה.");
      setIsLoading(false); // Ensure isLoading is set to false in case of an error before navigation
    }
    // setIsLoading(false); // If navigation occurs, this line might not be reached or necessary.
                         // It's important that isLoading is false if an error occurs and we don't navigate.
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            שכחת סיסמה?
          </h1>
          <p className="text-gray-600 text-sm">
            אין בעיה! הזן את כתובת המייל שלך למטה, ואם היא קיימת במערכת, נשלח לך קוד לאיפוס הסיסמה.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success message is removed because we are redirecting. 
            If you want to show a message on the next page, 
            you could pass a query param like ?request_sent=true
        */}
        {/*
        {successMessage && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-700">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>הבקשה נשלחה</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        */}
        
        {/* Form is always shown unless you conditionally hide it during loading/after success,
            but since we redirect, this logic can be simpler.
        */}
        {/* {!successMessage && ( // This condition can be removed if successMessage state is removed */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="email-forgot" className="block text-sm font-medium text-gray-700">
                כתובת מייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  id="email-forgot"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>שולח...</span>
                </>
              ) : (
                "שלח בקשה לאיפוס סיסמה" // Changed text slightly
              )}
            </Button>
          </form>
        {/* )} */}

        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
          >
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}