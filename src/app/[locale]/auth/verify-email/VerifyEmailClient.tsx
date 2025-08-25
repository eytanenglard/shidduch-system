// src/app/[locale]/auth/verify-email/VerifyEmailClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react";
import type { VerifyEmailDict } from '@/types/dictionaries/auth';

interface VerificationState {
  status: "pending" | "verifying" | "success" | "error";
  message: string;
}

interface VerifyEmailClientProps {
    dict: VerifyEmailDict;
}

export default function VerifyEmailClient({ dict }: VerifyEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const verificationApiCallMadeRef = useRef(false);

  const [verification, setVerification] = useState<VerificationState>({ status: "pending", message: "" });
  const [isResending, setIsResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (verificationApiCallMadeRef.current) return;
    verificationApiCallMadeRef.current = true;
    
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token) {
        if (email) {
            setInfoMessage(dict.pendingMessage);
        } else {
            setVerification({ status: "error", message: dict.errors.linkInvalid });
        }
        return;
    }
    
    verifyToken(token);
  }, [searchParams, dict]);

  const verifyToken = async (token: string) => {
    setVerification({ status: "verifying", message: "" });

    if (session?.user?.email && searchParams.get('email') && session.user.email !== searchParams.get('email')) {
        setVerification({ status: "error", message: dict.errors.sessionMismatch });
        return;
    }

    try {
        const response = await fetch("/api/auth/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token, type: "EMAIL" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        setVerification({ status: "success", message: dict.successMessage });
        setTimeout(() => router.push("/auth/signin"), 2000);
    } catch (error) {
        let errorMessage = dict.errors.default;
        if (error instanceof Error) {
            if (error.message.includes("הטוקן כבר נוצל")) errorMessage = dict.errors.tokenUsed;
            else if (error.message.includes("תוקף הטוקן פג")) errorMessage = dict.errors.tokenExpired;
            else errorMessage = error.message;
        }
        setVerification({ status: "error", message: errorMessage });
    }
  };

  const handleResendVerification = async () => {
    const email = searchParams.get("email");
    if (!email) {
      setVerification({ status: "error", message: dict.errors.noEmail });
      return;
    }
    setIsResending(true);
    setVerification({ status: "pending", message: "" });
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, type: "EMAIL" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || dict.errors.resendFailed);
      setInfoMessage(dict.alerts.resendSuccess);
    } catch (error) {
      setVerification({ status: "error", message: error instanceof Error ? error.message : dict.errors.resendFailed });
    } finally {
      setIsResending(false);
    }
  };

  const emailParam = searchParams.get('email');

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6 space-y-4 text-center">
        {verification.status === "pending" && (
          <div className="space-y-4">
            <Mail className="mx-auto h-12 w-12 text-cyan-500" />
            <h2 className="text-xl font-semibold">{dict.title}</h2>
            {infoMessage && <Alert><AlertDescription>{infoMessage}</AlertDescription></Alert>}
            {emailParam && (
                <>
                    <p className="text-gray-600">{dict.emailSentTo} <span className="font-medium text-gray-800">{emailParam}</span></p>
                    <p className="text-gray-600">{dict.checkYourInbox}</p>
                    <Button onClick={handleResendVerification} disabled={isResending} className="mt-4">
                      {isResending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{dict.resendButtonLoading}</> : dict.resendButton}
                    </Button>
                </>
            )}
          </div>
        )}
        {verification.status === "verifying" && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            <p className="text-gray-600">{dict.verifyingMessage}</p>
          </div>
        )}
        {verification.status === "success" && (
          <div className="space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold text-green-600">{verification.message}</h2>
            <p className="text-gray-600">{dict.successRedirect}</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-gray-400" />
          </div>
        )}
        {verification.status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-red-600">{dict.errorMessage}</h2>
            <Alert variant="destructive"><AlertDescription>{verification.message}</AlertDescription></Alert>
            <Button onClick={() => router.push("/auth/signin")}>{dict.backToSignInButton}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}