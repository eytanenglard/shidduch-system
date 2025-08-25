// src/components/auth/steps/EmailVerificationCodeStep.tsx
'use client';

import { useState, useRef, KeyboardEvent, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, MailCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

const OTP_LENGTH = 6;

interface EmailVerificationCodeStepProps {
  dict: RegisterStepsDict['steps']['emailVerification'];
}

const EmailVerificationCodeStep: React.FC<EmailVerificationCodeStepProps> = ({
  dict,
}) => {
  const {
    data: registrationData,
    exitEmailVerification: goBackToBasicInfo,
    completeEmailVerification,
  } = useRegistration();
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last digit
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== OTP_LENGTH) {
      setApiError(
        dict.errors.incompleteCode.replace('{{length}}', OTP_LENGTH.toString())
      );
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setResendMessage(null);

    try {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registrationData.emailForVerification,
          code: enteredCode,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.authToken) {
        throw new Error(result.error || dict.errors.default);
      }

      const signInResult = await signIn('email-verified-autologin', {
        authToken: result.authToken,
        redirect: false,
      });

      if (signInResult?.ok) {
        completeEmailVerification();
        router.push('/auth/register');
      } else {
        throw new Error(
          dict.errors.autoSignInFailed.replace(
            '{error}',
            signInResult?.error || 'Unknown error'
          )
        );
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : dict.errors.default);
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setApiError(null);
    setResendMessage(null);
    try {
      const response = await fetch('/api/auth/resend-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registrationData.emailForVerification }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setResendMessage(dict.alerts.resent);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : dict.errors.default);
    } finally {
      setIsResending(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <MailCheck className="h-12 w-12 text-cyan-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800">{dict.title}</h2>
        <p className="text-gray-600 mt-2">
          {dict.subtitle.replace('{{length}}', OTP_LENGTH.toString())}{' '}
          <strong className="font-semibold text-gray-700">
            {registrationData.emailForVerification || dict.yourEmail}
          </strong>
          .
        </p>
      </motion.div>

      {apiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{dict.errors.title}</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      {resendMessage && !apiError && (
        <motion.div variants={itemVariants}>
          <Alert
            variant="default"
            className="bg-green-50 border-green-300 text-green-700"
            role="status"
          >
            <MailCheck className="h-4 w-4 text-green-600" />
            <AlertTitle>{dict.alerts.title}</AlertTitle>
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <form onSubmit={handleFormSubmit}>
        <motion.div
          variants={itemVariants}
          className="flex justify-center space-x-2 rtl:space-x-reverse"
          dir="ltr"
        >
          {otp.map((digit, index) => (
            <Input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) =>
                handleChange(e.target as HTMLInputElement, index)
              }
              onKeyDown={(e) =>
                handleKeyDown(e as KeyboardEvent<HTMLInputElement>, index)
              }
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className="w-12 h-14 text-center text-xl font-semibold"
              disabled={isLoading || isResending}
              aria-label={`OTP digit ${index + 1}`}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
          <Button
            type="submit"
            disabled={
              isLoading || isResending || otp.join('').length !== OTP_LENGTH
            }
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin ml-2" />
                <span>{dict.submitButtonLoading}</span>
              </>
            ) : (
              dict.submitButton
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div
        variants={itemVariants}
        className="text-sm text-gray-500 mt-2"
      >
        {dict.resendPrompt}{' '}
        <Button
          type="button"
          variant="link"
          onClick={handleResendCode}
          disabled={isLoading || isResending}
          className="p-0 h-auto text-cyan-600"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
              <span>{dict.resendButtonLoading}</span>
            </>
          ) : (
            dict.resendButton
          )}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6">
        <Button
          type="button"
          onClick={goBackToBasicInfo}
          variant="outline"
          disabled={isLoading || isResending}
        >
          <ArrowRight className="h-4 w-4 ml-2" /> {dict.backButton}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationCodeStep;
