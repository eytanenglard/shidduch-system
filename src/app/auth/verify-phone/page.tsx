// app/auth/verify-phone/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const VerifyPhonePage = () => {
  const router = useRouter();
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const [code, setCode] = useState<string[]>(new Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Resend Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendDisabled && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (resendTimer === 0 && resendDisabled) {
      setResendDisabled(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendDisabled, resendTimer]);

  const startResendTimer = useCallback(() => {
    setResendDisabled(true);
    setResendTimer(60);
  }, []);
  // --- End Resend Timer Logic ---

  // --- Input Handling (Focus and Backspace) ---
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newCode = [...code];
      newCode[index] = value.slice(-1);
      setCode(newCode);

      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" &&
        !code[index] &&
        index > 0 &&
        inputRefs.current[index - 1]
      ) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  // --- End Input Handling ---

  // --- API Calls ---
  const handleVerifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);

      const otp = code.join("");
      if (otp.length !== 6) {
        setError("אנא הזן את הקוד בן 6 הספרות במלואו.");
        return;
      }

      setIsLoading(true);
      try {
        console.log("[VerifyPhonePage] Verifying code:", otp);
        const response = await fetch("/api/auth/verify-phone-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: otp }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "אימות הקוד נכשל. אנא נסה שנית.");
        }

        console.log(
          "[VerifyPhonePage] Code verified successfully. Result:",
          result
        );
        setSuccessMessage("מספר הטלפון אומת בהצלחה! מעדכן את הפרופיל שלך..."); // Updated message

        console.log(
          "[VerifyPhonePage] Current session before update:",
          session
        );
        await updateSession({
          isPhoneVerified: true,
          isProfileComplete: true, // Assuming phone verification completes the profile
          status: "ACTIVE",
        });
        console.log(
          "[VerifyPhonePage] Session update initiated. The useEffect will handle redirection."
        );
        // The redirection will now be handled by the useEffect listening to session changes
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("אירעה שגיאה בלתי צפויה במהלך האימות.");
        }
        setCode(new Array(6).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [code, updateSession, session] // Added session to dependencies for logging, router removed
  );

  const handleResendCode = useCallback(async () => {
    if (resendDisabled || isResending) return;
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-phone-code", {
        method: "POST",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "שליחת קוד חדש נכשלה.");
      }

      setSuccessMessage("קוד חדש נשלח אליך באמצעות WhatsApp.");
      startResendTimer();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("אירעה שגיאה בלתי צפויה בעת שליחת קוד חדש.");
      }
    } finally {
      setIsResending(false);
    }
  }, [isResending, resendDisabled, startResendTimer]);
  // --- End API Calls ---

  // --- Session Handling ---
  useEffect(() => {
    console.log(
      "[VerifyPhonePage] Session useEffect triggered. Status:",
      sessionStatus,
      "Session:",
      session
    );

    if (sessionStatus === "authenticated") {
      if (session?.user?.isPhoneVerified && session?.user?.isProfileComplete) {
        console.log(
          "[VerifyPhonePage] Phone verified AND profile complete. Redirecting to /profile."
        );
        router.push("/profile");
      } else if (
        session?.user?.isPhoneVerified &&
        !session?.user?.isProfileComplete
      ) {
        // This case implies phone verification is done, but profile isn't marked complete.
        // This might happen if `isProfileComplete` is set to `true` by a later step
        // or if the `updateSession` call in `handleVerifyCode` hasn't fully propagated
        // to the `session` object *this* `useEffect` sees in this specific render cycle.
        // However, since `handleVerifyCode` sets both, we ideally shouldn't hit this
        // for long. If we do, it means the profile needs further steps.
        console.warn(
          "[VerifyPhonePage] Phone verified but profile not yet complete in session. Waiting for session update or redirecting to complete profile."
        );
        // If phone verification IS the final step, this log suggests a timing issue or
        // that the session update hasn't reflected `isProfileComplete: true` yet.
        // For now, we rely on the next session update to trigger the /profile redirect.
        // If your flow requires explicit redirection to another completion step, do it here:
        // router.push('/auth/complete-further-details');
      } else {
        console.log(
          "[VerifyPhonePage] Authenticated, but phone not verified or profile not complete."
        );
        // User is authenticated but hasn't verified phone yet (or completed profile).
        // They should remain on this page or be guided appropriately if they landed here by mistake.
      }
    } else if (sessionStatus === "unauthenticated") {
      console.log("[VerifyPhonePage] Unauthenticated. Redirecting to signin.");
      router.push("/auth/signin?callbackUrl=/auth/verify-phone");
    }
    // `session` is a dependency, so this effect runs when `session` object reference changes
    // (which happens after `updateSession` successfully updates the client-side session data).
  }, [sessionStatus, session, router]);

  // --- Loading State ---
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        <span className="ml-2">טוען נתונים...</span>
      </div>
    );
  }
  // --- End Loading State ---

  // --- Helper Function for Displaying Phone ---
  const getHiddenPhone = () => {
    const phone = session?.user?.phone;
    if (!phone) return "your phone";
    if (phone.length >= 10) {
      return `${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}`;
    }
    return "your phone";
  };
  // --- End Helper Function ---

  // --- Render Component ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">אימות מספר טלפון</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            כמעט סיימנו! שלחנו קוד בן 6 ספרות באמצעות WhatsApp למספר{" "}
            <span className="font-medium">{getHiddenPhone()}</span>.
            <br />
            הזן/י אותו להשלמת ההרשמה.
          </p>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert
            variant="default"
            className="bg-green-50 border-green-200 text-green-700"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>הצלחה</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el: HTMLInputElement | null) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="\d{1}"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-md shadow-sm disabled:opacity-50"
                disabled={isLoading}
                required
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={
              isLoading || code.join("").length !== 6 || !!successMessage
            } // Disable if already successful to prevent re-submission
            className="w-full py-3"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "אימות קוד"
            )}
          </Button>
        </form>
        <div className="text-sm text-gray-600 space-y-2">
          <div>
            לא קיבלת את הקוד?{" "}
            <Button
              variant="link"
              onClick={handleResendCode}
              disabled={isResending || resendDisabled || !!successMessage} // Disable if already successful
              className="p-0 h-auto text-cyan-600 hover:text-cyan-700 disabled:text-gray-400 disabled:no-underline"
            >
              {isResending
                ? "שולח שוב..."
                : resendDisabled
                ? `שלח קוד חדש (${resendTimer} שניות)`
                : "שלח קוד חדש"}
            </Button>
          </div>
          <div>
            <Link
              href="/auth/update-phone"
              className={`text-cyan-600 hover:text-cyan-700 hover:underline ${
                !!successMessage ? "pointer-events-none text-gray-400" : ""
              }`} // Disable link if successful
              aria-disabled={!!successMessage}
              tabIndex={!!successMessage ? -1 : undefined}
            >
              האם מספר הטלפון שגוי?
            </Link>
          </div>
        </div>
        <div className="mt-4 border-t pt-4">
          <Link
            href="/auth/signin"
            className={`text-xs text-gray-400 hover:text-gray-600 ${
              !!successMessage ? "pointer-events-none opacity-50" : ""
            }`} // Disable link if successful
            aria-disabled={!!successMessage}
            tabIndex={!!successMessage ? -1 : undefined}
          >
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhonePage;
