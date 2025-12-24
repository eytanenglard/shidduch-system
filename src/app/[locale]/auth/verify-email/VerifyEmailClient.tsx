// src/app/[locale]/auth/verify-email/VerifyEmailClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Send,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { VerifyEmailDict } from '@/types/dictionaries/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface VerificationState {
  status: 'pending' | 'verifying' | 'success' | 'error';
  message: string;
}

interface VerifyEmailClientProps {
  dict: VerifyEmailDict;
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
// DYNAMIC BACKGROUND COMPONENT
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
// ANIMATED ICON COMPONENTS
// ============================================================================

const AnimatedMailIcon: React.FC = () => (
  <motion.div
    className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
  >
    <motion.div
      // Gradient: Teal -> Emerald
      className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-500/20"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    {/* Inner Gradient: Teal -> Emerald */}
    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
      <Mail className="w-10 h-10 text-white" />
    </div>
  </motion.div>
);

const AnimatedSuccessIcon: React.FC = () => (
  <motion.div
    className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.5, ease: 'backOut' }}
  >
    <motion.div
      // Gradient: Green -> Emerald (Success state stays green/emerald, fits palette)
      className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30"
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.5, 0, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <CheckCircle className="w-10 h-10 text-white" />
      </motion.div>
    </div>
  </motion.div>
);

const AnimatedErrorIcon: React.FC = () => (
  <motion.div
    className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
    initial={{ scale: 0, rotate: 180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <motion.div
      // Gradient: Red -> Rose (Fits 'Rose' from palette)
      className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400/30 to-rose-500/30"
      animate={{
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg">
      <AlertCircle className="w-10 h-10 text-white" />
    </div>
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function VerifyEmailClient({
  dict,
  locale,
}: VerifyEmailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const verificationApiCallMadeRef = useRef(false);
  const isRTL = locale === 'he';

  const [verification, setVerification] = useState<VerificationState>({
    status: 'pending',
    message: '',
  });
  const [isResending, setIsResending] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (verificationApiCallMadeRef.current) return;
    verificationApiCallMadeRef.current = true;

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      if (email) {
        setInfoMessage(dict.pendingMessage);
      } else {
        setVerification({
          status: 'error',
          message: dict.errors.linkInvalid,
        });
      }
      return;
    }

    verifyToken(token);
  }, [searchParams, dict]);

  const verifyToken = async (token: string) => {
    setVerification({ status: 'verifying', message: '' });

    if (
      session?.user?.email &&
      searchParams.get('email') &&
      session.user.email !== searchParams.get('email')
    ) {
      setVerification({
        status: 'error',
        message: dict.errors.sessionMismatch,
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, type: 'EMAIL' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setVerification({ status: 'success', message: dict.successMessage });
      setTimeout(() => router.push(`/${locale}/auth/signin`), 2000);
    } catch (error) {
      let errorMessage = dict.errors.default;
      if (error instanceof Error) {
        if (error.message.includes('הטוקן כבר נוצל'))
          errorMessage = dict.errors.tokenUsed;
        else if (error.message.includes('תוקף הטוקן פג'))
          errorMessage = dict.errors.tokenExpired;
        else errorMessage = error.message;
      }
      setVerification({ status: 'error', message: errorMessage });
    }
  };

  const handleResendVerification = async () => {
    const email = searchParams.get('email');
    if (!email) {
      setVerification({ status: 'error', message: dict.errors.noEmail });
      return;
    }
    setIsResending(true);
    setVerification({ status: 'pending', message: '' });
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, type: 'EMAIL' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || dict.errors.resendFailed);
      setInfoMessage(dict.alerts.resendSuccess);
    } catch (error) {
      setVerification({
        status: 'error',
        message:
          error instanceof Error ? error.message : dict.errors.resendFailed,
      });
    } finally {
      setIsResending(false);
    }
  };

  const emailParam = searchParams.get('email');

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
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-white/60 p-8 md:p-12"
        >
          {/* Decorative Elements (Teal/Orange) */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-transparent rounded-full transform translate-x-16 -translate-y-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full transform -translate-x-16 translate-y-16 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-amber-400/5 to-transparent rounded-full blur-3xl" />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {/* Pending State */}
              {verification.status === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="text-center space-y-6"
                >
                  <AnimatedMailIcon />

                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-gray-800">
                      {dict.title}
                    </h2>

                    {infoMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Info Alert: Teal/Blue */}
                        <Alert className="border-teal-200 bg-teal-50">
                          <Sparkles className="h-5 w-5 text-teal-600" />
                          <AlertDescription className="text-teal-700">
                            {infoMessage}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    {emailParam && (
                      <div className="space-y-4 pt-4">
                        {/* Email Box: Teal Light */}
                        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100">
                          <p className="text-gray-600 text-sm mb-2">
                            {dict.emailSentTo}
                          </p>
                          <p className="text-xl font-bold text-gray-800 break-all">
                            {emailParam}
                          </p>
                        </div>

                        <p className="text-gray-600 leading-relaxed">
                          {dict.checkYourInbox}
                        </p>

                        <motion.div whileHover={{ scale: 1.02 }}>
                          {/* Resend Button: Teal -> Orange */}
                          <Button
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
                          >
                            {isResending ? (
                              <div className="flex items-center justify-center gap-3">
                                <Loader2 className="animate-spin h-5 w-5" />
                                <span>{dict.resendButtonLoading}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-3">
                                <RefreshCw className="h-5 w-5" />
                                <span>{dict.resendButton}</span>
                                <Send className="h-5 w-5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Verifying State - Updated with StandardizedLoadingSpinner */}
              {verification.status === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <StandardizedLoadingSpinner
                    text={dict.verifyingMessage}
                    subtext={
                      isRTL
                        ? 'מאמתים את הפרטים שלך...'
                        : 'Verifying your details...'
                    }
                    className="min-h-[250px]"
                  />
                </motion.div>
              )}

              {/* Success State */}
              {verification.status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="text-center space-y-6"
                >
                  <AnimatedSuccessIcon />

                  <div className="space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                      {verification.message}
                    </h2>

                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-100">
                      <div className="flex items-center justify-center gap-3">
                        <Clock className="w-5 h-5 text-teal-600" />
                        <p className="text-gray-700">{dict.successRedirect}</p>
                      </div>
                      <motion.div
                        className="mt-4"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Loader2 className="h-6 w-6 mx-auto text-teal-600" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {verification.status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="text-center space-y-6"
                >
                  <AnimatedErrorIcon />

                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-red-600">
                      {dict.errorMessage}
                    </h2>

                    <Alert
                      variant="destructive"
                      className="border-red-200 bg-red-50"
                    >
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle className="font-semibold">
                        {dict.errors.title || 'שגיאה'}
                      </AlertTitle>
                      <AlertDescription>
                        {verification.message}
                      </AlertDescription>
                    </Alert>

                    <motion.div whileHover={{ scale: 1.02 }} className="pt-4">
                      {/* Back Button: Gray/Teal */}
                      <Button
                        onClick={() => router.push(`/${locale}/auth/signin`)}
                        className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {isRTL ? (
                            <ArrowRight className="h-5 w-5" />
                          ) : (
                            <ArrowLeft className="h-5 w-5" />
                          )}
                          <span>{dict.backToSignInButton}</span>
                        </div>
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
    </div>
  );
}
