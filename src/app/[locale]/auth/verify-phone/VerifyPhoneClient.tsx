// src/app/[locale]/auth/verify-phone/VerifyPhoneClient.tsx
'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { VerifyPhoneDict } from '@/types/dictionaries/auth';

const OTP_LENGTH = 6;

interface VerifyPhoneClientProps {
  dict: VerifyPhoneDict;
}

const VerifyPhoneClient = ({ dict }: VerifyPhoneClientProps) => {
  const router = useRouter();
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();
  const [code, setCode] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendDisabled && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
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

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newCode = [...code];
      newCode[index] = value.slice(-1);
      setCode(newCode);
      if (value && index < OTP_LENGTH - 1)
        inputRefs.current[index + 1]?.focus();
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handleVerifyCode = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      const otp = code.join('');
      if (otp.length !== OTP_LENGTH) {
        setError(
          dict.errors.incompleteCode.replace(
            '{{OTP_LENGTH}}',
            OTP_LENGTH.toString()
          )
        );
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/verify-phone-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: otp }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || dict.errors.default);
        setSuccessMessage(dict.success.verifying);
        await updateSession({ isPhoneVerified: true });
        window.location.href = '/profile';
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : dict.errors.unexpected);
        setIsLoading(false);
      }
    },
    [code, updateSession, dict]
  );

  const handleResendCode = useCallback(async () => {
    if (resendDisabled || isResending) return;
    setError(null);
    setInfoMessage(null);
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-phone-code', {
        method: 'POST',
      });
      if (!response.ok) throw new Error((await response.json()).error);
      setInfoMessage(dict.info.resent);
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.errors.unexpected);
    } finally {
      setIsResending(false);
    }
  }, [isResending, resendDisabled, startResendTimer, dict]);

  const getHiddenPhone = () => {
    const phone = session?.user?.phone;
    if (!phone || phone.length < 10) return dict.yourPhoneNumber;
    return `${phone.substring(0, 3)}••••${phone.substring(phone.length - 3)}`;
  };

  const disableForm = isLoading || !!successMessage;
  const disableResend = isResending || resendDisabled || !!successMessage;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-pink-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 sm:p-8 space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{dict.title}</h1>
          {/* === FIX: Reverted to JSX from dangerouslySetInnerHTML for better readability and security === */}
          <p className="text-gray-600 mt-2 text-sm">
            {dict.codeSentTo.replace('{{OTP_LENGTH}}', OTP_LENGTH.toString())}{' '}
            <span className="font-medium text-gray-700">
              {getHiddenPhone()}
            </span>
            .
            <br />
            {dict.enterCodePrompt}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.errors.title}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert className="bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>{dict.success.title}</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        {infoMessage && (
          <Alert className="bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.info.title}</AlertTitle>
            <AlertDescription>{infoMessage}</AlertDescription>
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
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={disableForm}
                required
                aria-label={dict.digitAriaLabel.replace(
                  '{{index}}',
                  (index + 1).toString()
                )}
                // === FIX: Restored the original, detailed styling for OTP inputs ===
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border-2 border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:bg-gray-100"
              />
            ))}
          </div>
          {/* === FIX: Restored the original gradient button styling === */}
          <Button
            type="submit"
            disabled={disableForm || code.join('').length !== OTP_LENGTH}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5 mx-auto" />
            ) : (
              dict.verifyButton
            )}
          </Button>
        </form>

        <div className="text-sm text-gray-600 space-y-2">
          <div>
            {dict.resend.prompt}{' '}
            {/* === FIX: Restored specific styling for resend button and its disabled state === */}
            <Button
              type="button"
              variant="link"
              onClick={handleResendCode}
              disabled={disableResend}
              className="p-0 h-auto text-cyan-600 hover:text-cyan-700 disabled:text-gray-400 disabled:no-underline"
            >
              {isResending
                ? dict.resend.buttonLoading
                : resendDisabled
                  ? dict.resend.timer.replace(
                      '{{timer}}',
                      resendTimer.toString()
                    )
                  : dict.resend.button}
            </Button>
          </div>
          <div>
            {/* === FIX: Restored specific styling for links and their disabled state === */}
            <Link
              href="/auth/update-phone"
              className={`text-cyan-600 hover:text-cyan-700 hover:underline ${disableForm ? 'pointer-events-none text-gray-400' : ''}`}
            >
              {dict.wrongNumberLink}
            </Link>
          </div>
        </div>
        <div className="mt-4 border-t pt-4">
          <Link
            href="/auth/signin"
            className={`text-xs text-gray-500 hover:text-gray-600 ${disableForm ? 'pointer-events-none opacity-50' : ''}`}
          >
            {dict.backToSignInLink}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyPhoneClient;
