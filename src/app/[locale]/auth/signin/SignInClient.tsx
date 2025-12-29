// src/app/[locale]/auth/signin/SignInClient.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Heart,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { SignInDict } from '@/types/dictionaries/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SignInClientProps {
  dict: SignInDict;
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
// BACKGROUND COMPONENT
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
        y: [0, 35, 0],
        scale: [1, 1.12, 1],
      }}
      transition={{
        duration: 16,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 0.5,
      }}
    />

    {/* Dot Pattern */}
    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:24px_24px]" />

    {/* SVG Decorative Waves */}
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1000 1000"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,200 C300,100 700,300 1000,200 L1000,0 L0,0 Z"
        fill="url(#waveGrad1)"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  </div>
);

// ============================================================================
// MAIN SIGNIN COMPONENT
// ============================================================================

export default function SignInClient({ dict, locale }: SignInClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const isRTL = locale === 'he';

  // Handle authenticated redirect
  useEffect(() => {
    if (status === 'authenticated') {
      const redirectUrl = session?.redirectUrl || `/${locale}/profile`;
      router.push(redirectUrl);
    }
  }, [status, session, router, locale]);

  // Handle URL error parameters
  useEffect(() => {
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      switch (errorMessage) {
        case 'CredentialsSignin':
          setError(dict.errors.credentialsSignin);
          break;
        case 'OAuthAccountNotLinked':
          setError(dict.errors.oauthAccountNotLinked);
          break;
        default:
          setError(dict.errors.default.replace('{errorMessage}', errorMessage));
      }
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }
  }, [searchParams, dict.errors]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError(dict.errors.missingFields);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
      setIsLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(dict.errors.credentialsSignin);
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 500);
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    await signIn(
      'google',
      {
        callbackUrl: `/${locale}/auth/register`,
      },
      {
        hl: locale,
      }
    );
  };

  // Show loading state
  if (status === 'loading' || status === 'authenticated') {
    const loadingText =
      status === 'authenticated' ? dict.loader.success : dict.loader.loading;
    const subText =
      status === 'authenticated'
        ? dict.loader.redirecting
        : dict.loader.checking;

    return (
      <>
        <DynamicBackground />
        <StandardizedLoadingSpinner text={loadingText} subtext={subText} />
      </>
    );
  }

  // Main sign-in form
  return (
    <>
      <DynamicBackground />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 text-center"
        >
          <motion.div variants={itemVariants} className="mb-4">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Heart -> Orange */}
                <Heart className="w-5 h-5 text-orange-500" />
              </motion.div>
              <span className="text-sm font-medium text-gray-700">
                {locale === 'he' ? 'ברוכים השבים' : 'Welcome Back'}
              </span>
              {/* Sparkles -> Teal */}
              <Sparkles className="w-5 h-5 text-teal-500" />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold mb-3"
          >
            {/* Title Gradient -> Teal-Orange-Amber */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 animate-gradient-slow">
              {dict.title}
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-600 text-base md:text-lg max-w-md mx-auto"
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
          animate={
            shouldShake
              ? { opacity: 1, y: 0, x: [-10, 10, -10, 10, 0] }
              : { opacity: 1, y: 0 }
          }
          transition={
            shouldShake ? { duration: 0.5 } : { duration: 0.5, delay: 0.3 }
          }
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden relative">
            {/* Top Gradient Line (Teal -> Orange) */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 pointer-events-none" />

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-400/10 to-transparent rounded-full transform translate-x-20 -translate-y-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full transform -translate-x-16 translate-y-16 pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6"
                  >
                    <div
                      role="alert"
                      className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 shadow-sm"
                    >
                      <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-red-800 text-sm font-medium leading-relaxed">
                          {error}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-5 mb-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    {dict.emailLabel}
                  </Label>
                  <div className="relative group">
                    <div
                      className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 transition-colors ${
                        email ? 'text-teal-500' : 'text-gray-400'
                      }`}
                    >
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      // Focus Colors: Teal
                      className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-400 focus:outline-none transition-colors bg-white/50 backdrop-blur-sm hover:border-gray-300 text-gray-800 placeholder:text-gray-400 relative z-10 touch-manipulation`}
                      placeholder={dict.emailPlaceholder}
                      required
                      disabled={isLoading || isGoogleLoading}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      {dict.passwordLabel}
                    </Label>
                  </div>
                  <div className="relative group">
                    <div
                      className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 transition-colors ${
                        password ? 'text-teal-500' : 'text-gray-400'
                      }`}
                    >
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      // Focus Colors: Teal
                      className={`w-full ${isRTL ? 'pr-11 pl-12' : 'pl-11 pr-12'} py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-200 focus:border-teal-400 focus:outline-none transition-colors bg-white/50 backdrop-blur-sm hover:border-gray-300 text-gray-800 placeholder:text-gray-400 relative z-10 touch-manipulation`}
                      placeholder={dict.passwordPlaceholder}
                      required
                      disabled={isLoading || isGoogleLoading}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20 touch-manipulation p-1`}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div
                    className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}
                  >
                    <Link
                      href={`/${locale}/auth/forgot-password`}
                      // Link Color: Teal
                      className="text-sm text-teal-600 hover:text-teal-700 hover:underline font-medium transition-colors relative z-20 touch-manipulation"
                    >
                      {dict.forgotPasswordLink}
                    </Link>
                  </div>
                </div>

                {/* Submit Button (Teal -> Orange -> Amber) */}
                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full relative z-20 py-4 bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 rounded-xl text-base font-semibold group overflow-hidden touch-manipulation active:scale-[0.98]"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{dict.submitButtonLoading}</span>
                    </>
                  ) : (
                    <>
                      <span>{dict.submitButton}</span>
                      {isRTL ? (
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      ) : (
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      )}
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/80 text-sm font-medium text-gray-500">
                    {dict.orDivider}
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                variant="outline"
                className="w-full relative z-20 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 py-4 rounded-xl flex items-center justify-center gap-3 group transition-all duration-200 bg-white/50 backdrop-blur-sm touch-manipulation active:scale-[0.98]"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span className="font-medium">
                      {dict.googleButtonLoading}
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                      {dict.googleButton}
                    </span>
                  </>
                )}
              </Button>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  {dict.noAccountPrompt}{' '}
                  <Link
                    href={`/${locale}/auth/register`}
                    // Link Color: Teal
                    className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors inline-flex items-center gap-1 relative z-20 touch-manipulation"
                  >
                    {dict.signUpLink}
                    {isRTL ? (
                      <ArrowLeft className="w-3 h-3" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                  </Link>
                </p>
              </div>
            </div>

            {/* Bottom Shine Effect (Teal -> Orange) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-orange-400 to-amber-400 opacity-50 pointer-events-none" />
          </div>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 flex items-center gap-2 text-sm text-gray-500"
        >
          {/* Shield -> Teal */}
          <Shield className="w-4 h-4 text-teal-500" />
          <span>
            {locale === 'he'
              ? 'המידע שלך מוגן ומאובטח'
              : 'Your data is protected and secure'}
          </span>
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
