// src/components/auth/steps/EmailVerificationCodeStep.tsx
'use client';

import {
  useState,
  useRef,
  KeyboardEvent,
  useEffect,
  FormEvent,
  useCallback,
  ClipboardEvent,
} from 'react';
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
  locale: 'he' | 'en';
}

const EmailVerificationCodeStep: React.FC<EmailVerificationCodeStepProps> = ({
  dict,
  locale,
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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (element: HTMLInputElement, index: number) => {
      const value = element.value.replace(/[^0-9]/g, '');
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      setApiError(null);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  // --------------------------------------------------------
  // Handle Paste Event - Works from any input position
  // --------------------------------------------------------
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      // קבלת הטקסט מהלוח
      const pastedData = e.clipboardData.getData('text');
      // ניקוי תווים שאינם מספרים
      const pastedNumbers = pastedData.replace(/\D/g, '').split('');

      if (pastedNumbers.length === 0) return;

      const newOtp = [...otp];
      let nextIndex = index;

      // מילוי המערך החל מהאינדקס הנוכחי
      for (let i = 0; i < pastedNumbers.length; i++) {
        if (nextIndex >= OTP_LENGTH) break;
        newOtp[nextIndex] = pastedNumbers[i];
        nextIndex++;
      }

      setOtp(newOtp);
      setApiError(null);

      // העברת הפוקוס לשדה האחרון שמולא או לשדה הבא
      const focusIndex = Math.min(nextIndex, OTP_LENGTH - 1);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [otp]
  );
  // --------------------------------------------------------

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
      const response = await fetch(
        `/api/auth/verify-email-code?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: registrationData.emailForVerification,
            code: enteredCode,
          }),
        }
      );
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

  const disableForm = isLoading || isResending;

  return (
    <motion.div
      className="space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        {/* UPDATED: Icon Color (Teal) */}
        <MailCheck className="h-12 w-12 text-teal-500 mx-auto mb-3" />
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
          className="flex justify-center gap-2 md:gap-3"
          dir="ltr"
        >
          {otp.map((digit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: disableForm ? 1 : 1.05 }}
            >
              <Input
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) =>
                  handleChange(e.target as HTMLInputElement, index)
                }
                onKeyDown={(e) =>
                  handleKeyDown(e as KeyboardEvent<HTMLInputElement>, index)
                }
                // ▼▼▼ Paste Handler Connected to ALL inputs ▼▼▼
                onPaste={(e) =>
                  handlePaste(e as ClipboardEvent<HTMLInputElement>, index)
                }
                // ▲▲▲
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                // UPDATED: Input Focus (Teal) with improved styling
                className={`
                  w-12 h-14 md:w-14 md:h-16 
                  text-center text-xl md:text-2xl font-semibold 
                  border-2 rounded-xl
                  transition-all duration-300
                  shadow-md
                  ${
                    focusedIndex === index
                      ? 'border-teal-500 ring-4 ring-teal-200 scale-105 bg-white'
                      : digit
                        ? 'border-teal-400 bg-teal-50'
                        : 'border-gray-200 bg-white/50 hover:border-teal-300'
                  }
                  ${disableForm ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={disableForm}
                aria-label={`OTP digit ${index + 1}`}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Progress Indicator (like phone verification) */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center gap-2 mt-4"
        >
          {otp.map((digit, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                digit
                  ? 'bg-gradient-to-r from-teal-500 to-orange-500 w-8'
                  : 'bg-gray-200 w-4'
              }`}
              animate={{
                scale: digit ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6">
          <Button
            type="submit"
            disabled={disableForm || otp.join('').length !== OTP_LENGTH}
            // UPDATED: Main Button Gradient (Teal -> Orange -> Amber)
            className="w-full py-6 text-lg bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          disabled={disableForm}
          // UPDATED: Link Color (Teal)
          className="p-0 h-auto text-teal-600 hover:text-teal-700 font-semibold"
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
          disabled={disableForm}
          className="hover:bg-gray-50 border-gray-200"
        >
          <ArrowRight
            className={`h-4 w-4 ml-2 ${locale === 'en' ? 'transform rotate-180' : ''}`}
          />{' '}
          {dict.backButton}{' '}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationCodeStep;
