// src/components/auth/VerifyEmailClient.tsx
'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface VerifyEmailDict {
  title: string;
  subtitle: string;
  emailSentTo: string;
  enterCode: string;
  verifying: string;
  success: string;
  successMessage: string;
  errorTitle: string;
  resendCode: string;
  resendIn: string;
  seconds: string;
  didntReceive: string;
  checkSpam: string;
  backToRegister: string;
  securityNote: string;
  digitAriaLabel: string;
}

interface VerifyEmailClientProps {
  locale: 'he' | 'en';
  dict?: VerifyEmailDict; // Accept dict as prop; fallback to internal defaults
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

// ============================================================================
// DEFAULT DICTIONARY (fallback)
// ============================================================================

function getDefaultDict(isHebrew: boolean): VerifyEmailDict {
  return {
    title: isHebrew ? 'אמת את כתובת המייל שלך' : 'Verify Your Email',
    subtitle: isHebrew
      ? 'שלחנו קוד אימות בן 6 ספרות למייל שלך'
      : 'We sent a 6-digit verification code to your email',
    emailSentTo: isHebrew ? 'נשלח אל:' : 'Sent to:',
    enterCode: isHebrew ? 'הזן את הקוד כאן' : 'Enter the code here',
    verifying: isHebrew ? 'מאמת...' : 'Verifying...',
    success: isHebrew ? 'אומת בהצלחה!' : 'Verified Successfully!',
    successMessage: isHebrew
      ? 'המייל שלך אומת. מעביר אותך להמשך התהליך...'
      : 'Your email has been verified. Redirecting...',
    errorTitle: isHebrew ? 'קוד שגוי' : 'Invalid Code',
    resendCode: isHebrew ? 'שלח קוד מחדש' : 'Resend Code',
    resendIn: isHebrew ? 'שלח שוב בעוד' : 'Resend in',
    seconds: isHebrew ? 'שניות' : 'seconds',
    didntReceive: isHebrew ? 'לא קיבלת את הקוד?' : "Didn't receive the code?",
    checkSpam: isHebrew
      ? 'בדוק את תיבת הספאם או שלח שוב'
      : 'Check your spam folder or resend',
    backToRegister: isHebrew ? 'חזרה להרשמה' : 'Back to Registration',
    securityNote: isHebrew
      ? 'הקוד תקף ל-15 דקות מרגע השליחה'
      : 'Code is valid for 15 minutes from sending',
    digitAriaLabel: isHebrew ? 'ספרה {{index}}' : 'Digit {{index}}',
  };
}

// ============================================================================
// CIRCULAR TIMER COMPONENT
// ============================================================================

const CircularTimer: React.FC<{ seconds: number; maxSeconds: number }> = ({
  seconds,
  maxSeconds,
}) => {
  const progress = (seconds / maxSeconds) * 100;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center w-8 h-8">
      <svg className="w-8 h-8 transform -rotate-90">
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-teal-500 transition-all duration-300"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-gray-600">
        {seconds}
      </span>
    </div>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function VerifyEmailClient({
  locale,
  dict: dictProp,
}: VerifyEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const isHebrew = locale === 'he';

  // Use provided dict or fallback to defaults
  const dict = dictProp || getDefaultDict(isHebrew);

  // State
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === OTP_LENGTH && status === 'idle') {
      handleVerifyCode(fullCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, status]);

  // Show "no email" state
  const [showNoEmail, setShowNoEmail] = useState(false);
  useEffect(() => {
    if (!email) {
      setShowNoEmail(true);
    }
  }, [email]);

  // ============================================================================
  // INPUT HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setCode((prev) => {
      const newCode = [...prev];
      newCode[index] = value.slice(-1);
      return newCode;
    });
    setErrorMessage('');
    // Reset error status so user can try again
    setStatus((prev) => (prev === 'error' ? 'idle' : prev));

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowLeft' && index > 0)
        inputRefs.current[index - 1]?.focus();
      if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1)
        inputRefs.current[index + 1]?.focus();
    },
    [code]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      const pastedNumbers = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .split('');
      if (pastedNumbers.length === 0) return;

      setCode((prev) => {
        const newCode = [...prev];
        let nextIndex = index;
        for (const digit of pastedNumbers) {
          if (nextIndex >= OTP_LENGTH) break;
          newCode[nextIndex] = digit;
          nextIndex++;
        }
        return newCode;
      });
      setErrorMessage('');
      setStatus((prev) => (prev === 'error' ? 'idle' : prev));

      const focusIndex = Math.min(index + pastedNumbers.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    },
    []
  );

  // ============================================================================
  // VERIFY CODE
  // ============================================================================

  const handleVerifyCode = async (verificationCode: string) => {
    setStatus('verifying');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (isHebrew ? 'אירעה שגיאה באימות הקוד' : 'Error verifying code')
        );
      }

      setStatus('success');
      setTimeout(() => {
        router.push(
          `/${locale}/auth/register?step=personal-details&email=${encodeURIComponent(email)}`
        );
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isHebrew
            ? 'אירעה שגיאה לא צפויה'
            : 'Unexpected error'
      );
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  // ============================================================================
  // RESEND CODE
  // ============================================================================

  const handleResendCode = async () => {
    setIsResending(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (isHebrew ? 'אירעה שגיאה בשליחת הקוד' : 'Error sending code')
        );
      }

      setCanResend(false);
      setResendCountdown(RESEND_COOLDOWN);
      setCode(Array(OTP_LENGTH).fill(''));
      setStatus('idle');
      inputRefs.current[0]?.focus();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isHebrew
            ? 'אירעה שגיאה בשליחת הקוד'
            : 'Error sending code'
      );
    } finally {
      setIsResending(false);
    }
  };

  const disableForm = status === 'verifying' || status === 'success';

  // ============================================================================
  // RENDER — No email state
  // ============================================================================

  if (showNoEmail) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-teal-50/40 to-orange-50/40 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isHebrew ? 'חסרה כתובת מייל' : 'Missing email address'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isHebrew
              ? 'לא ניתן לאמת ללא כתובת מייל. אנא חזור להרשמה.'
              : 'Cannot verify without an email address. Please go back to registration.'}
          </p>
          <Link href={`/${locale}/auth/register`}>
            <Button className="bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500">
              {dict.backToRegister}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER — Main
  // ============================================================================

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-teal-50/40 to-orange-50/40 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Simplified decorative background — 2 orbs instead of 3 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-orange-200/40 rounded-full blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-100/20 via-transparent to-orange-100/20 pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg mb-4"
              >
                <Mail className="w-8 h-8 text-white" />
              </motion.div>

              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {dict.title}
              </h1>
              <p className="text-gray-600">{dict.subtitle}</p>

              {email && (
                <div className="mt-3 px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100 inline-block">
                  <p className="text-sm text-gray-500">{dict.emailSentTo}</p>
                  <p className="font-semibold text-gray-800 break-all">
                    {email}
                  </p>
                </div>
              )}
            </div>

            {/* OTP Input */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-center text-sm text-gray-600 mb-4">
                {dict.enterCode}
              </p>

              <div
                className="flex justify-center gap-2 sm:gap-3 mb-6"
                dir="ltr"
              >
                {code.map((digit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: disableForm ? 1 : 1.05 }}
                  >
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={(e) => handlePaste(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      disabled={disableForm}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={dict.digitAriaLabel.replace(
                        '{{index}}',
                        (index + 1).toString()
                      )}
                      className={`
                        w-12 h-14 sm:w-14 sm:h-16 
                        text-center text-2xl font-bold rounded-xl
                        border-2 transition-all duration-300
                        shadow-md focus:outline-none
                        ${
                          status === 'error'
                            ? 'border-red-400 bg-red-50 text-red-600'
                            : status === 'success'
                              ? 'border-green-400 bg-green-50 text-green-600'
                              : focusedIndex === index
                                ? 'border-teal-500 ring-4 ring-teal-200 scale-105 bg-white'
                                : digit
                                  ? 'border-teal-400 bg-teal-50 text-gray-800'
                                  : 'border-gray-200 bg-white text-gray-800 hover:border-teal-200'
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Progress dots */}
              <div className="flex justify-center items-center gap-2 mb-4">
                {code.map((digit, index) => (
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
              </div>
            </motion.div>

            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {status === 'verifying' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center justify-center gap-2 text-teal-600 mb-4"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">{dict.verifying}</span>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border-2 border-green-400 mb-2"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-green-700 font-bold">
                      {dict.success}
                    </span>
                  </motion.div>
                  <p className="text-sm text-gray-600">{dict.successMessage}</p>
                </motion.div>
              )}

              {status === 'error' && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 text-sm mb-1">
                        {dict.errorTitle}
                      </p>
                      <p className="text-red-600 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Resend Section */}
            {status !== 'success' && (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">{dict.didntReceive}</p>

                {canResend ? (
                  <Button
                    onClick={handleResendCode}
                    disabled={isResending || disableForm}
                    variant="outline"
                    size="sm"
                    className="border-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 rounded-full px-6 py-2 transition-all"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {isHebrew ? 'שולח...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {dict.resendCode}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                    <CircularTimer
                      seconds={resendCountdown}
                      maxSeconds={RESEND_COOLDOWN}
                    />
                    <span className="text-sm text-gray-600">
                      {dict.resendIn}{' '}
                      <span className="font-bold text-gray-800">
                        {resendCountdown}
                      </span>{' '}
                      {dict.seconds}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-500 italic">{dict.checkSpam}</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{dict.securityNote}</p>
          </div>
        </motion.div>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Link
            href={`/${locale}/auth/register`}
            className={`inline-flex items-center gap-2 text-sm transition-colors group ${
              disableForm
                ? 'text-gray-400 pointer-events-none'
                : 'text-gray-600 hover:text-teal-600'
            }`}
          >
            {isHebrew ? (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            ) : (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            )}
            <span>{dict.backToRegister}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
