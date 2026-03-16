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
import {
  Loader2,
  AlertCircle,
  MailCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const VERIFICATION_TIMEOUT_MS = 15000; // 15 seconds

// ============================================================================
// TYPES
// ============================================================================

interface EmailVerificationCodeStepProps {
  dict: RegisterStepsDict['steps']['emailVerification'];
  locale: 'he' | 'en';
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ============================================================================
// COMPONENT
// ============================================================================

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

  // OTP state
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Loading / status state
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const isRTL = locale === 'he';
  const disableForm = isLoading || isResending;
  const isCodeComplete = otp.every((d) => d !== '');

  // ============================================================================
  // Auto-focus first input on mount
  // ============================================================================

  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // ============================================================================
  // Resend cooldown timer
  // ============================================================================

  useEffect(() => {
    if (resendCooldown <= 0) return;

    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown > 0]); // Re-run only when transitioning from 0 to >0

  // ============================================================================
  // Auto-submit when all digits are filled
  // ============================================================================

  useEffect(() => {
    if (isCodeComplete && !isLoading && !apiError) {
      // Small delay so the user can see the last digit appear
      const timer = setTimeout(() => {
        const form = document.getElementById('otp-form') as HTMLFormElement;
        if (form) form.requestSubmit();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [otp, isCodeComplete, isLoading, apiError]);

  // ============================================================================
  // INPUT HANDLERS
  // ============================================================================

  const handleChange = useCallback(
    (element: HTMLInputElement, index: number) => {
      const value = element.value.replace(/[^0-9]/g, '');

      setOtp((prev) => {
        const newOtp = [...prev];
        newOtp[index] = value.slice(-1);
        return newOtp;
      });

      setApiError(null);
      setIsTimedOut(false);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      // In RTL, visual "left" key should go to next index (visually right)
      // But for OTP which is always LTR, keep standard behavior
      if (e.key === 'Backspace') {
        if (!otp[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
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

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text');
      const pastedNumbers = pastedData.replace(/\D/g, '').split('');

      if (pastedNumbers.length === 0) return;

      setOtp((prev) => {
        const newOtp = [...prev];
        let nextIndex = index;

        for (let i = 0; i < pastedNumbers.length; i++) {
          if (nextIndex >= OTP_LENGTH) break;
          newOtp[nextIndex] = pastedNumbers[i];
          nextIndex++;
        }

        return newOtp;
      });

      setApiError(null);

      const focusIndex = Math.min(index + pastedNumbers.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    },
    []
  );

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

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
    setIsTimedOut(false);

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      setIsTimedOut(true);
    }, VERIFICATION_TIMEOUT_MS);

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

      clearTimeout(timeoutId);

      if (signInResult?.ok) {
        completeEmailVerification();
        router.push(`/${locale}/auth/register`);
      } else {
        throw new Error(
          dict.errors.autoSignInFailed.replace(
            '{error}',
            signInResult?.error || 'Unknown error'
          )
        );
      }
    } catch (error) {
      clearTimeout(timeoutId);
      setApiError(error instanceof Error ? error.message : dict.errors.default);
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RESEND CODE
  // ============================================================================

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
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : dict.errors.default);
    } finally {
      setIsResending(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      className="space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
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

      {/* Error alert */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{dict.errors.title}</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeout warning */}
      <AnimatePresence>
        {isTimedOut && isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertTitle>
                {locale === 'he'
                  ? 'התהליך לוקח זמן...'
                  : 'Taking longer than expected...'}
              </AlertTitle>
              <AlertDescription>
                {locale === 'he'
                  ? 'אנא המתן. אם זה ממשיך, נסה לרענן את הדף.'
                  : 'Please wait. If this continues, try refreshing the page.'}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resend success */}
      <AnimatePresence>
        {resendMessage && !apiError && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
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
      </AnimatePresence>

      {/* OTP Form */}
      <form onSubmit={handleFormSubmit} id="otp-form">
        {/* OTP Inputs — always LTR for digit order */}
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
                onPaste={(e) =>
                  handlePaste(e as ClipboardEvent<HTMLInputElement>, index)
                }
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
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
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                inputMode="numeric"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Progress dots */}
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
              animate={{ scale: digit ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        {/* Submit button */}
        <motion.div variants={itemVariants} className="mt-6">
          <Button
            type="submit"
            disabled={disableForm || !isCodeComplete}
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

      {/* Resend section */}
      <motion.div
        variants={itemVariants}
        className="text-sm text-gray-500 mt-2"
      >
        {dict.resendPrompt}{' '}
        {resendCooldown > 0 ? (
          <span className="inline-flex items-center gap-1 text-gray-400">
            <Clock className="h-3 w-3" />
            {locale === 'he'
              ? `שלח שוב בעוד ${resendCooldown} שניות`
              : `Resend in ${resendCooldown}s`}
          </span>
        ) : (
          <Button
            type="button"
            variant="link"
            onClick={handleResendCode}
            disabled={disableForm}
            className="p-0 h-auto text-teal-600 hover:text-teal-700 font-semibold"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-1" />
                <span>{dict.resendButtonLoading}</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 ml-1" />
                {dict.resendButton}
              </>
            )}
          </Button>
        )}
      </motion.div>

      {/* Back button */}
      <motion.div variants={itemVariants} className="mt-6">
        <Button
          type="button"
          onClick={goBackToBasicInfo}
          variant="outline"
          disabled={disableForm}
          className="hover:bg-gray-50 border-gray-200"
        >
          {isRTL ? (
            <ArrowRight className="h-4 w-4 ml-2" />
          ) : (
            <ArrowLeft className="h-4 w-4 mr-2" />
          )}
          {dict.backButton}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationCodeStep;
