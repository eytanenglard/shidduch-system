// src/app/[locale]/auth/verify-phone/VerifyPhoneClient.tsx
'use client';

import { useState, useCallback, useRef, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Import ProgressBar
import ProgressBar from '@/components/auth/ProgressBar';
import type { VerifyPhoneDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VerifyPhoneClientProps {
  dict: VerifyPhoneDict;
  locale: 'he' | 'en';
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ============================================================================
// DYNAMIC BACKGROUND COMPONENT (Teal/Orange Theme)
// ============================================================================

const DynamicBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    {/* Floating Gradients */}
    <motion.div
      className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-teal-400/20 to-emerald-500/20 rounded-full blur-3xl"
      animate={{
        y: [0, -30, 0],
        x: [0, 20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <motion.div
      className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-full blur-3xl"
      animate={{
        y: [0, 40, 0],
        x: [0, -30, 0],
        scale: [1, 1.15, 1],
      }}
      transition={{
        duration: 18,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 1,
      }}
    />
    <motion.div
      className="absolute bottom-32 left-1/4 w-72 h-72 bg-gradient-to-br from-rose-400/15 to-orange-500/15 rounded-full blur-3xl"
      animate={{
        y: [0, -25, 0],
        x: [0, 15, 0],
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
    />
    <motion.div
      className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-to-br from-teal-400/20 to-cyan-500/20 rounded-full blur-3xl"
      animate={{
        y: [0, 20, 0],
        x: [0, -10, 0],
        scale: [1, 1.12, 1],
      }}
      transition={{
        duration: 16,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    />

    {/* Decorative Dots Pattern (Teal) */}
    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:30px_30px]"></div>

    {/* SVG Decorative Paths (Teal -> Orange) */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 800"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="decorativeGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,100 C300,50 600,150 1200,100 L1200,0 L0,0 Z"
        fill="url(#decorativeGradient)"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M0,700 C400,650 800,750 1200,700 L1200,800 L0,800 Z"
        fill="url(#decorativeGradient)"
        initial={{ opacity: 0.8 }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
    </svg>
  </div>
);

// ============================================================================
// CIRCULAR TIMER COMPONENT
// ============================================================================

interface CircularTimerProps {
  seconds: number;
  maxSeconds: number;
}

const CircularTimer: React.FC<CircularTimerProps> = ({
  seconds,
  maxSeconds,
}) => {
  const progress = (seconds / maxSeconds) * 100;
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center w-10 h-10">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // Color updated to Teal
          className="text-teal-500"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
      <span className="absolute text-xs font-semibold text-gray-600">
        {seconds}
      </span>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const VerifyPhoneClient: React.FC<VerifyPhoneClientProps> = ({
  dict,
  locale,
}) => {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const isRTL = locale === 'he';

  // Debug logging
  useEffect(() => {
    console.log('[VerifyPhoneClient] Component mounted');
    console.log('[VerifyPhoneClient] Session data:', session);
    console.log('[VerifyPhoneClient] User phone:', session?.user?.phone);
  }, [session]);

  // State
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resendDisabled = resendTimer > 0;

  // Timer Management
  const startResendTimer = useCallback(() => {
    setResendTimer(RESEND_COOLDOWN);
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }
    resendTimerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) {
            clearInterval(resendTimerRef.current);
            resendTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      // אם המשתמש כבר מאומת טלפונית, אין לו מה לחפש פה
      if (user.isPhoneVerified) {
        router.push(`/${locale}/profile`);
      }
    }
  }, [session, router, locale]);
  useEffect(() => {
    startResendTimer();
    return () => {
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current);
      }
    };
  }, [startResendTimer]);

  // Input Handling
  const handleInputChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newCode = [...code];
      newCode[index] = value.slice(0, 1);
      setCode(newCode);
      setError(null);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Verify Code
  // 🔴 תיקון לפונקציה handleVerifyCode בקובץ VerifyPhoneClient.tsx
  // החלף את הפונקציה הקיימת (שורות 339-385) בקוד הבא:

  // Verify Code
// 🔴 תיקון לפונקציה handleVerifyCode בקובץ VerifyPhoneClient.tsx
// החלף את הפונקציה הקיימת (שורות 339-385) בקוד הבא:

  // Verify Code
  const handleVerifyCode = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setInfoMessage(null);

      const fullCode = code.join('');
      if (fullCode.length !== OTP_LENGTH) {
        setError(dict.errors.incompleteCode);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/auth/verify-phone-code?locale=${locale}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: fullCode }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || dict.errors.default);
        }

        // ✅ האימות הצליח
        setSuccessMessage(dict.success.verifying);

        // 🔴 עדכון ה-session וניווט לפרופיל
        await updateSession();
        router.push(`/${locale}/profile`);

      } catch (err: unknown) {
        console.error('[VerifyPhoneClient] Verification error:', err);
        setError(err instanceof Error ? err.message : dict.errors.unexpected);
        setIsLoading(false);
      }
    },
    [code, updateSession, dict, locale, router]
  );

  // Resend Code
  const handleResendCode = useCallback(async () => {
    if (resendDisabled || isResending) return;
    setError(null);
    setInfoMessage(null);
    setIsResending(true);

    try {
      const response = await fetch(
        `/api/auth/resend-phone-code?locale=${locale}`,
        {
          method: 'POST',
        }
      );
      if (!response.ok) throw new Error((await response.json()).error);
      setInfoMessage(dict.info.resent);
      startResendTimer();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : dict.errors.unexpected);
    } finally {
      setIsResending(false);
    }
  }, [isResending, resendDisabled, startResendTimer, dict, locale]);

  // Get Hidden Phone
  const getHiddenPhone = () => {
    const phone = session?.user?.phone;
    if (!phone || phone.length < 4) {
      return dict.yourPhoneNumber;
    }
    const hiddenPhone = `${phone.substring(0, 3)}••••${phone.substring(phone.length - 3)}`;
    return hiddenPhone;
  };

  // --- Helper to safely render text with dynamic OTP length ---
  const renderWithGradientNumber = (text: string) => {
    // If the JSON contains the placeholder, we split and insert the styled number
    if (text.includes('{{OTP_LENGTH}}')) {
      const parts = text.split('{{OTP_LENGTH}}');
      return (
        <>
          {parts[0]}
          {/* Number Accent: Teal -> Pink (retained for contrast) or Teal -> Orange */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600">
            {OTP_LENGTH}
          </span>
          {parts[1]}
        </>
      );
    }
    // Fallback: Return text as is (avoids double number bug)
    return text;
  };

  const disableForm = isLoading || !!successMessage;
  const disableResend = isResending || resendDisabled || !!successMessage;
  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <DynamicBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg relative z-10"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          {/* --- Progress Bar Added Here --- */}
          <div className="w-full max-w-xs mx-auto mb-6">
            <ProgressBar
              currentStep={2}
              totalSteps={2}
              stepLabel={locale === 'he' ? 'שלב {{step}}' : 'Step {{step}}'}
              locale={locale}
            />
          </div>
          {/* ------------------------------- */}

          <motion.div
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            {/* Shield: Teal */}
            <Shield className="w-6 h-6 text-teal-500" />
            <span className="text-teal-700 font-semibold text-lg">
              {dict.title}
            </span>
          </motion.div>

          {/* Fixed Header Logic */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {renderWithGradientNumber(dict.description)}
          </h1>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-white/60 p-8 md:p-10"
        >
          {/* Decorative Elements (Teal/Orange) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-transparent rounded-full transform translate-x-16 -translate-y-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full transform -translate-x-16 translate-y-16 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-400/5 to-transparent rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            {/* WhatsApp/Phone Icon & Phone Number */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg mb-2">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              {/* Fixed Code Sent To Logic */}
              <p className="text-gray-600 text-sm md:text-base">
                {renderWithGradientNumber(dict.codeSentTo)}
              </p>
              <p className="text-xl font-bold text-gray-800">
                {getHiddenPhone()}
              </p>
              <p className="text-gray-500 text-sm">{dict.enterCodePrompt}</p>
            </div>

            {/* Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert
                    variant="destructive"
                    className="border-red-200 bg-red-50"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="font-semibold">
                      {dict.errors.title}
                    </AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </motion.div>
                    <AlertTitle className="font-semibold text-emerald-800">
                      {dict.success.title}
                    </AlertTitle>
                    <AlertDescription className="text-emerald-700">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {infoMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Info: Teal */}
                  <Alert className="border-teal-200 bg-teal-50">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    <AlertTitle className="font-semibold text-teal-800">
                      {dict.info.title}
                    </AlertTitle>
                    <AlertDescription className="text-teal-700">
                      {infoMessage}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OTP Input Form */}
            <form onSubmit={handleVerifyCode} className="space-y-8">
              {/* Code Input Boxes */}
              <div className="flex justify-center gap-2 md:gap-3" dir="ltr">
                {code.map((digit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Input
                      ref={(el: HTMLInputElement | null) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      disabled={disableForm}
                      required
                      aria-label={dict.digitAriaLabel.replace(
                        '{{index}}',
                        (index + 1).toString()
                      )}
                      // Updated Focus and Filled Colors (Teal/Emerald)
                      className={`
                        w-12 h-14 md:w-14 md:h-16 
                        text-center text-2xl md:text-3xl font-bold 
                        border-2 rounded-xl
                        transition-all duration-300
                        shadow-md
                        ${
                          focusedIndex === index
                            ? 'border-teal-500 ring-4 ring-teal-200 scale-105 bg-white'
                            : digit
                              ? 'border-teal-400 bg-teal-50'
                              : 'border-gray-300 bg-white/50'
                        }
                        ${disableForm ? 'opacity-50 cursor-not-allowed' : 'hover:border-teal-400'}
                      `}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Progress Indicator (Teal -> Orange) */}
              <div className="flex justify-center items-center gap-2">
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

              {/* Verify Button (Main Gradient) */}
              <motion.div
                whileHover={{ scale: disableForm ? 1 : 1.02 }}
                whileTap={{ scale: disableForm ? 1 : 0.98 }}
              >
                <Button
                  type="submit"
                  disabled={disableForm || !isCodeComplete}
                  className="w-full py-6 text-lg font-bold rounded-xl bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin h-6 w-6" />
                      <span>{dict.verifyingButton}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="h-6 w-6" />
                      <span>{dict.verifyButton}</span>
                      {isRTL ? (
                        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                      ) : (
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                  )}
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </motion.div>
            </form>

            {/* Resend Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  {dict.resend.prompt}
                </p>
                <motion.div
                  whileHover={{ scale: disableResend ? 1 : 1.05 }}
                  whileTap={{ scale: disableResend ? 1 : 0.95 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={disableResend}
                    className={`
                      px-6 py-3 rounded-full border-2 font-semibold
                      transition-all duration-300
                      ${
                        disableResend
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border-teal-500 text-teal-600 hover:bg-teal-50 hover:border-teal-600'
                      }
                    `}
                  >
                    {isResending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>{dict.resend.buttonLoading}</span>
                      </div>
                    ) : resendDisabled ? (
                      <div className="flex items-center gap-3">
                        <CircularTimer
                          seconds={resendTimer}
                          maxSeconds={RESEND_COOLDOWN}
                        />
                        <span>
                          {dict.resend.timer.replace(
                            '{{timer}}',
                            resendTimer.toString()
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>{dict.resend.button}</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Wrong Number Link */}
              <div className="text-center">
                <Link
                  href={`/${locale}/auth/update-phone`}
                  className={`
                    text-sm font-medium inline-flex items-center gap-2
                    transition-all duration-300
                    ${
                      disableForm
                        ? 'text-gray-400 pointer-events-none'
                        : 'text-teal-600 hover:text-teal-700 hover:gap-3'
                    }
                  `}
                >
                  <Clock className="h-4 w-4" />
                  <span>{dict.wrongNumberLink}</span>
                </Link>
              </div>
            </div>

            {/* Back to Sign In */}
            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                href={`/${locale}/auth/signin`}
                className={`
                  text-xs text-gray-500 hover:text-gray-700 
                  transition-colors duration-300
                  inline-flex items-center gap-2
                  ${disableForm ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                {isRTL ? (
                  <ArrowRight className="h-3 w-3" />
                ) : (
                  <ArrowLeft className="h-3 w-3" />
                )}
                <span>{dict.backToSignInLink}</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>מוגן באמצעות הצפנת SSL</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Custom Styles */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VerifyPhoneClient;
