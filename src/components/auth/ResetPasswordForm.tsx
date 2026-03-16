// src/components/auth/ForgotPasswordForm.tsx
// (Also known as ResetPasswordForm — this is the form on /reset-password page)
'use client';

import {
  useState,
  FormEvent,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Mail,
  ArrowRight,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface ResetPasswordFormProps {
  locale: 'he' | 'en';
  dict?: {
    title: string;
    subtitle: string;
    emailLabel: string;
    otpLabel: string;
    newPasswordLabel: string;
    confirmPasswordLabel: string;
    submitButton: string;
    submittingButton: string;
    backToSignIn: string;
    passwordHint: string;
    errors: {
      missingEmail: string;
      invalidOtp: string;
      invalidPassword: string;
      passwordMismatch: string;
      default: string;
    };
    success: {
      title: string;
      message: string;
      redirecting: string;
      goToSignIn: string;
    };
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_LENGTH = 6;
const REDIRECT_DELAY_SECONDS = 5;

// ============================================================================
// VALIDATION — Fixed: allows special characters
// ============================================================================

const validatePassword = (value: string): string | null => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(value)) {
    return 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.';
  }
  return null;
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const errorVariants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function ResetPasswordForm({
  locale,
  dict,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'he';

  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(
    REDIRECT_DELAY_SECONDS
  );

  // OTP refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Labels (fallback to Hebrew if no dict provided)
  const t = {
    title: dict?.title || 'איפוס סיסמה',
    subtitle:
      dict?.subtitle ||
      'הזן את קוד האימות (OTP) שקיבלת במייל ואת הסיסמה החדשה שלך.',
    emailLabel: dict?.emailLabel || 'כתובת מייל (לאימות)',
    otpLabel: dict?.otpLabel || 'קוד אימות',
    newPasswordLabel: dict?.newPasswordLabel || 'סיסמה חדשה',
    confirmPasswordLabel: dict?.confirmPasswordLabel || 'אימות סיסמה חדשה',
    submitButton: dict?.submitButton || 'אפס סיסמה',
    submittingButton: dict?.submittingButton || 'מאפס סיסמה...',
    backToSignIn: dict?.backToSignIn || 'חזרה להתחברות',
    passwordHint:
      dict?.passwordHint ||
      'חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.',
    errors: {
      missingEmail:
        dict?.errors?.missingEmail ||
        'כתובת המייל חסרה. אנא חזור להתחלה ונסה שנית.',
      invalidOtp:
        dict?.errors?.invalidOtp || 'קוד האימות חייב להיות בן 6 ספרות.',
      invalidPassword:
        dict?.errors?.invalidPassword ||
        'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר.',
      passwordMismatch:
        dict?.errors?.passwordMismatch || 'הסיסמאות אינן תואמות.',
      default: dict?.errors?.default || 'אירעה שגיאה באיפוס הסיסמה.',
    },
    success: {
      title: dict?.success?.title || 'הצלחה!',
      message:
        dict?.success?.message ||
        'הסיסמה אופסה בהצלחה! כעת תוכל להתחבר עם הסיסמה החדשה.',
      redirecting: dict?.success?.redirecting || 'מעביר לדף ההתחברות...',
      goToSignIn: dict?.success?.goToSignIn || 'עבור להתחברות עכשיו',
    },
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Pre-fill email from URL params
  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const tokenFromQuery = searchParams.get('token');
    if (emailFromQuery) setEmail(emailFromQuery);
    if (tokenFromQuery) {
      // Pre-fill OTP from token
      const digits = tokenFromQuery
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH)
        .split('');
      const newOtp = new Array(OTP_LENGTH).fill('');
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
    }
  }, [searchParams]);

  // Countdown timer after success
  useEffect(() => {
    if (!successMessage) return;
    if (redirectCountdown <= 0) {
      router.push(`/${locale}/auth/signin?reset=success`);
      return;
    }
    const timer = setTimeout(
      () => setRedirectCountdown((prev) => prev - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [successMessage, redirectCountdown, router, locale]);

  // ============================================================================
  // OTP HANDLERS
  // ============================================================================

  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = digit;
      return newOtp;
    });
    setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowLeft' && index > 0)
        otpRefs.current[index - 1]?.focus();
      if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1)
        otpRefs.current[index + 1]?.focus();
    },
    [otp]
  );

  const handleOtpPaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .replace(/\D/g, '')
        .split('');
      if (pasted.length === 0) return;
      setOtp((prev) => {
        const newOtp = [...prev];
        let nextIdx = index;
        for (const digit of pasted) {
          if (nextIdx >= OTP_LENGTH) break;
          newOtp[nextIdx] = digit;
          nextIdx++;
        }
        return newOtp;
      });
      const focusIdx = Math.min(index + pasted.length, OTP_LENGTH - 1);
      otpRefs.current[focusIdx]?.focus();
    },
    []
  );

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setPasswordError(null);
    setSuccessMessage(null);

    const otpCode = otp.join('');

    if (!email) {
      setError(t.errors.missingEmail);
      setIsLoading(false);
      return;
    }
    if (otpCode.length !== OTP_LENGTH || !/^\d+$/.test(otpCode)) {
      setError(t.errors.invalidOtp);
      setIsLoading(false);
      return;
    }
    const passValidationError = validatePassword(newPassword);
    if (passValidationError) {
      setPasswordError(passValidationError);
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.errors.passwordMismatch);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode, newPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t.errors.default);
      }

      setSuccessMessage(data.message || t.success.message);
      setOtp(new Array(OTP_LENGTH).fill(''));
      setNewPassword('');
      setConfirmPassword('');
      setRedirectCountdown(REDIRECT_DELAY_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.default);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const otpCode = otp.join('');
  const isOtpComplete = otpCode.length === OTP_LENGTH;
  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsDontMatch =
    newPassword && confirmPassword && newPassword !== confirmPassword;

  const canSubmit =
    !isLoading &&
    !passwordError &&
    isOtpComplete &&
    !!newPassword &&
    !!confirmPassword &&
    newPassword === confirmPassword;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative border border-white/50">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500" />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.title}</h1>
          <p className="text-gray-600 text-sm">{t.subtitle}</p>
        </div>

        {/* Error alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-4"
            >
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{isRTL ? 'שגיאה' : 'Error'}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {passwordError && !error && (
            <motion.div
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-4"
            >
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {isRTL ? 'שגיאת סיסמה' : 'Password Error'}
                </AlertTitle>
                <AlertDescription id="password-error-message">
                  {passwordError}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success state */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4"
            >
              <Alert
                variant="default"
                className="bg-green-50 border-green-200 text-green-700"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>{t.success.title}</AlertTitle>
                <AlertDescription>
                  {successMessage}
                  <br />
                  <span className="text-sm mt-1 block">
                    {t.success.redirecting} ({redirectCountdown})
                  </span>
                </AlertDescription>
              </Alert>
              <Button
                onClick={() =>
                  router.push(`/${locale}/auth/signin?reset=success`)
                }
                className="w-full mt-3 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600"
              >
                {t.success.goToSignIn}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form — hidden after success */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {t.emailLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="email"
                  id="email-reset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 focus:outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* OTP — 6 separate inputs */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {t.otpLabel} <span className="text-red-500">*</span>
              </label>
              <div className="flex justify-center gap-2" dir="ltr">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) =>
                      handleOtpKeyDown(
                        index,
                        e as KeyboardEvent<HTMLInputElement>
                      )
                    }
                    onPaste={(e) =>
                      handleOtpPaste(
                        e as ClipboardEvent<HTMLInputElement>,
                        index
                      )
                    }
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    disabled={isLoading}
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    aria-label={`OTP digit ${index + 1}`}
                    className={`
                      w-11 h-13 md:w-12 md:h-14 text-center text-xl font-semibold
                      border-2 rounded-xl transition-all duration-200
                      ${
                        digit
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-teal-300'
                      }
                      focus:border-teal-500 focus:ring-2 focus:ring-teal-200
                    `}
                  />
                ))}
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label
                htmlFor="new-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {t.newPasswordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password-reset"
                  aria-describedby={
                    passwordError ? 'password-error-message' : 'password-hint'
                  }
                  aria-invalid={!!passwordError}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    const validationErr = validatePassword(e.target.value);
                    if (e.target.value && validationErr)
                      setPasswordError(validationErr);
                    else setPasswordError(null);
                  }}
                  placeholder={
                    isRTL
                      ? 'לפחות 8 תווים, אות גדולה, קטנה ומספר'
                      : 'Min 8 chars, upper, lower & number'
                  }
                  required
                  className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {!passwordError && (
                <p id="password-hint" className="mt-1 text-xs text-gray-500">
                  {t.passwordHint}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="confirm-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {t.confirmPasswordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password-reset"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={
                    isRTL ? 'הזן את הסיסמה החדשה שוב' : 'Re-enter new password'
                  }
                  required
                  className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    passwordsDontMatch
                      ? 'border-red-400 focus:ring-red-200'
                      : passwordsMatch
                        ? 'border-green-400 focus:ring-green-200'
                        : 'border-gray-300 focus:ring-teal-200 focus:border-teal-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {/* Real-time password match indicator */}
              <AnimatePresence>
                {confirmPassword && (
                  <motion.p
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`text-xs mt-1 flex items-center gap-1 ${
                      passwordsMatch ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {isRTL ? 'הסיסמאות תואמות' : 'Passwords match'}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        {isRTL
                          ? 'הסיסמאות אינן תואמות'
                          : "Passwords don't match"}
                      </>
                    )}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t.submittingButton}</span>
                </>
              ) : (
                t.submitButton
              )}
            </Button>
          </form>
        )}

        {/* Back to sign in */}
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/auth/signin`}
            className="text-sm text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            {isRTL ? (
              <ArrowRight className="w-3 h-3" />
            ) : (
              <ArrowLeft className="w-3 h-3" />
            )}
            {t.backToSignIn}
          </Link>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>
            {isRTL ? 'חיבור מאובטח ומוצפן' : 'Secure encrypted connection'}
          </span>
        </div>
      </div>
    </div>
  );
}
