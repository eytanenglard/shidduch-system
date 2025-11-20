// src/components/auth/ResetPasswordClient.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  KeyRound,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface ResetPasswordClientProps {
  locale: 'he' | 'en';
}

type ResetStatus = 'idle' | 'submitting' | 'success' | 'error';

interface PasswordValidation {
  length: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export default function ResetPasswordClient({ locale }: ResetPasswordClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const isHebrew = locale === 'he';

  // State Management
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<ResetStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });
  const [showValidation, setShowValidation] = useState(false);

  // Password validation in real-time
  useEffect(() => {
    if (newPassword) {
      setPasswordValidation({
        length: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /[0-9]/.test(newPassword),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      });
      setShowValidation(true);
    } else {
      setShowValidation(false);
    }
  }, [newPassword]);

  // Check if password is valid
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Check if passwords match
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    // Validation
    if (!email) {
      setErrorMessage(dict.errors.missingEmail);
      setStatus('error');
      return;
    }

    if (!otp || otp.length !== 6) {
      setErrorMessage(dict.errors.invalidOtp);
      setStatus('error');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(isHebrew ? 'הסיסמה לא עומדת בדרישות' : 'Password does not meet requirements');
      setStatus('error');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage(dict.errors.passwordsMismatch);
      setStatus('error');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || dict.errors.default);
      }

      setStatus('success');

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/signin?reset=success`);
      }, 3000);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : dict.errors.default);
    }
  };

  // Dictionary (inline for now)
  const dict = {
    title: isHebrew ? 'איפוס סיסמה' : 'Reset Password',
    subtitle: isHebrew
      ? 'הזן את הקוד שקיבלת במייל וסיסמה חדשה'
      : 'Enter the code you received and a new password',
    emailLabel: isHebrew ? 'כתובת מייל' : 'Email Address',
    otpLabel: isHebrew ? 'קוד אימות' : 'Verification Code',
    otpPlaceholder: isHebrew ? 'הזן קוד בן 6 ספרות' : 'Enter 6-digit code',
    newPasswordLabel: isHebrew ? 'סיסמה חדשה' : 'New Password',
    newPasswordPlaceholder: isHebrew ? 'בחר סיסמה חזקה' : 'Choose a strong password',
    confirmPasswordLabel: isHebrew ? 'אימות סיסמה' : 'Confirm Password',
    confirmPasswordPlaceholder: isHebrew ? 'הזן שוב את הסיסמה' : 'Re-enter password',
    submitButton: isHebrew ? 'איפוס סיסמה' : 'Reset Password',
    submitting: isHebrew ? 'מאפס סיסמה...' : 'Resetting Password...',
    successTitle: isHebrew ? 'הסיסמה אופסה בהצלחה!' : 'Password Reset Successfully!',
    successMessage: isHebrew
      ? 'הסיסמה שלך שונתה בהצלחה. מעביר אותך לדף ההתחברות...'
      : 'Your password has been changed. Redirecting to sign in...',
    backToSignIn: isHebrew ? 'חזרה להתחברות' : 'Back to Sign In',
    validation: {
      title: isHebrew ? 'דרישות סיסמה:' : 'Password Requirements:',
      length: isHebrew ? 'לפחות 8 תווים' : 'At least 8 characters',
      uppercase: isHebrew ? 'אות גדולה אחת לפחות' : 'One uppercase letter',
      lowercase: isHebrew ? 'אות קטנה אחת לפחות' : 'One lowercase letter',
      number: isHebrew ? 'ספרה אחת לפחות' : 'One number',
      special: isHebrew ? 'תו מיוחד אחד לפחות' : 'One special character',
    },
    passwordMatch: isHebrew ? 'הסיסמאות תואמות' : 'Passwords match',
    passwordNoMatch: isHebrew ? 'הסיסמאות אינן תואמות' : 'Passwords do not match',
    errors: {
      missingEmail: isHebrew ? 'כתובת מייל חסרה' : 'Email address is missing',
      invalidOtp: isHebrew ? 'קוד אימות לא תקין' : 'Invalid verification code',
      passwordsMismatch: isHebrew ? 'הסיסמאות אינן תואמות' : 'Passwords do not match',
      default: isHebrew ? 'אירעה שגיאה באיפוס הסיסמה' : 'An error occurred resetting password',
    },
    securityNote: isHebrew
      ? 'הקוד תקף ל-15 דקות. אם לא קיבלת קוד, חזור לדף שכחתי סיסמה'
      : 'Code is valid for 15 minutes. If you didn\'t receive a code, go back to forgot password',
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-purple-200/40 to-indigo-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-pink-200/40 to-rose-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-300/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Gradient Header */}
          <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"></div>

          <div className="p-8 sm:p-10">
            {/* Icon & Title Section */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="relative inline-block mb-6">
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg"
                >
                  <KeyRound className="w-10 h-10 text-white" strokeWidth={2.5} />
                </motion.div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-3">
                {dict.title}
              </h1>
              <p className="text-gray-600 text-base">
                {dict.subtitle}
              </p>
            </motion.div>

            {/* Success State */}
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 shadow-lg"
                  >
                    <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {dict.successTitle}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {dict.successMessage}
                  </p>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-2 text-cyan-600"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{isHebrew ? 'מעביר...' : 'Redirecting...'}</span>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Email Display (Read-only) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {dict.emailLabel}
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={email}
                        readOnly
                        className="w-full pr-12 py-3 text-gray-600 bg-gray-50 border-gray-200 rounded-xl cursor-not-allowed"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* OTP Input */}
                  <div>
                    <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                      {dict.otpLabel}
                    </label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder={dict.otpPlaceholder}
                      disabled={status === 'submitting'}
                      className="w-full py-3 text-center text-xl font-bold tracking-widest rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:ring-purple-400"
                      dir="ltr"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      {dict.newPasswordLabel}
                    </label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={dict.newPasswordPlaceholder}
                        disabled={status === 'submitting'}
                        className="w-full pr-12 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:ring-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Validation */}
                    <AnimatePresence>
                      {showValidation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                        >
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            {dict.validation.title}
                          </p>
                          <div className="space-y-1.5">
                            {[
                              { key: 'length', label: dict.validation.length },
                              { key: 'uppercase', label: dict.validation.uppercase },
                              { key: 'lowercase', label: dict.validation.lowercase },
                              { key: 'number', label: dict.validation.number },
                              { key: 'special', label: dict.validation.special },
                            ].map(({ key, label }) => {
                              const isValid = passwordValidation[key as keyof PasswordValidation];
                              return (
                                <motion.div
                                  key={key}
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  {isValid ? (
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                  <span className={isValid ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                    {label}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      {dict.confirmPasswordLabel}
                    </label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={dict.confirmPasswordPlaceholder}
                        disabled={status === 'submitting'}
                        className={`w-full pr-12 py-3 rounded-xl border-2 transition-colors ${
                          confirmPassword
                            ? passwordsMatch
                              ? 'border-green-400 focus:border-green-500 focus:ring-green-400'
                              : 'border-red-400 focus:border-red-500 focus:ring-red-400'
                            : 'border-gray-300 focus:border-purple-400 focus:ring-purple-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-2 flex items-center gap-2 text-xs font-medium ${
                          passwordsMatch ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {passwordsMatch ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{dict.passwordMatch}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            <span>{dict.passwordNoMatch}</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {status === 'error' && errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-red-600 text-sm">{errorMessage}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={status === 'submitting' || !otp || !isPasswordValid || !passwordsMatch}
                    className="w-full py-6 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {dict.submitting}
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2 group-hover:rotate-6 transition-transform" />
                        {dict.submitButton}
                      </>
                    )}
                  </Button>

                  {/* Security Note */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-800 leading-relaxed">
                        {dict.securityNote}
                      </p>
                    </div>
                  </div>

                  {/* Back Link */}
                  <div className="text-center pt-2">
                    <Link
                      href={`/${locale}/auth/signin`}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors group"
                    >
                      <ArrowLeft className={`w-4 h-4 group-hover:-translate-x-1 transition-transform ${isHebrew ? '' : 'rotate-180'}`} />
                      <span>{dict.backToSignIn}</span>
                    </Link>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 10, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl opacity-20 blur-xl"
        />
      </motion.div>
    </div>
  );
}