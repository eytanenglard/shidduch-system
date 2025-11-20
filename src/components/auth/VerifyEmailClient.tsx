// src/components/auth/VerifyEmailClient.tsx
'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
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

export default function VerifyEmailClient({ locale }: VerifyEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const isHebrew = locale === 'he';

  // State Management
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Refs for input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && status === 'idle') {
      handleVerifyCode(fullCode);
    }
  }, [code, status]);

  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last digit
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept 6-digit codes
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  // Verify code with API
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
      
      // Redirect to continue registration after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/register?step=personal-details&email=${encodeURIComponent(email)}`);
      }, 2000);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה');
      setCode(Array(6).fill('')); // Clear code on error
      inputRefs.current[0]?.focus();
    }
  };

  // Resend verification code
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

      // Reset countdown
      setCanResend(false);
      setResendCountdown(60);
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'אירעה שגיאה בשליחת הקוד');
    } finally {
      setIsResending(false);
    }
  };

  // Dictionary (inline for now)
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
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-cyan-50 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-cyan-200/40 to-blue-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-pink-200/40 to-rose-300/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-indigo-300/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Gradient Header */}
          <div className="h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>

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
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg"
                >
                  <Mail className="w-10 h-10 text-white" strokeWidth={2.5} />
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
              <p className="text-gray-600 text-base mb-4">
                {dict.subtitle}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-50 to-pink-50 rounded-full border border-cyan-100">
                <Mail className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700">
                  {dict.emailSentTo} <span className="text-cyan-600">{email}</span>
                </span>
              </div>
            </motion.div>

            {/* Code Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-8"
            >
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                {dict.enterCode}
              </label>
              
              <div className="flex justify-center gap-2 sm:gap-3 mb-6" dir="ltr">
                {code.map((digit, index) => (
                  <motion.input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={status === 'verifying' || status === 'success'}
                    whileFocus={{ scale: 1.05 }}
                    className={`
                      w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl
                      border-2 transition-all duration-200
                      ${
                        status === 'error'
                          ? 'border-red-400 bg-red-50 text-red-600'
                          : status === 'success'
                          ? 'border-green-400 bg-green-50 text-green-600'
                          : digit
                          ? 'border-cyan-400 bg-cyan-50 text-gray-800'
                          : 'border-gray-300 bg-white text-gray-800'
                      }
                      focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                      disabled:opacity-60 disabled:cursor-not-allowed
                    `}
                  />
                ))}
              </div>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {status === 'verifying' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center justify-center gap-2 text-cyan-600 mb-4"
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
                      <span className="text-green-700 font-bold">{dict.success}</span>
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
                      disabled={isResending}
                      variant="outline"
                      size="sm"
                      className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 rounded-full px-6 py-2"
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
                        {dict.resendIn} <span className="font-bold text-gray-800">{resendCountdown}</span> {dict.seconds}
                      </span>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 italic">{dict.checkSpam}</p>
                </div>
              )}
            </motion.div>

            {/* Security Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 mb-6"
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-800">{dict.securityNote}</p>
              </div>
            </motion.div>

            {/* Back Link */}
            <div className="text-center">
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-cyan-600 transition-colors group"
              >
                <ArrowLeft className={`w-4 h-4 group-hover:-translate-x-1 transition-transform ${isHebrew ? '' : 'rotate-180'}`} />
                <span>{dict.backToRegister}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl opacity-20 blur-xl"
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

      {/* Custom Styles */}
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