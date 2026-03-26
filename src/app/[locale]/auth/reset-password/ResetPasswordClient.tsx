// src/app/[locale]/auth/reset-password/ResetPasswordClient.tsx
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
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResetPasswordDict } from '@/types/dictionaries/auth';

// ============================================================================
// CONSTANTS
// ============================================================================

const OTP_LENGTH = 6;
const REDIRECT_DELAY_SECONDS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

// ============================================================================
// TYPES
// ============================================================================

interface ResetPasswordClientProps {
  dict: ResetPasswordDict;
  locale: 'he' | 'en';
}

// ============================================================================
// PASSWORD VALIDATION HELPERS
// ============================================================================

interface PasswordCheck {
  label: string;
  passed: boolean;
}

function getPasswordChecks(password: string, isRTL: boolean): PasswordCheck[] {
  return [
    {
      label: isRTL ? '8 תווים לפחות' : 'At least 8 characters',
      passed: password.length >= 8,
    },
    {
      label: isRTL ? 'אות גדולה באנגלית' : 'Uppercase letter',
      passed: /[A-Z]/.test(password),
    },
    {
      label: isRTL ? 'אות קטנה באנגלית' : 'Lowercase letter',
      passed: /[a-z]/.test(password),
    },
    {
      label: isRTL ? 'ספרה' : 'A number',
      passed: /\d/.test(password),
    },
  ];
}

function isPasswordValid(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: 'bg-gray-200' };
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    password.length >= 12,
    /[!@#$%^&*(),.?":{}|<>]/.test(password),
  ];
  const passed = checks.filter(Boolean).length;
  if (passed <= 2) return { level: 1, label: 'weak', color: 'bg-red-500' };
  if (passed <= 4) return { level: 2, label: 'medium', color: 'bg-amber-500' };
  return { level: 3, label: 'strong', color: 'bg-green-500' };
}

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

