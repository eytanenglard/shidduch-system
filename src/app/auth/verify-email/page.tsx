"use client";

import { useState, useEffect } from "react";
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
  const { update: updateSession } = useSession();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [verification, setVerification] = useState<VerificationState>({
    status: token ? "verifying" : "pending",
    message: "",
  });
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "EMAIL" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בשליחת מייל האימות");
      }

      setVerification({
        status: "pending",
        message: "מייל אימות חדש נשלח בהצלחה",
      });
    } catch (error) {
      setVerification({
        status: "error",
        message:
          error instanceof Error ? error.message : "שגיאה בשליחת מייל האימות",
      });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      if (
        !token ||
        verification.status === "success" ||
        verification.status === "error"
      ) {
        return;
      }

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, type: "EMAIL" }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "שגיאה באימות החשבון");
        }

        setVerification({
          status: "success",
          message: "החשבון אומת בהצלחה",
        });

        await updateSession();
        setTimeout(() => {
          router.push("/auth/signin?verified=true");
        }, 2000);
      } catch (error) {
        setVerification({
          status: "error",
          message:
            error instanceof Error ? error.message : "שגיאה באימות החשבון",
        });
      }
    };

    verifyToken();
  }, [token, router, updateSession, verification.status]); // Added missing dependencies

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          {verification.status === "pending" && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">אימות חשבון</h2>
              <p>שלחנו מייל אימות לכתובת:</p>
              <p className="font-medium">{email}</p>
              <p>אנא בדקו את תיבת הדואר שלכם ולחצו על הקישור לאימות החשבון</p>

              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-4"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שולח מייל חדש...
                  </>
                ) : (
                  "שלח מייל אימות מחדש"
                )}
              </Button>
            </div>
          )}

          {verification.status === "verifying" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>מאמת את החשבון...</p>
            </div>
          )}

          {verification.status === "success" && (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-green-600">
                {verification.message}
              </h2>
              <p>מעביר אותך לדף ההתחברות...</p>
            </div>
          )}

          {verification.status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{verification.message}</AlertDescription>
              </Alert>
              <div className="flex justify-center">
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
