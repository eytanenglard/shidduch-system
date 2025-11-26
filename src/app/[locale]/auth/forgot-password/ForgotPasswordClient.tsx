// src/app/[locale]/auth/forgot-password/ForgotPasswordClient.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Mail,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  KeyRound,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ForgotPasswordDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ForgotPasswordClientProps {
  dict: ForgotPasswordDict;
  locale: 'he' | 'en';
}

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

// ============================================================================
// BACKGROUND COMPONENT (Teal/Orange Theme)
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

    {/* Dot Pattern (Teal) */}
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px]" />

    {/* SVG Decorative Wave (Teal -> Orange) */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,200 C300,100 700,300 1000,200 L1000,0 L0,0 Z"
        fill="url(#waveGrad)"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ForgotPasswordClient({
  dict,
  locale,
}: ForgotPasswordClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isRTL = locale === 'he';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email) {
      setError(dict.errors.missingEmail);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/auth/request-password-reset?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || dict.errors.default);
      }

      // Show success message before redirect
      setSuccess(true);

      // Redirect after showing success
      setTimeout(() => {
        router.push(
          `/${locale}/auth/reset-password?email=${encodeURIComponent(email)}`
        );
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errors.default);
      setIsLoading(false);
    }
  };

  return (
    <>
      <DynamicBackground />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
        {/* Back to Sign In Link */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute top-6 ${isRTL ? 'right-6' : 'left-6'}`}
        >
          <Link
            href={`/${locale}/auth/signin`}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
          >
            {isRTL ? (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            ) : (
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            )}
            <span className="text-sm font-medium">
              {locale === 'he' ? 'חזרה להתחברות' : 'Back to Sign In'}
            </span>
          </Link>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 text-center"
        >
          <motion.div variants={itemVariants} className="mb-4">
            {/* Key Icon Background: Teal -> Orange */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-orange-500 rounded-2xl shadow-lg mb-6">
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <KeyRound className="w-10 h-10 text-white" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-3"
          >
            {/* Title Gradient: Teal -> Orange -> Amber */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient-slow">
              {dict.title}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-600 text-base md:text-lg max-w-md mx-auto px-4"
          >
            {dict.subtitle}
          </motion.p>

          {/* Decorative Line (Teal -> Orange) */}
          <motion.div variants={itemVariants} className="relative mt-6">
            <div className="w-20 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 rounded-full mx-auto" />
          </motion.div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden relative">
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400" />

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-transparent rounded-full transform translate-x-20 -translate-y-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full transform -translate-x-16 translate-y-16 pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8">
              {/* Success State */}
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-8"
                  >
                    {/* Success Icon (Green is usually good to keep for success, or switch to Teal) */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.2,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-gray-800 mb-3"
                    >
                      {locale === 'he' ? 'נשלח בהצלחה!' : 'Email Sent!'}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-600 mb-6"
                    >
                      {locale === 'he'
                        ? 'מעביר אותך לדף איפוס הסיסמה...'
                        : 'Redirecting to reset password...'}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {/* Loader -> Teal */}
                      <Loader2 className="w-6 h-6 animate-spin text-teal-500 mx-auto" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Info Box -> Teal/Orange mix */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-orange-50 rounded-2xl border border-teal-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg flex-shrink-0">
                          {/* Sparkles -> Teal */}
                          <Sparkles className="w-5 h-5 text-teal-500" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pt-1">
                          {locale === 'he'
                            ? 'נשלח לך קישור לאיפוס הסיסמה למייל שרשמת'
                            : "We'll send you a link to reset your password"}
                        </p>
                      </div>
                    </motion.div>

                    {/* Error Alert */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="mb-6"
                        >
                          <Alert variant="destructive" className="border-2">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              </div>
                              <div className="flex-1">
                                <AlertTitle className="font-bold mb-1">
                                  {dict.errors.title}
                                </AlertTitle>
                                <AlertDescription className="text-sm">
                                  {error}
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email Field */}
                      <div className="space-y-2">
                        <label
                          htmlFor="email-forgot"
                          className="block text-sm font-semibold text-gray-700"
                        >
                          {dict.emailLabel}
                        </label>
                        <div className="relative group">
                          <div
                            className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 transition-colors ${
                              email ? 'text-teal-500' : 'text-gray-400'
                            }`}
                          >
                            <Mail className="h-5 w-5" />
                          </div>
                          <Input
                            type="email"
                            id="email-forgot"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={dict.emailPlaceholder}
                            required
                            // Input Focus -> Teal
                            className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-400 focus:outline-none transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 text-gray-800 placeholder:text-gray-400`}
                            disabled={isLoading}
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        </div>
                      </div>

                      {/* Submit Button -> Teal/Orange/Amber */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group relative overflow-hidden"
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>{dict.submitButtonLoading}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            <span>{dict.submitButton}</span>
                          </>
                        )}
                      </Button>
                    </form>

                    {/* Back Link */}
                    <div className="mt-8 text-center">
                      <p className="text-gray-600 text-sm">
                        {locale === 'he'
                          ? 'זכרת את הסיסמה?'
                          : 'Remember your password?'}{' '}
                        <Link
                          href={`/${locale}/auth/signin`}
                          className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors inline-flex items-center gap-1"
                        >
                          {dict.backToSignInLink}
                          {isRTL ? (
                            <ArrowLeft className="w-3 h-3" />
                          ) : (
                            <ArrowRight className="w-3 h-3" />
                          )}
                        </Link>
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Shine Effect -> Teal/Orange */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 opacity-50" />
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-center max-w-md"
        >
          <p className="text-xs text-gray-500">
            {locale === 'he'
              ? 'לא קיבלת מייל? בדוק את תיקיית הספאם או נסה שוב'
              : "Didn't receive an email? Check your spam folder or try again"}
          </p>
        </motion.div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes gradient-slow {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradient-slow 6s ease infinite;
        }
      `}</style>
    </>
  );
}