export default function ResetPasswordClient({
  dict,
  locale,
}: ResetPasswordClientProps) {
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
  const [isExpiredError, setIsExpiredError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_DELAY_SECONDS);

  // Resend state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // OTP refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Pre-fill email and token from URL params
  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const tokenFromQuery = searchParams.get('token');
    if (emailFromQuery) setEmail(emailFromQuery);
    if (tokenFromQuery) {
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
    // Start resend cooldown on page load (assumes OTP was just sent)
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(
      () => setResendCooldown((prev) => prev - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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
    setIsExpiredError(false);
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
  // RESEND OTP
  // ============================================================================

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending || !email) return;
    setIsResending(true);
    setError(null);
    setIsExpiredError(false);

    try {
      const response = await fetch(
        `/api/auth/request-password-reset?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      await response.json();
      // Always show success (generic message to prevent enumeration)
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp(new Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } catch {
      // Silently handle - don't reveal if email exists
    } finally {
      setIsResending(false);
    }
  };

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsExpiredError(false);
    setSuccessMessage(null);

    const otpCode = otp.join('');

    if (!email) {
      setError(dict.errors.missingEmail);
      setIsLoading(false);
      return;
    }
    if (otpCode.length !== OTP_LENGTH || !/^\d+$/.test(otpCode)) {
      setError(dict.errors.invalidOtp);
      setIsLoading(false);
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setError(dict.passwordValidation.length);
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(dict.errors.passwordsMismatch);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/auth/reset-password?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: otpCode, newPassword }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || dict.errors.default;
        // Detect expired OTP errors
        const isExpired =
          errorMsg.includes('פג') ||
          errorMsg.includes('expired') ||
          errorMsg.includes('חרגת') ||
          errorMsg.includes('attempts');
        setIsExpiredError(isExpired);
        throw new Error(errorMsg);
      }

      setSuccessMessage(data.message || dict.successMessage);
      setOtp(new Array(OTP_LENGTH).fill(''));
      setNewPassword('');
      setConfirmPassword('');
      setRedirectCountdown(REDIRECT_DELAY_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errors.default);
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
  const passwordChecks = getPasswordChecks(newPassword, isRTL);
  const passwordStrength = getPasswordStrength(newPassword);

  const canSubmit =
    !isLoading &&
    isOtpComplete &&
    isPasswordValid(newPassword) &&
    !!confirmPassword &&
    newPassword === confirmPassword;

  const strengthLabels: Record<string, string> = {
    weak: isRTL ? 'חלשה' : 'Weak',
    medium: isRTL ? 'בינונית' : 'Medium',
    strong: isRTL ? 'חזקה' : 'Strong',
  };

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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{dict.title}</h1>
          <p className="text-gray-600 text-sm">{dict.subtitle}</p>
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
                <AlertDescription>
                  {error}
                  {/* CTA for expired/exhausted OTP */}
                  {isExpiredError && email && (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || isResending}
                      className="block mt-2 text-sm font-semibold text-red-700 hover:text-red-800 underline transition-colors disabled:opacity-50 disabled:no-underline"
                    >
                      {isResending
                        ? isRTL ? 'שולח...' : 'Sending...'
                        : resendCooldown > 0
                          ? isRTL ? `שלח קוד חדש (${resendCooldown})` : `Resend code (${resendCooldown})`
                          : isRTL ? 'שלח קוד חדש' : 'Send new code'}
                    </button>
                  )}
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
                <AlertTitle>{isRTL ? 'הצלחה!' : 'Success!'}</AlertTitle>
                <AlertDescription>
                  {successMessage}
                  <br />
                  <span className="text-sm mt-1 block">
                    {dict.successRedirect} ({redirectCountdown})
                  </span>
                </AlertDescription>
              </Alert>
              <Button
                onClick={() =>
                  router.push(`/${locale}/auth/signin?reset=success`)
                }
                className="w-full mt-3 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600"
              >
                {isRTL ? 'עבור להתחברות עכשיו' : 'Go to Sign In'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.emailLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5`} />
                <Input
                  type="email"
                  id="email-reset"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.emailPlaceholder}
                  required
                  className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 focus:outline-none`}
                  disabled={isLoading || !!searchParams.get('email')}
                />
              </div>
            </div>

            {/* OTP - 6 separate inputs */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {dict.otpLabel} <span className="text-red-500">*</span>
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

              {/* Resend OTP button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending || !email}
                  className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {isResending
                    ? isRTL ? 'שולח...' : 'Sending...'
                    : resendCooldown > 0
                      ? isRTL
                        ? `שלח קוד מחדש (${resendCooldown} שניות)`
                        : `Resend code (${resendCooldown}s)`
                      : isRTL
                        ? 'לא קיבלת קוד? שלח שוב'
                        : "Didn't get a code? Resend"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label
                htmlFor="new-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.newPasswordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5`} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password-reset"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={dict.newPasswordPlaceholder}
                  required
                  className={`w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 border rounded-lg focus:ring-2 focus:outline-none border-gray-300 focus:ring-teal-200 focus:border-teal-500`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700`}
                  aria-label={showPassword ? dict.hidePasswordAria : dict.showPasswordAria}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 space-y-2"
                >
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            passwordStrength.level >= level
                              ? passwordStrength.color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <span className={`text-xs font-medium ${
                        passwordStrength.level === 1 ? 'text-red-500' :
                        passwordStrength.level === 2 ? 'text-amber-500' :
                        'text-green-500'
                      }`}>
                        {strengthLabels[passwordStrength.label] || passwordStrength.label}
                      </span>
                    )}
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {passwordChecks.map((check, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          check.passed ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {check.passed ? (
                          <Check className="w-3 h-3 flex-shrink-0" />
                        ) : (
                          <X className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="confirm-password-reset"
                className="block text-sm font-medium text-gray-700"
              >
                {dict.confirmPasswordLabel} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5`} />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password-reset"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={dict.confirmPasswordPlaceholder}
                  required
                  className={`w-full ${isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 border rounded-lg focus:ring-2 focus:outline-none ${
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
                  className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700`}
                  aria-label={
                    showConfirmPassword
                      ? dict.hidePasswordAria
                      : dict.showPasswordAria
                  }
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
                  <span>{dict.submitButtonLoading}</span>
                </>
              ) : (
                dict.submitButton
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
            {dict.backToSignInLink}
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
