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
  LogIn,
} from 'lucide-react';
import { signIn } from 'next-auth/react'; // ✅ ייבוא signIn

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ForgotPasswordDict } from '@/types/dictionaries/auth';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface ForgotPasswordClientProps {
  dict: ForgotPasswordDict;
  locale: 'he' | 'en';
}

// Animation variants (כמו קודם)
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

// DynamicBackground component (כמו קודם)
const DynamicBackground: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    {/* ... כל הקוד של הרקע כמו קודם ... */}
  </div>
);

export default function ForgotPasswordClient({
  dict,
  locale,
}: ForgotPasswordClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<string[]>([]); // ✅ state חדש לספקים
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // ✅ state לכפתור Google

  const isRTL = locale === 'he';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOauthProviders([]); // איפוס הספקים

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

      // טיפול במשתמשי OAuth
      if (!response.ok) {
        if (data.isOAuthAccount) {
          setError(data.error);
          setOauthProviders(data.providers || []); // ✅ שמירת הספקים
          setIsLoading(false);
          return;
        }
        throw new Error(data.error || dict.errors.default);
      }

      if (!data.success) {
        throw new Error(data.error || dict.errors.default);
      }

      setSuccess(true);

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

  // ✅ פונקציה להתחברות עם Google
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn('google', {
        callbackUrl: `/${locale}/dashboard`,
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(
        locale === 'he'
          ? 'שגיאה בהתחברות עם Google'
          : 'Error signing in with Google'
      );
    } finally {
      setIsGoogleLoading(false);
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
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400" />

            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-transparent rounded-full transform translate-x-20 -translate-y-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full transform -translate-x-16 translate-y-16 pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-8"
                  >
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
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-orange-50 rounded-2xl border border-teal-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-teal-500" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pt-1">
                          {locale === 'he'
                            ? 'נשלח לך קישור לאיפוס הסיסמה למייל שרשמת'
                            : "We'll send you a link to reset your password"}
                        </p>
                      </div>
                    </motion.div>

                    {/* Error Alert עם כפתור Google */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          className="mb-6"
                        >
                          <Alert
                            variant={
                              oauthProviders.length > 0
                                ? 'default'
                                : 'destructive'
                            }
                            className={
                              oauthProviders.length > 0
                                ? 'border-2 border-blue-200 bg-blue-50'
                                : 'border-2'
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 ${oauthProviders.length > 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-lg flex-shrink-0`}
                              >
                                {oauthProviders.length > 0 ? (
                                  <LogIn className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <AlertTitle className="font-bold mb-1">
                                  {oauthProviders.length > 0
                                    ? locale === 'he'
                                      ? 'חשבון קיים'
                                      : 'Account Found'
                                    : dict.errors.title}
                                </AlertTitle>
                                <AlertDescription className="text-sm">
                                  {error}
                                </AlertDescription>

                                {/* ✅ כפתור Google אם זה משתמש Google */}
                                {oauthProviders.includes('google') && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mt-4"
                                  >
                                    <Button
                                      onClick={handleGoogleSignIn}
                                      disabled={isGoogleLoading}
                                      className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-3 py-3 rounded-xl font-medium"
                                    >
                                      {isGoogleLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                      ) : (
                                        <>
                                          <GoogleIcon />
                                          <span>
                                            {locale === 'he'
                                              ? 'התחבר עם Google'
                                              : 'Sign in with Google'}
                                          </span>
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-400 focus:outline-none transition-all bg-white/50 backdrop-blur-sm hover:border-gray-300 text-gray-800 placeholder:text-gray-400`}
                            disabled={isLoading}
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group relative overflow-hidden"
                      >
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

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 opacity-50" />
          </div>
        </motion.div>

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
