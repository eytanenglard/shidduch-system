// src/components/auth/SignInForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { SignInDict } from '@/types/dictionaries/auth';

interface SignInFormProps {
  dict: SignInDict;
  locale: 'he' | 'en';
}

const SignInForm: React.FC<SignInFormProps> = ({ dict, locale }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRTL = locale === 'he';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError(dict.errors.emptyFields);
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(dict.errors.invalidCredentials);
        setIsLoading(false);
      } else if (result?.ok) {
        router.push(`/${locale}/profile`);
      }
    } catch (err) {
      setError(dict.errors.serverError);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      await signIn('google', { callbackUrl: `/${locale}/profile` }, { hl: locale });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(dict.errors.serverError);
      setIsGoogleLoading(false);
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
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

  const errorVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 md:w-40 h-32 md:h-40 bg-gradient-to-br from-cyan-200/30 to-blue-300/20 rounded-full blur-3xl animate-soft-float" />
        <div
          className="absolute top-60 right-20 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-br from-pink-200/30 to-rose-300/20 rounded-full blur-2xl animate-soft-float"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-40 left-1/3 w-36 md:w-48 h-36 md:h-48 bg-gradient-to-br from-purple-200/20 to-violet-300/15 rounded-full blur-3xl animate-soft-float"
          style={{ animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-20 right-10 w-28 md:w-36 h-28 md:h-36 bg-gradient-to-br from-orange-200/25 to-amber-300/20 rounded-full blur-2xl animate-soft-float"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:30px_30px]" />
      </div>

      {/* Main Form Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/60 relative">
          {/* Gradient Top Border */}
          <div className="h-2 bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500" />

          {/* Decorative Elements Inside Card */}
          <div className="absolute top-8 right-8 w-20 h-20 bg-gradient-to-br from-cyan-100/40 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-8 left-8 w-16 h-16 bg-gradient-to-br from-pink-100/40 to-transparent rounded-full blur-lg pointer-events-none" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="p-6 sm:p-8 relative z-10"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {/* Header with Icon */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 transform hover:rotate-12 transition-transform duration-500">
                    <Heart className="h-10 w-10 text-white fill-white" />
                    <div className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-sm" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg animate-bounce">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text">
                {dict.title}
              </h1>
              <p className="text-gray-600 text-base">{dict.subtitle}</p>
            </motion.div>

            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-200/30 rounded-full blur-2xl" />
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-semibold text-red-800 mb-1 text-sm">
                        {dict.errors.title || 'שגיאה'}
                      </h3>
                      <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {dict.emailLabel}
                </label>
                <div className="relative group">
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} text-gray-400 group-focus-within:text-cyan-500 transition-colors duration-300`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={dict.emailPlaceholder}
                    className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-6 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-base placeholder:text-gray-400 hover:border-gray-300`}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  {dict.passwordLabel}
                </label>
                <div className="relative group">
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} text-gray-400 group-focus-within:text-cyan-500 transition-colors duration-300`}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={dict.passwordPlaceholder}
                    className={`w-full ${isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12'} py-6 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-base placeholder:text-gray-400 hover:border-gray-300`}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 hover:text-cyan-500 transition-colors duration-300 focus:outline-none`}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Forgot Password Link */}
              <motion.div variants={itemVariants} className={`${isRTL ? 'text-right' : 'text-left'}`}>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700 hover:underline transition-all duration-200 inline-flex items-center gap-1 group"
                >
                  <span>{dict.forgotPassword}</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    ←
                  </span>
                </Link>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  size="lg"
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 hover:from-cyan-600 hover:via-blue-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 text-base font-semibold text-white relative overflow-hidden group"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer" />
                      <span className="relative z-10">{dict.submitButton}</span>
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    {dict.divider}
                  </span>
                </div>
              </motion.div>

              {/* Google Sign In Button */}
              <motion.div variants={itemVariants}>
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || isGoogleLoading}
                  variant="outline"
                  size="lg"
                  className="w-full py-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 transition-all duration-300 relative group overflow-hidden"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      <svg
                        className="h-5 w-5 relative z-10"
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
                      <span className="text-gray-700 font-medium relative z-10 mx-3">
                        {dict.googleButton}
                      </span>
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Sign Up Prompt */}
            <motion.div
              variants={itemVariants}
              className="mt-8 pt-6 border-t-2 border-gray-100 text-center"
            >
              <p className="text-gray-600 text-sm">
                {dict.signUpPrompt}{' '}
                <Link
                  href={`/${locale}/auth/register`}
                  className="font-semibold text-cyan-600 hover:text-cyan-700 hover:underline transition-colors duration-200 inline-flex items-center gap-1 group"
                >
                  <span>{dict.signUpLink}</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    →
                  </span>
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Decorative Element */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white/80">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-600">
              {dict.secureConnection || 'חיבור מאובטח'}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Animations CSS */}
      <style jsx>{`
        @keyframes soft-float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(1deg);
          }
          75% {
            transform: translateY(8px) rotate(-1deg);
          }
        }
        .animate-soft-float {
          animation: soft-float 6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .group-hover\\:animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SignInForm;