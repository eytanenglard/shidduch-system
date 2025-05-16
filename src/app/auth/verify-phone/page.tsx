// app/auth/verify-phone/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const OTP_LENGTH = 6;

const VerifyPhonePage = () => {
  const router = useRouter();
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const [code, setCode] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
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
    setResendTimer(60); // 60 שניות
  }, []);
  // --- End Resend Timer Logic ---

  // --- Input Handling (Focus and Backspace) ---
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return; // אפשר רק ספרות

      const newCode = [...code];
      newCode[index] = value.slice(-1); // קח רק את התו האחרון
      setCode(newCode);

      // העבר פוקוס ל-input הבא אם יש ערך והוא לא האחרון
      if (value && index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Backspace" &&
        !code[index] && // אם ה-input הנוכחי ריק
        index > 0 && // והוא לא הראשון
        inputRefs.current[index - 1] // ויש input קודם
      ) {
        inputRefs.current[index - 1]?.focus(); // העבר פוקוס אחורה
      }
    },
    [code]
  );

  // התמקדות באינפוט הראשון בטעינה
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);
  // --- End Input Handling ---

  // --- API Calls ---
  const handleVerifyCode = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccessMessage(null);

      const otp = code.join("");
      if (otp.length !== OTP_LENGTH) {
        setError(`אנא הזן את הקוד בן ${OTP_LENGTH} הספרות במלואו.`);
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
        setSuccessMessage("מספר הטלפון אומת בהצלחה! מעדכן את הפרופיל שלך...");

        console.log(
          "[VerifyPhonePage] Current session before update:",
          session
        );
        await updateSession({
          isPhoneVerified: true,
          isProfileComplete: true, // הנחה שאימות טלפון משלים את הפרופיל
          status: "ACTIVE", // עדכון סטטוס המשתמש אם רלוונטי
        });
        console.log(
          "[VerifyPhonePage] Session update initiated. Performing full page redirect to /profile."
        );

        // ** השינוי המרכזי: הפנייה עם טעינה מלאה של הדף **
        // זה נותן ל-cookie של הסשן/טוקן להתעדכן כראוי לפני שה-middleware רואה אותו.
        window.location.href = "/profile";
        // אין צורך להמשיך את הפונקציה או לשנות isLoading, כי הדף יטען מחדש.
        // setIsLoading(false) יקרה ב-catch אם יש שגיאה.
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "אירעה שגיאה בלתי צפויה במהלך האימות.";
        console.error(
          "[VerifyPhonePage] Error during verification:",
          errorMessage,
          err
        );
        setError(errorMessage);
        setCode(new Array(OTP_LENGTH).fill("")); // נקה שדות
        if (inputRefs.current[0]) inputRefs.current[0]?.focus(); // החזר פוקוס
        setIsLoading(false); // חשוב להחזיר את זה במקרה של שגיאה
      }
    },
    [code, updateSession, session] // 'router' לא נחוץ כאן יותר עבור ההפניה הראשית
  );

  const handleResendCode = useCallback(async () => {
    if (resendDisabled || isResending) return;
    setError(null);
    setSuccessMessage(null);
    setIsResending(true);

    try {
      console.log("[VerifyPhonePage] Resending code...");
      const response = await fetch("/api/auth/resend-phone-code", {
        method: "POST", // אין צורך ב-body אם ה-API לא מצפה לו
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "שליחת קוד חדש נכשלה.");
      }

      setSuccessMessage("קוד חדש נשלח אליך באמצעות WhatsApp.");
      startResendTimer(); // הפעל טיימר
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בלתי צפויה בעת שליחת קוד חדש.";
      console.error(
        "[VerifyPhonePage] Error resending code:",
        errorMessage,
        err
      );
      setError(errorMessage);
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
      // אם המשתמש כבר אימת טלפון והשלים פרופיל (למשל, נכנס לדף הזה בטעות שוב), הפנה אותו.
      // ההפניה הראשית לאחר אימות מוצלח תתבצע מ-handleVerifyCode באמצעות window.location.href.
      // ה-useEffect הזה מטפל במקרים "קצה" או בטעינה ישירה של הדף.
      if (session?.user?.isPhoneVerified && session?.user?.isProfileComplete) {
        // ודא שאנחנו עדיין בדף אימות הטלפון לפני הפנייה כדי למנוע לולאות אם ההפניה מ-handleVerifyCode מתעכבת
        if (window.location.pathname === "/auth/verify-phone") {
          console.log(
            "[VerifyPhonePage] User already verified and on verify-phone page. Redirecting to /profile via router.push."
          );
          router.push("/profile");
        }
      } else if (session?.user && !session.user.isPhoneVerified) {
        // המשתמש מאומת אבל הטלפון עדיין לא מאומת. הוא צריך להישאר כאן.
        console.log(
          "[VerifyPhonePage] Authenticated, but phone not yet verified. User should stay on this page."
        );
        // ייתכן שכאן צריך לשלוח קוד אוטומטית אם הוא נכנס לדף הזה והטלפון לא מאומת,
        // תלוי בזרימה הרצויה. כרגע, המשתמש יצטרך ללחוץ "שלח קוד חדש" אם צריך.
      }
    } else if (sessionStatus === "unauthenticated") {
      console.log("[VerifyPhonePage] Unauthenticated. Redirecting to signin.");
      router.push("/auth/signin?callbackUrl=/auth/verify-phone");
    }
  }, [sessionStatus, session, router]);

  // --- Loading State ---
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
        <div className="flex items-center">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          <span className="ml-2 text-gray-700">טוען נתונים...</span>
        </div>
      </div>
    );
  }
  // --- End Loading State ---

  // --- Helper Function for Displaying Phone ---
  const getHiddenPhone = () => {
    const phone = session?.user?.phone;
    if (!phone) return "הטלפון שלך";
    if (phone.length >= 10) {
      return `${phone.substring(0, 3)}••••${phone.substring(phone.length - 3)}`;
    }
    return "הטלפון שלך";
  };
  // --- End Helper Function ---

  // --- Render Component ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">אימות מספר טלפון</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            כמעט סיימנו! שלחנו קוד בן {OTP_LENGTH} ספרות באמצעות WhatsApp למספר{" "}
            <span className="font-medium text-gray-700">
              {getHiddenPhone()}
            </span>
            .
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
        {successMessage &&
          !error && ( // הצג הודעת הצלחה רק אם אין שגיאה
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
                type="text" // השאר טקסט כדי לאפשר טיפול טוב יותר בקלט ו-backspace
                inputMode="numeric" // עוזר למקלדת בנייד
                pattern="\d{1}" // ולידציה בסיסית של הדפדפן (אופציונלי)
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:bg-gray-100"
                disabled={isLoading || !!successMessage} // נטרל גם אם יש הודעת הצלחה למניעת שליחה חוזרת
                required
                aria-label={`ספרה ${index + 1}`}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={
              isLoading ||
              code.join("").length !== OTP_LENGTH ||
              !!successMessage
            }
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            ) : (
              "אימות קוד"
            )}
          </Button>
        </form>
        <div className="text-sm text-gray-600 space-y-2">
          <div>
            לא קיבלת את הקוד?{" "}
            <Button
              type="button"
              variant="link"
              onClick={handleResendCode}
              disabled={isResending || resendDisabled || !!successMessage}
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
              href="/auth/update-phone" // ודא שהנתיב הזה קיים ומטופל
              className={`text-cyan-600 hover:text-cyan-700 hover:underline ${
                !!successMessage || isLoading
                  ? "pointer-events-none text-gray-400"
                  : ""
              }`}
              aria-disabled={!!successMessage || isLoading}
              tabIndex={!!successMessage || isLoading ? -1 : undefined}
            >
              האם מספר הטלפון שגוי?
            </Link>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <Link
            href="/auth/signin"
            className={`text-xs text-gray-500 hover:text-gray-600 ${
              !!successMessage || isLoading
                ? "pointer-events-none opacity-50"
                : ""
            }`}
            aria-disabled={!!successMessage || isLoading}
            tabIndex={!!successMessage || isLoading ? -1 : undefined}
          >
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhonePage;
