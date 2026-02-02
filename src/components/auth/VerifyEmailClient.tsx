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
  RefreshCw,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface VerifyEmailClientProps {
  locale: 'he' | 'en';
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'error';

const OTP_LENGTH = 6;

export default function VerifyEmailClient({ locale }: VerifyEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const isHebrew = locale === 'he';

  // State Management
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Refs for input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
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
  }, [code, status]);

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newCode = [...code];
      newCode[index] = value.slice(-1);
      setCode(newCode);
      setErrorMessage('');

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
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

      const newCode = [...code];
      let nextIndex = index;

      // מילוי המערך החל מהאינדקס הנוכחי
      for (let i = 0; i < pastedNumbers.length; i++) {
        if (nextIndex >= OTP_LENGTH) break;
        newCode[nextIndex] = pastedNumbers[i];
        nextIndex++;
      }

      setCode(newCode);
      setErrorMessage('');

      // העברת הפוקוס לשדה האחרון שמולא או לשדה הבא
      const focusIndex = Math.min(nextIndex, OTP_LENGTH - 1);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex]?.focus();
      }
    },
    [code]
  );
  // --------------------------------------------------------

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
        throw new Error(data.error || 'אירעה שגיאה באימות הקוד');
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
        error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה'
      );
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

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
        throw new Error(data.error || 'אירעה שגיאה בשליחת הקוד');
      }

      setCanResend(false);
      setResendCountdown(60);
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'אירעה שגיאה בשליחת הקוד'
      );
    } finally {
      setIsResending(false);
    }
  };

  // Dictionary
  const dict = {
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

  const disableForm = status === 'verifying' || status === 'success';

  return (
    // UPDATED: Main Background (Slate/Teal/Orange)
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-teal-50/40 to-orange-50/40 flex items-center justify-center p-4 relative overflow-hidden">
      {/* UPDATED: Decorative Orbs (Teal/Orange/Rose) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          // Teal Orb
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
          // Orange Orb
          className="absolute bottom-20 right-10 w-72 h-72 bg-orange-200/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          // Rose Orb
          className="absolute top-1/2 left-1/3 w-56 h-56 bg-rose-200/30 rounded-full blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative overflow-hidden">
          {/* Decorative shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-100/20 via-transparent to-orange-100/20 pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                // Teal Icon Container
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

            {/* Code Input Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6"
            >
              <p className="text-center text-sm text-gray-600 mb-4">
                {dict.enterCode}
              </p>

              {/* OTP Input Boxes */}
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
                      // ▼▼▼ Paste Handler Connected to ALL inputs ▼▼▼
                      onPaste={(e) => handlePaste(e, index)}
                      // ▲▲▲
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      disabled={disableForm}
                      aria-label={dict.digitAriaLabel.replace(
                        '{{index}}',
                        (index + 1).toString()
                      )}
                      // UPDATED: Input Colors (Teal Focus/Fill)
                      className={`
                        w-12 h-14 sm:w-14 sm:h-16 
                        text-center text-2xl font-bold rounded-xl
                        border-2 transition-all duration-300
                        shadow-md
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
                        focus:outline-none
                        disabled:opacity-60 disabled:cursor-not-allowed
                      `}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Progress Indicator (like phone verification) */}
              <div className="flex justify-center items-center gap-2 mb-4">
                {code.map((digit, index) => (
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
              </div>
            </motion.div>

            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {status === 'verifying' && (
                // UPDATED: Text Color (Teal)
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center justify-center gap-2 text-teal-600 mb-4"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">
                    {dict.verifying}
                  </span>
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
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border-2 border-green-400 mb-2"
                  >
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-green-700 font-bold">
                      {dict.success}
                    </span>
                  </motion.div>
                  <p className="text-sm text-gray-600">
                    {dict.successMessage}
                  </p>
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
                    disabled={isResending}
                    variant="outline"
                    size="sm"
                    // UPDATED: Resend Button (Teal Border/Text)
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
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {dict.resendIn}{' '}
                      <span className="font-bold text-gray-800">
                        {resendCountdown}
                      </span>{' '}
                      {dict.seconds}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-500 italic">
                  {dict.checkSpam}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* UPDATED: Security Note (Warm/Amber background) */}
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
            // UPDATED: Link Hover (Teal)
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600 transition-colors group"
          >
            <ArrowLeft
              className={`w-4 h-4 group-hover:-translate-x-1 transition-transform ${isHebrew ? '' : 'rotate-180'}`}
            />
            <span>{dict.backToRegister}</span>
          </Link>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          // Teal Blob
          className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl opacity-20 blur-xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          // Orange Blob
          className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl opacity-20 blur-xl"
        />
      </motion.div>

      <style>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}