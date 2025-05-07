// app/auth/verify-phone/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"; // Added CheckCircle for success
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
        setResendTimer((prev) => Math.max(0, prev - 1)); // Ensure timer doesn't go below 0
      }, 1000);
    } else if (resendTimer === 0 && resendDisabled) {
      setResendDisabled(false);
    }
    // Cleanup interval on component unmount or when timer finishes/disabled changes
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendDisabled, resendTimer]);

  const startResendTimer = useCallback(() => {
    setResendDisabled(true);
    setResendTimer(60); // 60 seconds cooldown
  }, []);
  // --- End Resend Timer Logic ---

  // --- Input Handling (Focus and Backspace) ---
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return; // Only allow digits

      const newCode = [...code];
      newCode[index] = value.slice(-1); // Take only the last digit entered
      setCode(newCode);

      // Move focus to next input if a digit was entered and not the last input
      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  ); // Dependency on code state

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" &&
        !code[index] &&
        index > 0 &&
        inputRefs.current[index - 1]
      ) {
        // Move focus to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  ); // Dependency on code state

  useEffect(() => {
    // Focus the first input element when the component mounts
    inputRefs.current[0]?.focus();
  }, []); // Empty dependency array ensures this runs only once on mount
  // --- End Input Handling ---

  // --- API Calls ---
  const handleVerifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault(); // Prevent default form submission
      setError(null);
      setSuccessMessage(null);

      const otp = code.join("");
      if (otp.length !== 6) {
        setError("אנא הזן את הקוד בן 6 הספרות במלואו.");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/verify-phone-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: otp }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Use error message from API response if available, otherwise provide a default
          throw new Error(result.error || "אימות הקוד נכשל. אנא נסה שנית.");
        }

        setSuccessMessage("מספר הטלפון אומת בהצלחה! מעביר אותך...");
        // Update the session to reflect verification status immediately
        // This helps ensure subsequent checks (like middleware) have the latest info
        await updateSession({
          isPhoneVerified: true,
          isProfileComplete: true, // Assume profile is complete after phone verification
          status: "ACTIVE", // Assume user becomes active
        });

        // Redirect to profile or dashboard after a short delay for user feedback
        setTimeout(() => {
          router.push("/profile"); // Or your desired destination, e.g., '/dashboard'
        }, 1500); // 1.5 second delay
      } catch (err: unknown) {
        // Catch error as unknown
        // Type check the error before accessing properties
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("אירעה שגיאה בלתי צפויה במהלך האימות.");
        }
        setCode(new Array(6).fill("")); // Clear input fields on error
        inputRefs.current[0]?.focus(); // Refocus first input
      } finally {
        setIsLoading(false); // Stop loading indicator regardless of outcome
      }
    },
    [code, router, updateSession]
  ); // Dependencies for useCallback

  const handleResendCode = useCallback(async () => {
    if (resendDisabled || isResending) return; // Prevent multiple clicks
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
      startResendTimer(); // Start cooldown timer after successful request
    } catch (err: unknown) {
      // Catch error as unknown
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("אירעה שגיאה בלתי צפויה בעת שליחת קוד חדש.");
      }
    } finally {
      setIsResending(false); // Stop resend loading indicator
    }
  }, [isResending, resendDisabled, startResendTimer]); // Dependencies for useCallback
  // --- End API Calls ---

  // --- Session Handling ---
  useEffect(() => {
    // If session is loaded and phone is already verified, redirect away
    if (sessionStatus === "authenticated" && session?.user?.isPhoneVerified) {
      console.log(
        "Phone already verified, redirecting from verify-phone page."
      );
      router.push("/profile");
    }
    // If session is unauthenticated, redirect to signin
    else if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/auth/verify-phone"); // Redirect back here after login
    }
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
    // Basic masking: 050****567
    if (phone.length >= 10) {
      return `${phone.substring(0, 3)}****${phone.substring(phone.length - 3)}`;
    }
    return "your phone"; // Fallback if phone format is unexpected
  };
  // --- End Helper Function ---

  // --- Render Component ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6 text-center">
        {" "}
        {/* Added text-center */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">אימות מספר טלפון</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            {" "}
            {/* Adjusted text size */}
            כמעט סיימנו! שלחנו קוד בן 6 ספרות באמצעות WhatsApp למספר{" "}
            <span className="font-medium">{getHiddenPhone()}</span>.
            <br />
            הזן/י אותו להשלמת ההרשמה.
          </p>
        </div>
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Success Alert */}
        {successMessage && (
          <Alert
            variant="default"
            className="bg-green-50 border-green-200 text-green-700"
          >
            {" "}
            {/* Adjusted text color */}
            <CheckCircle className="h-4 w-4 text-green-600" />{" "}
            {/* Success icon */}
            <AlertTitle>הצלחה</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {/* OTP Form */}
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
            {" "}
            {/* Added sm:gap-3 */}
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el: HTMLInputElement | null) => {
                  // התחל גוף פונקציה עם {
                  inputRefs.current[index] = el; // בצע את ההשמה
                  // אין כאן return מפורש, לכן הפונקציה מחזירה void
                }}
                type="text"
                inputMode="numeric"
                pattern="\d{1}" // Enforce single digit pattern
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-md shadow-sm disabled:opacity-50" // Added styles
                disabled={isLoading}
                required
                aria-label={`Digit ${index + 1}`} // Accessibility
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={isLoading || code.join("").length !== 6}
            className="w-full py-3"
          >
            {" "}
            {/* Added py-3 */}
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              "אימות קוד"
            )}
          </Button>
        </form>
        {/* Resend and Update Links */}
        <div className="text-sm text-gray-600 space-y-2">
          {" "}
          {/* Added space-y-2 */}
          <div>
            לא קיבלת את הקוד?{" "}
            <Button
              variant="link"
              onClick={handleResendCode}
              disabled={isResending || resendDisabled}
              className="p-0 h-auto text-cyan-600 hover:text-cyan-700 disabled:text-gray-400 disabled:no-underline" // Adjusted disabled style
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
              className="text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              האם מספר הטלפון שגוי?
            </Link>
          </div>
        </div>
        {/* Optional: Link back to sign in or support */}
        <div className="mt-4 border-t pt-4">
          {" "}
          {/* Added separator */}
          <Link
            href="/auth/signin"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhonePage;
