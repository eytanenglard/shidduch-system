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
  const { data: session } = useSession();

  const navigationTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to ensure the API call logic runs only once after the component has "settled" from StrictMode effects.
  const verificationApiCallMadeRef = useRef(false);

  const [verification, setVerification] = useState<VerificationState>({
    status: "pending",
    message: "",
  });

  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    // ... (same as before)
    const emailFromQuery = searchParams.get("email");
    if (!emailFromQuery) {
      setVerification({
        status: "error",
        message: "לא ניתן לשלוח מחדש ללא כתובת אימייל.",
      });
      return;
    }
    setIsResending(true);
    setVerification({ status: "pending", message: "" });
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
    let isEffectMounted = true; // Tracks if the current effect instance is still mounted
    const controller = new AbortController();

    const processVerification = async () => {
      if (verificationApiCallMadeRef.current) {
      
        return;
      }
      verificationApiCallMadeRef.current = true; // Mark that we are making the call

      const rawTokenParam = searchParams.get("token");
      const emailFromQuery = searchParams.get("email");
      let actualToken: string | null = null;

      if (rawTokenParam) {
        // ... (token extraction logic)
        if (
          rawTokenParam.includes("://") &&
          rawTokenParam.includes("?token=")
        ) {
          try {
            const nestedUrl = new URL(rawTokenParam);
            actualToken = nestedUrl.searchParams.get("token");
           
          } catch (error) {
            console.warn(
              "VerifyEmailPage: Could not parse rawTokenParam as a URL:",
              rawTokenParam,
              error
            );
            actualToken = rawTokenParam;
          }
        } else {
          actualToken = rawTokenParam;
        
        }
      }

      if (!actualToken) {
        if (emailFromQuery) {
         
          if (isEffectMounted)
            setVerification({
              status: "pending",
              message: "שלחנו מייל אימות לכתובת:",
            });
        } else {
         
          if (isEffectMounted)
            setVerification({
              status: "error",
              message: "קישור האימות אינו תקין (חסר מידע נדרש).",
            });
        }
        return; // Stop further processing
      }

      if (isEffectMounted)
        setVerification({ status: "verifying", message: "" });
    

      // Session check
      if (
        session?.user?.email &&
        emailFromQuery &&
        session.user.email !== emailFromQuery
      ) {
        console.warn(
          "VerifyEmailPage: User logged in with different email. Aborting."
        );
        if (isEffectMounted)
          setVerification({
            status: "error",
            message:
              "אתה מחובר עם חשבון מייל אחר. אנא התנתק ונסה שוב את הלינק.",
          });
        return;
      }

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: actualToken, type: "EMAIL" }),
          signal: controller.signal,
        });

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error(
            "VerifyEmailPage (API): Failed to parse JSON response.",
            jsonError
          );
          if (response.ok && response.status !== 204)
            throw new Error("תגובה לא תקינה מהשרת (JSON parsing failed).");
          else if (!response.ok)
            throw new Error("תגובה לא תקינה מהשרת במהלך האימות.");
        }

        if (controller.signal.aborted) {
          return;
        }

        if (!response.ok) {
          const errorMessage =
            data?.error || `שגיאה באימות החשבון (סטטוס ${response.status})`;
          throw new Error(errorMessage);
        }

        if (isEffectMounted) {
          setVerification({
            status: "success",
            message: "החשבון אומת בהצלחה!",
          });
          navigationTimeoutIdRef.current = setTimeout(() => {
            if (isEffectMounted) {
              // Check mount status again before navigating
              router.push("/auth/signin");
            } else {
            
            }
          }, 1500);
        }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          // Check if the error is due to our own abort
        
        } else if (isEffectMounted) {
          console.error(
            "VerifyEmailPage (API) [catch]: Error during API verification:",
            error
          );
          let errorMessage = "שגיאה באימות החשבון";
          if (error instanceof Error) {
            if (error.message.includes("הטוקן כבר נוצל"))
              errorMessage =
                "הטוקן הזה כבר נוצל לאימות. אם נרשמת בהצלחה, נסה להתחבר.";
            else if (error.message.includes("תוקף הטוקן פג"))
              errorMessage =
                "תוקף קישור האימות פג. אנא נסה לשלוח מייל אימות מחדש.";
            else if (error.message.includes("תגובה לא תקינה מהשרת"))
              errorMessage = error.message;
            else errorMessage = error.message;
          } else {
            errorMessage = "אירעה שגיאה לא צפויה במהלך האימות.";
          }
          setVerification({ status: "error", message: errorMessage });
        }
      }
    };

    processVerification();

    return () => {
     
      isEffectMounted = false; // Mark that this effect instance is being cleaned up
      controller.abort();
      if (navigationTimeoutIdRef.current) {
        clearTimeout(navigationTimeoutIdRef.current);
   
      }
      // Do NOT reset verificationApiCallMadeRef.current here.
      // It should ensure the logic runs only once per component true lifecycle.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, session]); // Dependencies

  // ... (JSX remains the same)
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
                  <AlertDescription>
                    {verification.message ||
                      (searchParams.get("email")
                        ? "שלחנו מייל אימות לכתובת:"
                        : "טוען מידע...")}
                  </AlertDescription>
                </Alert>
              )}
              {!verification.message && searchParams.get("email") && (
                <p>שלחנו מייל אימות לכתובת:</p>
              )}
              <p className="font-medium">
                {searchParams.get("email") || "לא צוינה כתובת"}
              </p>
              <p>אנא בדקו את תיבת הדואר שלכם ולחצו על הקישור לאימות החשבון.</p>
              {searchParams.get("email") && (
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
                החשבון אומת בהצלחה. מעביר אותך להתחברות...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-gray-400" />
            </div>
          )}
          {verification.status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{verification.message}</AlertDescription>
              </Alert>
              {searchParams.get("email") &&
                !verification.message.includes("הטוקן הזה כבר נוצל") &&
                !verification.message.includes("מחובר עם חשבון מייל אחר") &&
                (verification.message.includes("תוקף קישור האימות פג") ||
                  verification.message.includes(
                    "שגיאה בשליחת מייל האימות מחדש"
                  ) ||
                  (verification.message.includes("שגיאה באימות החשבון") &&
                    !verification.message.includes(
                      "פורמט קישור האימות אינו תקין"
                    ) &&
                    !verification.message.includes("תגובה לא תקינה מהשרת")) ||
                  verification.message.includes("תגובה לא תקינה מהשרת")) && (
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
