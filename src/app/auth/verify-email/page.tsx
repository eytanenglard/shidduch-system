// /auth/verify-email/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface VerificationState {
  status: "pending" | "verifying" | "success" | "error";
  message: string;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();

  const rawTokenParam = searchParams.get("token");
  const emailFromQuery = searchParams.get("email");

  let actualToken: string | null = null;
  if (rawTokenParam) {
    if (rawTokenParam.includes("://") && rawTokenParam.includes("?token=")) {
      try {
        const nestedUrl = new URL(rawTokenParam);
        actualToken = nestedUrl.searchParams.get("token");
      } catch (e) {
        console.warn(
          "VerifyEmailPage: Could not parse rawTokenParam as a URL, assuming it's the token itself:",
          rawTokenParam,
          e
        );
        actualToken = rawTokenParam;
      }
    } else {
      actualToken = rawTokenParam;
    }
  }

  const [verification, setVerification] = useState<VerificationState>(() => {
    if (actualToken) {
      return { status: "verifying", message: "" };
    }
    if (emailFromQuery) {
      return { status: "pending", message: "" };
    }
    return {
      status: "error",
      message: "קישור האימות אינו תקין (חסר מידע נדרש).",
    };
  });

  const [isResending, setIsResending] = useState(false);
  const verificationAttemptCompletedOrFailedRef = useRef(false);

  const handleResendVerification = async () => {
    if (!emailFromQuery) {
      setVerification({
        status: "error",
        message: "לא ניתן לשלוח מחדש ללא כתובת אימייל.",
      });
      return;
    }
    setIsResending(true);
    setVerification((prev) => ({ ...prev, message: "" }));
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFromQuery, type: "EMAIL" }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "שגיאה בשליחת מייל האימות מחדש");
      setVerification({
        status: "pending",
        message: "מייל אימות חדש נשלח בהצלחה. אנא בדוק את תיבת הדואר.",
      });
    } catch (error) {
      setVerification({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "שגיאה בשליחת מייל האימות מחדש",
      });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let navigationTimeoutId: NodeJS.Timeout | null = null; // Define timeout ID here

    const performVerification = async () => {
      if (!actualToken) {
        if (rawTokenParam && verification.status !== "error") {
          console.error(
            "VerifyEmailPage (performVerification): No actual token extracted from rawTokenParam:",
            rawTokenParam
          );
          setVerification({
            status: "error",
            message: "פורמט קישור האימות אינו תקין (בעיה בחילוץ הטוקן).",
          });
          verificationAttemptCompletedOrFailedRef.current = true;
        }
        return;
      }

      if (
        session?.user?.email &&
        emailFromQuery &&
        session.user.email !== emailFromQuery
      ) {
        console.warn(
          "VerifyEmailPage (performVerification): User logged in with a different email. Preventing verification."
        );
        setVerification({
          status: "error",
          message: "אתה מחובר עם חשבון מייל אחר. אנא התנתק ונסה שוב את הלינק.",
        });
        verificationAttemptCompletedOrFailedRef.current = true;
        return;
      }

      console.log(
        "VerifyEmailPage (performVerification): Attempting to verify with token:",
        actualToken
      );
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: actualToken, type: "EMAIL" }),
          signal,
        });

        const data = await response.json();

        if (signal.aborted) {
          console.log(
            "VerifyEmailPage (performVerification): Verification fetch aborted by signal. Resetting attempt flag."
          );
          verificationAttemptCompletedOrFailedRef.current = false;
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || "שגיאה באימות החשבון");
        }

        console.log(
          "VerifyEmailPage (performVerification): Verification successful via API."
        );
        verificationAttemptCompletedOrFailedRef.current = true;
        if (!signal.aborted) {
          setVerification({
            status: "success",
            message: "החשבון אומת בהצלחה!",
          });

          console.log(
            "VerifyEmailPage (performVerification): Attempting to update session..."
          );
          await updateSession();
          console.log(
            "VerifyEmailPage (performVerification): Session update triggered."
          );

          // Check signal again before setting timeout, as updateSession might trigger re-render and abort
          if (!signal.aborted) {
            navigationTimeoutId = setTimeout(() => {
              console.log(
                "VerifyEmailPage (performVerification): Navigating to '/' after timeout."
              );
              router.push("/");
            }, 1500);
          } else {
            console.log(
              "VerifyEmailPage (performVerification): Navigation setTimeout not set due to signal abortion prior to timeout setup."
            );
          }
        } else {
          console.log(
            "VerifyEmailPage (performVerification): Success processing aborted by signal after fetch."
          );
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "AbortError"
        ) {
          console.log(
            "VerifyEmailPage (performVerification) [catch]: Verification fetch aborted. Resetting attempt flag to allow retry."
          );
          verificationAttemptCompletedOrFailedRef.current = false;
          return;
        }

        console.error(
          "VerifyEmailPage (performVerification) [catch]: Error during API verification:",
          error
        );
        verificationAttemptCompletedOrFailedRef.current = true;
        if (!signal.aborted) {
          let errorMessage = "שגיאה באימות החשבון";
          if (error instanceof Error) {
            if (error.message.includes("הטוקן כבר נוצל")) {
              errorMessage =
                "הטוקן הזה כבר נוצל לאימות. אם נרשמת בהצלחה, נסה להתחבר.";
            } else if (error.message.includes("תוקף הטוקן פג")) {
              errorMessage =
                "תוקף קישור האימות פג. אנא נסה לשלוח מייל אימות מחדש.";
            } else {
              errorMessage = error.message;
            }
          }
          setVerification({ status: "error", message: errorMessage });
        } else {
          console.log(
            "VerifyEmailPage (performVerification) [catch]: Error processing aborted by signal after fetch."
          );
        }
      }
    };

    if (verification.status === "verifying" && actualToken) {
      if (!verificationAttemptCompletedOrFailedRef.current) {
        console.log(
          "VerifyEmailPage (useEffect): Calling performVerification (attempt ref is false)."
        );
        performVerification();
      } else {
        console.log(
          "VerifyEmailPage (useEffect): Skipping performVerification (attempt ref is true - already completed/failed)."
        );
      }
    } else if (
      verification.status === "verifying" &&
      !actualToken &&
      rawTokenParam
    ) {
      console.error(
        "VerifyEmailPage (useEffect): Status 'verifying' but no actualToken (extraction failed). Setting to error."
      );
      setVerification({
        status: "error",
        message: "פורמט קישור האימות אינו תקין.",
      });
      verificationAttemptCompletedOrFailedRef.current = true;
    }

    return () => {
      console.log(
        "VerifyEmailPage (useEffect cleanup): Aborting any in-progress fetch and clearing navigation timeout."
      );
      controller.abort();
      if (navigationTimeoutId) {
        // Clear the timeout if it was set
        clearTimeout(navigationTimeoutId);
      }
    };
  }, [
    actualToken,
    emailFromQuery,
    router,
    updateSession,
    session,
    verification.status,
    rawTokenParam,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          {verification.status === "pending" && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">אימות חשבון</h2>
              {verification.message && (
                <Alert
                  variant="default"
                  className="text-sm text-center bg-blue-50 border-blue-200 text-blue-800"
                >
                  <AlertDescription>{verification.message}</AlertDescription>
                </Alert>
              )}
              <p>שלחנו מייל אימות לכתובת:</p>
              <p className="font-medium">
                {emailFromQuery || "לא צוינה כתובת"}
              </p>
              <p>אנא בדקו את תיבת הדואר שלכם ולחצו על הקישור לאימות החשבון.</p>
              {emailFromQuery && (
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="mt-4"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> שולח
                      מייל חדש...
                    </>
                  ) : (
                    "שלח מייל אימות מחדש"
                  )}
                </Button>
              )}
            </div>
          )}
          {verification.status === "verifying" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600">מאמת את החשבון...</p>
            </div>
          )}
          {verification.status === "success" && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-green-600">
                {verification.message}
              </h2>
              <p className="text-gray-600">
                החשבון אומת בהצלחה. מעביר אותך להמשך...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-gray-400" />
            </div>
          )}
          {verification.status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{verification.message}</AlertDescription>
              </Alert>
              {emailFromQuery &&
                !verification.message.includes("הטוקן הזה כבר נוצל") &&
                !verification.message.includes("מחובר עם חשבון מייל אחר") &&
                (verification.message.includes("תוקף קישור האימות פג") ||
                  verification.message.includes(
                    "שגיאה בשליחת מייל האימות מחדש"
                  ) ||
                  (verification.message.includes("שגיאה באימות החשבון") &&
                    !verification.message.includes(
                      "פורמט קישור האימות אינו תקין"
                    ))) && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      variant="outline"
                      className="mt-2"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> שולח
                          מייל חדש...
                        </>
                      ) : (
                        "נסה לשלוח מייל אימות מחדש"
                      )}
                    </Button>
                  </div>
                )}
              <div className="flex justify-center mt-4">
                <Button onClick={() => router.push("/auth/signin")}>
                  חזור לדף ההתחברות
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
